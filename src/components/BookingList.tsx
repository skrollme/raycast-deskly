import { Booking } from "../lib/types";
import {Icon, List} from "@raycast/api";
import {renderSeatIcon, renderSeatName, renderSeatNo, renderSectionTitle} from "../lib/utils";

export default function BookingList({ bookings }: { bookings: Booking[] }) {
  return (
    <List.Section title="Next five days">
      {bookings.map((booking: Booking) => (
        <List.Item key={"section-"+booking.date.toDateString()} icon={renderSeatIcon(booking)} title={renderSeatName(booking)} subtitle={renderSeatNo(booking)}></List.Item>
      ))}
    </List.Section>
  );
}
