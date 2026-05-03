import { Icon, LaunchProps, LaunchType, List, popToRoot, updateCommandMetadata, useNavigation } from "@raycast/api";
import BookingList from "./components/BookingList";
import BookingDetail from "./components/BookingDetail";
import DesklyEmptyView from "./components/DesklyEmptyView";
import { fetchBookings } from "./api/deskly";
import { Booking } from "./lib/types";
import { useEffect, useState } from "react";
import { renderBookingDate, renderSeatName } from "./lib/utils";

export default function Command(props: LaunchProps) {
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
    return <DesklyEmptyView title="Error" description={error} icon={Icon.ExclamationMark} />;
  }

  if (!bookings || isLoading || bookings.length === 0) {
    return (
      <DesklyEmptyView
        title="No bookings found"
        description="Please check the website for more information"
        icon={Icon.XMarkCircle}
        isLoading={isLoading}
      />
    );
  }

  return (
    <List isLoading={isLoading}>
      <BookingList key="booking-list" bookings={bookings} />
    </List>
  );
}
