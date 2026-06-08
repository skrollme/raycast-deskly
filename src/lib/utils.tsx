import { Booking } from "./types";
import { Alert, confirmAlert, Icon, Image, launchCommand, LaunchType, showToast, Toast } from "@raycast/api";
import { deleteBooking } from "../api/deskly";

export function renderBookingDate(booking: Booking): string {
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  if (booking === null) {
    return "-";
  }

  let bookingDate = "";

  if (booking.date.toDateString() == today.toDateString()) {
    bookingDate = "Today";
  } else if (booking.date.toDateString() == tomorrow.toDateString()) {
    bookingDate = "Tomorrow";
  } else {
    bookingDate = weekday[booking.date.getDay()];
  }

  if (booking.from && booking.until) {
    return `${bookingDate} (${booking.from?.substring(0, 5)} - ${booking.until?.substring(0, 5)})`;
  }

  return bookingDate;
}

export function profileIcon(profileImage: string | undefined | null, apiUrl: string): Icon | Image.ImageLike {
  if (profileImage) {
    const src = profileImage.startsWith("http") ? profileImage : apiUrl + profileImage;
    return { source: src, mask: Image.Mask.Circle };
  }
  return Icon.Person;
}

export function bookingIcon(booking: Booking, apiUrl: string): Icon | Image.ImageLike {
  if (booking.userCheckedIn) return Icon.CheckCircle;
  return profileIcon(booking.profileImage, apiUrl);
}

export async function confirmDeleteBooking(booking: Booking, onDeleted: () => void): Promise<void> {
  const dateStr = booking.date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const confirmed = await confirmAlert({
    title: "Delete Booking",
    message: `Delete your booking for ${renderSeatName(booking)} on ${dateStr}?`,
    primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
  });
  if (!confirmed) return;

  const toast = await showToast({ style: Toast.Style.Animated, title: "Deleting booking…" });
  try {
    await deleteBooking(booking.id);
    toast.style = Toast.Style.Success;
    toast.title = "Booking deleted";
    onDeleted();
    await launchCommand({ name: "todays-booking", type: LaunchType.Background });
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to delete booking";
    toast.message = String(error);
  }
}

export function renderSeatName(booking: Booking): string {
  if (booking.seat?.name) {
    return booking.seat?.name;
  } else if (booking.seatBooked?.name) {
    return booking.seatBooked?.name;
  } else if (booking.multipleBookings) {
    return "Multiple bookings";
  } else {
    return "No seat booked";
  }
}
