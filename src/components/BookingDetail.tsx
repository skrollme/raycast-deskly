import { useState, useEffect } from "react";
import { Detail, Icon } from "@raycast/api";
import { Booking } from "../lib/types";
import { renderSeatName } from "../lib/utils";
import { fetchRoomPlanImage } from "../api/deskly";

export default function BookingDetail({ booking }: { booking: Booking }) {
  const seat = booking.seatBooked ?? booking.seat;
  const [roomPlanDataUri, setRoomPlanDataUri] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(!!booking.seat?.room);

  const dateStr = booking.date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const seatObj = booking.seat;
    if (!seatObj?.room) return;

    setIsLoadingImage(true);
    fetchRoomPlanImage(seatObj.room, seatObj)
      .then(setRoomPlanDataUri)
      .finally(() => setIsLoadingImage(false));
  }, [booking.seat?.room]);

  const imageMarkdown = roomPlanDataUri ? `\n\n![Floor Plan](${roomPlanDataUri})` : "";
  const markdown = `# ${renderSeatName(booking)}\n\n${dateStr}${imageMarkdown}`;

  return (
    <Detail
      isLoading={isLoadingImage}
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
          {booking.multipleBookings && (
            <Detail.Metadata.Label title="Multiple Bookings" icon={Icon.Ellipsis} text="Yes" />
          )}
          {seat && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.Label title="Seat" text={seat.name} icon={Icon.Dot} />
              {seat.locationName && (
                <Detail.Metadata.Label title="Location" text={seat.locationName} icon={Icon.Building} />
              )}
              {seat.floorName && <Detail.Metadata.Label title="Floor" text={seat.floorName} icon={Icon.ArrowUp} />}
              {seat.roomName && <Detail.Metadata.Label title="Room" text={seat.roomName} icon={Icon.Map} />}
              {seat.number != null && <Detail.Metadata.Label title="Number" text={String(seat.number)} />}
            </>
          )}
        </Detail.Metadata>
      }
    />
  );
}
