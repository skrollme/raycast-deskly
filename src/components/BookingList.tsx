import { useState } from "react";
import { Booking, Preferences } from "../lib/types";
import { Action, ActionPanel, getPreferenceValues, Icon, List, showToast, Toast } from "@raycast/api";
import { bookingIcon, confirmDeleteBooking, renderSeatName } from "../lib/utils";
import { checkInBooking } from "../api/deskly";
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

const today = new Date();

export default function BookingList({
  bookings,
  onDeleted,
}: {
  bookings: Booking[];
  onDeleted?: (id: string) => void;
}) {
  const { apiUrl, showLocation, showFloor, showRoom } = getPreferenceValues<Preferences>();
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());

  const isCheckedIn = (booking: Booking) => booking.userCheckedIn || checkedInIds.has(booking.id);
  const effectiveIcon = (booking: Booking) => (checkedInIds.has(booking.id) ? Icon.CheckCircle : bookingIcon(booking, apiUrl));

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
              icon={effectiveIcon(booking)}
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
                  <Action.Push
                    title="Show Details"
                    icon={Icon.Sidebar}
                    target={<BookingDetail booking={booking} onDeleted={() => onDeleted?.(booking.id)} />}
                  />
                  {booking.date.toDateString() === today.toDateString() && !isCheckedIn(booking) && (
                    <Action
                      title="Check In"
                      icon={Icon.CheckCircle}
                      onAction={async () => {
                        const toast = await showToast({ style: Toast.Style.Animated, title: "Checking in…" });
                        try {
                          await checkInBooking(booking.id);
                          setCheckedInIds((prev) => new Set([...prev, booking.id]));
                          toast.style = Toast.Style.Success;
                          toast.title = "Checked in";
                        } catch (error) {
                          toast.style = Toast.Style.Failure;
                          toast.title = "Check-in failed";
                          toast.message = String(error);
                        }
                      }}
                    />
                  )}
                  <Action.OpenInBrowser
                    title="Open in Browser"
                    icon={Icon.Globe}
                    url={`${apiUrl}/de/overview/${booking.date.toISOString().substring(0, 10)}`}
                  />
                  <Action
                    title="Delete Booking"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    onAction={() => confirmDeleteBooking(booking, () => onDeleted?.(booking.id))}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </>
  );
}
