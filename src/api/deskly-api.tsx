import { useEffect, useState } from "react";
import { getPreferenceValues, LocalStorage, showToast, Toast } from "@raycast/api";
import { AuthData, Booking, Preferences, RefreshTokenResponse } from "../lib/types";
import { useFetch } from "@raycast/utils";

export function fetchCalendar(): [Booking[], boolean] {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const preferences = getPreferenceValues<Preferences>();

  fetchAccessToken(accessToken, setAccessToken);

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

function fetchAccessToken(accessToken: string | null, setAccessToken: (token: string | null) => void) {
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
