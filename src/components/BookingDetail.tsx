import { Detail, Icon } from "@raycast/api";
import { Booking } from "../lib/types";
import { renderSeatIcon, renderSeatName } from "../lib/utils";

export default function BookingDetail({ booking }: { booking: Booking }) {
  const seat = booking.seatBooked ?? booking.seat;
  const dateStr = booking.date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const markdown = `# ${renderSeatName(booking)}\n\n${dateStr}`;

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Date" text={dateStr} icon={Icon.Calendar} />
          {booking.from && booking.until && (
            <Detail.Metadata.Label
              title="Time"
              text={`${booking.from.substring(0, 5)} – ${booking.until.substring(0, 5)}`}
              icon={Icon.Clock}
            />
          )}
          {booking.userStatus && (
            <Detail.Metadata.Label
              title="Status"
              text={booking.userStatus.charAt(0).toUpperCase() + booking.userStatus.slice(1)}
              icon={renderSeatIcon(booking)}
            />
          )}
          {booking.multipleBookings && (
            <Detail.Metadata.Label title="Multiple Bookings" icon={Icon.Ellipsis} text="Yes" />
          )}
          {seat && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.Label title="Seat" text={seat.name} icon={Icon.Dot} />
              {seat.number != null && <Detail.Metadata.Label title="Number" text={String(seat.number)} />}
              {seat.locationName && (
                <Detail.Metadata.Label title="Location" text={seat.locationName} icon={Icon.Building} />
              )}
              {seat.floorName && (
                <Detail.Metadata.Label title="Floor" text={seat.floorName} icon={Icon.ArrowUp} />
              )}
              {seat.roomName && <Detail.Metadata.Label title="Room" text={seat.roomName} icon={Icon.Map} />}
            </>
          )}
        </Detail.Metadata>
      }
    />
  );
}
