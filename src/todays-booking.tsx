import { launchCommand, LaunchProps, LaunchType, updateCommandMetadata } from "@raycast/api";
import { fetchBookings } from "./api/deskly";
import { renderSeatName } from "./lib/utils";

export default async function Command(props: LaunchProps) {
  const today = new Date(Date.now());
  const bookings = await fetchBookings(today.getFullYear(), today.getMonth() + 1);

  const todayBookings = bookings.filter((booking) => booking.date.toDateString() === today.toDateString());

  if (todayBookings.length > 1) {
    await updateCommandMetadata({ subtitle: "Multiple bookings for this day" });
  } else if (todayBookings.length === 1) {
    const seat = todayBookings[0].seat ?? todayBookings[0].seatBooked;
    const details = [seat?.floorName, seat?.roomName].filter(Boolean).join(" · ");
    await updateCommandMetadata({ subtitle: `${renderSeatName(todayBookings[0])}${details ? ` - ${details}` : ""}` });
  } else {
    await updateCommandMetadata({ subtitle: "No booking today" });
  }

  if (props.launchType === LaunchType.Background) return;

  if (todayBookings.length === 0) {
    await launchCommand({
      name: "book-a-seat",
      type: LaunchType.UserInitiated,
      context: { defaultDate: today.toISOString() },
    });
  } else {
    await launchCommand({ name: "next-bookings", type: LaunchType.UserInitiated, context: { openTodayBooking: true } });
  }
}
