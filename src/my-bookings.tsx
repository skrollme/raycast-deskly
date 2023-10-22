import { Action, ActionPanel, getPreferenceValues, Icon, List } from "@raycast/api";
import BookingList from "./components/BookingList";
import { fetchCalendar } from "./api/deskly-api";
import { Preferences } from "./lib/types";

export default function Command() {
  const [bookings, isLoading] = fetchCalendar();
  const preferences = getPreferenceValues<Preferences>();

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
