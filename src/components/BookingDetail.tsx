import { useState, useEffect } from "react";
import { Action, ActionPanel, Detail, getPreferenceValues, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { Booking, Preferences } from "../lib/types";
import { confirmDeleteBooking, renderSeatName } from "../lib/utils";
import { checkInBooking, fetchRoomPlanImage } from "../api/deskly";

export default function BookingDetail({ booking, onDeleted }: { booking: Booking; onDeleted?: () => void }) {
  const { apiUrl } = getPreferenceValues<Preferences>();
  const seat = booking.seatBooked ?? booking.seat;
  const [roomPlanDataUri, setRoomPlanDataUri] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(!!booking.seat?.room);
  const [checkedIn, setCheckedIn] = useState(booking.userCheckedIn ?? false);
  const { pop } = useNavigation();

  const isToday = booking.date.toDateString() === new Date().toDateString();

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
          <Action.OpenInBrowser
            title="Open in Browser"
            icon={Icon.Globe}
            url={`${apiUrl}/de/overview/${booking.date.toISOString().substring(0, 10)}`}
          />
          {isToday && !checkedIn && (
            <Action
              title="Check In"
              icon={Icon.CheckCircle}
              onAction={async () => {
                const toast = await showToast({ style: Toast.Style.Animated, title: "Checking in…" });
                try {
                  await checkInBooking(booking.id);
                  setCheckedIn(true);
                  toast.style = Toast.Style.Success;
                  toast.title = "Booking confirmed";
                } catch (error) {
                  toast.style = Toast.Style.Failure;
                  toast.title = "Check-in failed";
                  toast.message = String(error);
                }
              }}
            />
          )}
          <Action
            title="Delete Booking"
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            onAction={() => confirmDeleteBooking(booking, onDeleted ?? pop)}
          />
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          {checkedIn && <Detail.Metadata.Label title="" text="Checked in" icon={Icon.CheckCircle} />}
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
              {seat.roomName && <Detail.Metadata.Label title="Room" text={seat.roomName} icon={Icon.Map} />}
              {seat.floorName && <Detail.Metadata.Label title="Floor" text={seat.floorName} icon={Icon.ArrowUp} />}
              {seat.locationName && (
                <Detail.Metadata.Label title="Location" text={seat.locationName} icon={Icon.Building} />
              )}
            </>
          )}
        </Detail.Metadata>
      }
    />
  );
}
