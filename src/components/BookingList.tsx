import { Booking, Preferences } from "../lib/types";
import { Action, ActionPanel, getPreferenceValues, Icon, List } from "@raycast/api";
import { bookingIcon, renderSeatName } from "../lib/utils";
import BookingDetail from "./BookingDetail";

function dayTitle(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function bookingTime(booking: Booking): string {
  if (booking.from && booking.until) {
    return `${booking.from.substring(0, 5)} – ${booking.until.substring(0, 5)}`;
  }
  return "";
}

export default function BookingList({ bookings }: { bookings: Booking[] }) {
  const { apiUrl, showLocation, showFloor, showRoom } = getPreferenceValues<Preferences>();

  const byDay = new Map<string, Booking[]>();
  for (const booking of bookings) {
    const key = booking.date.toDateString();
    const group = byDay.get(key) ?? [];
    group.push(booking);
    byDay.set(key, group);
  }

  return (
    <>
      {[...byDay.entries()].map(([, dayBookings]) => (
        <List.Section key={dayBookings[0].date.toDateString()} title={dayTitle(dayBookings[0].date)}>
          {dayBookings.map((booking) => (
            <List.Item
              key={booking.date.toDateString() + booking.seat?.id}
              icon={bookingIcon(booking, apiUrl)}
              title={renderSeatName(booking)}
              subtitle={bookingTime(booking)}
              accessories={[
                ...(showLocation ? [{ text: booking.seatBooked?.locationName ?? booking.seat?.locationName }] : []),
                ...(showFloor
                  ? [{ text: booking.seatBooked?.floorName ?? booking.seat?.floorName, icon: Icon.ArrowUp }]
                  : []),
                ...(showRoom ? [{ text: booking.seatBooked?.roomName ?? booking.seat?.roomName, icon: Icon.Map }] : []),
              ]}
              actions={
                <ActionPanel>
                  <Action.Push title="Show Details" icon={Icon.Sidebar} target={<BookingDetail booking={booking} />} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </>
  );
}
