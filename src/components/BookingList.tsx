import { Booking, Preferences } from "../lib/types";
import { Action, ActionPanel, getPreferenceValues, Icon, List } from "@raycast/api";
import { renderSeatIcon, renderSeatName, renderBookingDate } from "../lib/utils";
import BookingDetail from "./BookingDetail";
import DayBookingList from "./DayBookingList";

export default function BookingList({ bookings, title = "Next five days" }: { bookings: Booking[]; title?: string }) {
  const { showLocation, showFloor, showRoom } = getPreferenceValues<Preferences>();

  return (
    <List.Section title={title}>
      {bookings.map((booking: Booking) => (
        <List.Item
          key={booking.date.toDateString() + booking.seat?.id}
          icon={renderSeatIcon(booking)}
          title={renderSeatName(booking)}
          subtitle={renderBookingDate(booking)}
          accessories={
            booking.multipleBookings
              ? []
              : [
                  ...(showLocation ? [{ text: booking.seatBooked?.locationName ?? booking.seat?.locationName }] : []),
                  ...(showFloor ? [{ text: booking.seatBooked?.floorName ?? booking.seat?.floorName, icon: Icon.ArrowUp }] : []),
                  ...(showRoom ? [{ text: booking.seatBooked?.roomName ?? booking.seat?.roomName, icon: Icon.Map }] : []),
                ]
          }
          actions={
            <ActionPanel>
              {booking.multipleBookings ? (
                <Action.Push
                  title="Show Day Bookings"
                  icon={Icon.Calendar}
                  target={<DayBookingList date={booking.date} />}
                />
              ) : (
                <Action.Push
                  title="Show Details"
                  icon={Icon.Sidebar}
                  target={<BookingDetail booking={booking} />}
                />
              )}
            </ActionPanel>
          }
        />
      ))}
    </List.Section>
  );
}
