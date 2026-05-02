import {
  Action,
  ActionPanel,
  getPreferenceValues,
  Icon,
  LaunchProps,
  LaunchType,
  List,
  updateCommandMetadata,
} from "@raycast/api";
import BookingList from "./components/BookingList";
import { fetchCalendar } from "./api/deskly";
import { Booking, Preferences } from "./lib/types";
import { useEffect, useState } from "react";
import { renderBookingDate, renderSeatName } from "./lib/utils";

export default function Command(props: LaunchProps) {
  const preferences = getPreferenceValues<Preferences>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchCalendar();
      setBookings(data);
      setIsLoading(false);
    };

    fetchData().catch(console.error);
  }, []);

  useEffect(() => {
    if (bookings && bookings.length > 0) {
      updateCommandMetadata({ subtitle: `${renderSeatName(bookings[0])} - ${renderBookingDate(bookings[0])}` });
    } else {
      updateCommandMetadata({ subtitle: `No future bookings` });
    }
  }, [bookings]);

  if (props.launchType === LaunchType.Background) {
    return;
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
