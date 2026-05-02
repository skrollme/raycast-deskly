import { useState, useEffect } from "react";
import {
  Action,
  ActionPanel,
  confirmAlert,
  Alert,
  Detail,
  Icon,
  launchCommand,
  LaunchType,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { Booking } from "../lib/types";
import { renderSeatName } from "../lib/utils";
import { deleteBooking, fetchRoomPlanImage } from "../api/deskly";

export default function BookingDetail({ booking, onDeleted }: { booking: Booking; onDeleted?: () => void }) {
  const seat = booking.seatBooked ?? booking.seat;
  const [roomPlanDataUri, setRoomPlanDataUri] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(!!booking.seat?.room);
  const { pop } = useNavigation();

  async function handleDelete() {
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
      onDeleted ? onDeleted() : pop();
      await launchCommand({ name: "todays-booking", type: LaunchType.Background });
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to delete booking";
      toast.message = String(error);
    }
  }

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
      actions={
        <ActionPanel>
          <Action title="Delete Booking" icon={Icon.Trash} style={Action.Style.Destructive} onAction={handleDelete} />
        </ActionPanel>
      }
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
