import { Booking } from "./types";
import { Icon } from "@raycast/api";

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

export function renderSeatIcon(booking: Booking): Icon {
  if (booking.userStatus == "absent") {
    return Icon.Multiply;
  } else if (booking.userStatus == "home") {
    return Icon.House;
  } else if (booking.userStatus == "office") {
    return Icon.Building;
  } else {
    return Icon.QuestionMark;
  }
}

export function renderSeatName(booking: Booking): string {
  if (booking.seat?.name) {
    return booking.seat?.name;
  } else if (booking.seatBooked?.name) {
    return booking.seatBooked?.name;
  } else {
    return "No seat booked";
  }
}
