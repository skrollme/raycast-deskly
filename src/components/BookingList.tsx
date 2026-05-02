import { Booking, Preferences } from "../lib/types";
import { Action, ActionPanel, getPreferenceValues, Icon, List } from "@raycast/api";
import { renderSeatIcon, renderSeatName, renderBookingDate } from "../lib/utils";
import BookingDetail from "./BookingDetail";

export default function BookingList({ bookings }: { bookings: Booking[] }) {
  const { showLocation, showFloor, showRoom } = getPreferenceValues<Preferences>();

  return (
    <List.Section title="Next five days">
      {bookings.map((booking: Booking) => (
        <List.Item
          key={booking.date.toDateString() + booking.seat?.id}
          icon={renderSeatIcon(booking)}
          title={renderSeatName(booking)}
          subtitle={renderBookingDate(booking)}
          accessories={[
            ...(showLocation ? [{ text: booking.seatBooked?.locationName }] : []),
            ...(showFloor ? [{ text: booking.seatBooked?.floorName }] : []),
            ...(showRoom ? [{ text: booking.seatBooked?.roomName }] : []),
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Show Details"
                icon={Icon.Sidebar}
                target={<BookingDetail booking={booking} />}
              />
            </ActionPanel>
          }
        />
      ))}
    </List.Section>
  );
}
