import { getPreferenceValues, LocalStorage } from "@raycast/api";
import { AuthData, Booking, Information, Preferences } from "../lib/types";
import fetch from "node-fetch";

export async function fetchInformation(accessToken: string): Promise<Information> {
  const preferences = getPreferenceValues<Preferences>();

  const cached = await LocalStorage.getItem<string>("information");
  if (cached) {
    return JSON.parse(cached) as Information;
  }

  const response = await fetch(preferences.apiUrl + "/de/api/information", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const information = (await response.json()) as Information;
  await LocalStorage.setItem("information", JSON.stringify(information));
  return information;
}

export async function fetchBookings(year: number, month: number): Promise<Booking[]> {
  const preferences = getPreferenceValues<Preferences>();
  const authData = await fetchAccessToken();
  const information = await fetchInformation(authData.token);

  const zeroPad = (num: number, places: number) => String(num).padStart(places, "0");

  const response = await fetch(
    preferences.apiUrl + `/de/api/dayBookings/user/${information.user.id}/year/${year}/month/${zeroPad(month, 2)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.token}`,
      },
    }
  );

  return ((await response.json()) as Booking[]).map((result: Booking) => {
    const booking = result as Booking;
    booking.date = new Date(result.date);
    return booking;
  });
}

export async function fetchCalendar(): Promise<Booking[]> {
  const preferences = getPreferenceValues<Preferences>();
  const authData = await fetchAccessToken();

  const response = await fetch(preferences.apiUrl + `/de/api/homepage/calendar`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authData.token}`,
    },
  });

  return ((await response.json()) as Booking[]).map((result: Booking) => {
    const booking = result as Booking;
    booking.date = new Date(result.date);
    return booking;
  });
}

async function fetchAccessToken(): Promise<AuthData> {
  const preferences = getPreferenceValues<Preferences>();

  const cached = await LocalStorage.getItem<string>("authData");
  const authData: AuthData | null = cached ? (JSON.parse(cached) as AuthData) : null;

  if (authData && authData.tokenExpiration > new Date().getTime()) {
    return authData;
  }

  const response = await fetch(preferences.apiUrl + "/de/api/authorize/refreshToken", {
    method: "POST",
    body: JSON.stringify({ refreshToken: preferences.refreshToken }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const freshAuthData = (await response.json()) as AuthData;
  await LocalStorage.setItem("authData", JSON.stringify(freshAuthData));
  return freshAuthData;
}
