import { useEffect, useState } from "react";
import { getPreferenceValues, LocalStorage, showToast, Toast } from "@raycast/api";
import { AuthData, Booking, Information, Preferences, RefreshTokenResponse } from "../lib/types";
import { useFetch } from "@raycast/utils";
import fetch from "node-fetch";
import { authorize, client } from "../oauth/google";

export async function fetchInformation(accessToken: string): Promise<Information> {
  const preferences = getPreferenceValues<Preferences>();

  let information = await LocalStorage.getItem<Information>("information").then(function (value: string | undefined) {
    return value ? JSON.parse(value) : null;
  });

  if (information) {
    return information;
  }

  const response = await fetch(preferences.apiUrl + "/de/api/information", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  information = (await response.json()) as Information;
  await LocalStorage.setItem("information", JSON.stringify(information));
  return information;
}

export async function fetchBookings(): Promise<Booking[]> {
  const preferences = getPreferenceValues<Preferences>();
  const authData = await fetchAccessToken();
  const information = await fetchInformation(authData.token);

  const zeroPad = (num, places) => String(num).padStart(places, "0");

  const year = new Date().getFullYear();
  const month = zeroPad(new Date().getMonth() + 1, 2);

  const response = await fetch(
    preferences.apiUrl + `/de/api/dayBookings/user/${information.user.id}/year/${year}/month/${month}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.token}`,
      },
    }
  );

  const midnight = new Date().setHours(0, 0, 0, 0);
  return (await response.json())
    .map((result: Booking) => {
      const booking = result as Booking;
      booking.date = new Date(result.date);
      return booking;
    })
    .filter((booking: Booking) => booking.date >= midnight);
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

  return (await response.json()).map((result: Booking) => {
    const booking = result as Booking;
    booking.date = new Date(result.date);
    return booking;
  });
}

export function fetchCalendarOld(): [Booking[], boolean] {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const preferences = getPreferenceValues<Preferences>();

  //authorize();
  //client.getTokens().then((r) => console.log(r));

  fetchAccessTokenOld(accessToken, setAccessToken);

  useFetch(preferences.apiUrl + "/de/api/homepage/calendar", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    onError: () => {
      setAccessToken(null);
      showToast({
        style: Toast.Style.Failure,
        title: `Reauthorizing`,
        message: `AccessToken expired`,
      }).then((r) => console.log(r));
    },
    parseResponse: async function (response: Response) {
      const json = await response.json();

      if (!response.ok || "message" in json) {
        throw new Error("message" in json ? json.message : response.statusText);
      }

      setBookings(
        json.map((result: Booking) => {
          const booking = result as Booking;
          booking.date = new Date(result.date);
          return booking;
        })
      );
      setIsLoading(false);
    },
    execute: accessToken != null,
    keepPreviousData: true,
  });

  return [bookings, isLoading];
}

async function fetchAccessToken(): Promise<AuthData> {
  const preferences = getPreferenceValues<Preferences>();
  let authData = await LocalStorage.getItem<AuthData>("authData").then(function (value: string | undefined) {
    return value ? JSON.parse(value) : {};
  });

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

  authData = (await response.json()) as AuthData;
  await LocalStorage.setItem("authData", JSON.stringify(authData));

  return authData!;
}

function fetchAccessTokenOld(accessToken: string | null, setAccessToken: (token: string | null) => void) {
  const preferences = getPreferenceValues<Preferences>();

  useEffect(() => {
    LocalStorage.getItem<string>("authData").then(function (value: string | undefined) {
      if (value) {
        const authData = JSON.parse(value);

        if (authData.tokenExpiration > new Date().getTime()) {
          setAccessToken(authData.token);
        } else {
          setAccessToken(null);
        }
      }
    });
  }, []);

  useFetch(preferences.apiUrl + "/de/api/authorize/refreshToken", {
    method: "POST",
    body: JSON.stringify({ refreshToken: preferences.refreshToken }),
    headers: {
      "Content-Type": "application/json",
    },
    parseResponse: async function (response) {
      const data = (await response.json()) as RefreshTokenResponse;
      const authData = {
        token: data.token,
        tokenExpiration: new Date().getTime() * (24 * 60 * 60),
        refreshToken: data.refreshToken,
        refreshTokenExpiration: parseInt(data.refresh_token_expiration || "0"),
      } as AuthData;

      await LocalStorage.setItem("authData", JSON.stringify(authData));
      setAccessToken(data.token);
    },
    execute: accessToken == null,
    keepPreviousData: true,
  });
}
