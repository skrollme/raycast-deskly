import {ActionPanel, Detail, List, Action, LocalStorage, Icon, showToast, Toast} from "@raycast/api";
import { getPreferenceValues } from "@raycast/api";
import {AuthData, Booking, Preferences, RefreshTokenResponse} from "./lib/types";
import {useEffect, useState} from "react";
import {useFetch} from "@raycast/utils";
import BookingList from "./components/BookingList";

export default function Command() {
  const [ accessToken, setAccessToken ] = useState<string|null>(null)
  const [ isLoading, setIsLoading ] = useState<boolean>(true)
  const [ bookings, setBookings] = useState<Booking[]>([]);
  const preferences = getPreferenceValues<Preferences>();

  console.log("render");

  // ablauf vom accessToken prüfen. ggf direkt im effekt hier?
  useEffect(() => {
    LocalStorage.getItem<string|null>("authData").then(function (value: string|null) {
      if(value) {
        const authData = JSON.parse(value);

        if(authData.tokenExpiration > (new Date()).getTime()) {
          setAccessToken(authData.token);
        } else {
          setAccessToken(null);
        }
      }
    })
  },[])

  useFetch(preferences.apiUrl + "/de/api/authorize/refreshToken", {
    method: "POST",
    body: JSON.stringify({ refreshToken: preferences.refreshToken }),
    headers: {
      "Content-Type": "application/json",
    },
    parseResponse: async function(response) {
      const data = (await response.json()) as RefreshTokenResponse;
      const authData = {
        token: data.token,
        tokenExpiration: (new Date()).getTime() * (24*60*60),
        refreshToken: data.refreshToken,
        refreshTokenExpiration: parseInt(data.refresh_token_expiration)
      } as AuthData;

      await LocalStorage.setItem("authData", JSON.stringify(authData));
      setAccessToken(data.token);
    },
    execute: accessToken == null,
    keepPreviousData: true,
  });

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
      });
    },
    parseResponse: async function(response: Response) {
      const json = await response.json();

      if (!response.ok || "message" in json) {
        throw new Error("message" in json ? json.message : response.statusText);
      }

      setBookings(json.map((result) => {
        return {
          date: new Date(result.date),
          seatBooked: {
            id: result.seatBooked?.id,
            name: result.seatBooked?.name,
            number: result.seatBooked?.number,
            floorName: result.seatBooked?.floorName,
            locationName: result.seatBooked?.locationName,
            roomName: result.seatBooked?.roomName,
          },
          from: result.from,
          until: result.until,
          userStatus: result.userStatus,
        } as Booking;
      }));
      setIsLoading(false)
    },
    execute: accessToken != null,
    keepPreviousData: true,
  });

  return (
    <List
      isLoading={isLoading}
    >
      <BookingList key="booking-list" bookings={bookings} />
    </List>
  );
}
