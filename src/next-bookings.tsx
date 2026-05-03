import {
  Action,
  ActionPanel,
  getPreferenceValues,
  Icon,
  LaunchProps,
  LaunchType,
  List,
  popToRoot,
  updateCommandMetadata,
  useNavigation,
} from "@raycast/api";
import BookingList from "./components/BookingList";
import BookingDetail from "./components/BookingDetail";
import { fetchBookings } from "./api/deskly";
import { Booking, Preferences } from "./lib/types";
import { useEffect, useState } from "react";
import { renderBookingDate, renderSeatName } from "./lib/utils";

export default function Command(props: LaunchProps) {
  const preferences = getPreferenceValues<Preferences>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { push } = useNavigation();
  const openTodayBooking = (props.launchContext as { openTodayBooking?: boolean } | undefined)?.openTodayBooking;

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      const [current, next] = await Promise.all([fetchBookings(year, month), fetchBookings(nextYear, nextMonth)]);

      const all = [...current, ...next]
        .filter((b) => b.date >= today)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      setBookings(all);
      setIsLoading(false);
    };

    fetchData().catch((err) => {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (bookings && bookings.length > 0) {
      updateCommandMetadata({ subtitle: `${renderSeatName(bookings[0])} - ${renderBookingDate(bookings[0])}` });
    } else {
      updateCommandMetadata({ subtitle: `No future bookings` });
    }
  }, [bookings]);

  useEffect(() => {
    if (!openTodayBooking || isLoading) return;
    const today = new Date();
    const todayBooking = bookings.find((b) => b.date.toDateString() === today.toDateString());
    if (todayBooking) push(<BookingDetail booking={todayBooking} onDeleted={popToRoot} />);
  }, [isLoading]);

  if (props.launchType === LaunchType.Background) {
    return;
  }

  if (error) {
    return (
      <List>
        <List.EmptyView
          title="Authentication Failed"
          description={error}
          icon={Icon.ExclamationMark}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={preferences.apiUrl} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  if (!bookings || isLoading || bookings.length === 0) {
    return (
      <List isLoading={isLoading}>
        <List.EmptyView
          title={`No bookings found`}
          description={`Please check the website for more information`}
          icon={Icon.XMarkCircle}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={preferences.apiUrl} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading}>
      <BookingList key="booking-list" bookings={bookings} />
    </List>
  );
}
