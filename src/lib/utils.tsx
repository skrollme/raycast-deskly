import { Booking } from "./types";
import { Icon } from "@raycast/api";

export function renderSectionTitle(date: Date | null): string {
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  if (date === null) {
    return "-";
  }

  if (date.toDateString() == today.toDateString()) {
    return "Today";
  } else if (date.toDateString() == tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    return weekday[date.getDay()];
  }
}

export function renderSeatIcon(booking: Booking) {
  if (booking.userStatus == "absent") {
    return Icon.Multiply;
  } else if (booking.userStatus == "home") {
    return Icon.House;
  } else if (booking.userStatus == "office") {
    return Icon.Building;
  } else {
    return Icon.QuestionMark;
  }
}

export function renderSeatName(booking: Booking): string {
  let seatName = renderSectionTitle(booking.date) + ":";
  if (booking.seatBooked?.name) {
    seatName += " " + booking.seatBooked?.name;
  }

  return seatName;
}

export function renderSeatNo(booking: Booking): string {
  if (booking.seatBooked?.locationName) {
    return (
      booking.seatBooked!.locationName + ", " + booking.seatBooked!.floorName + ", " + booking.seatBooked!.roomName
    );
  }
  return "no seat booked";
}
