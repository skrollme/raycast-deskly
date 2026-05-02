import { List } from "@raycast/api";
import { useEffect, useState } from "react";
import { fetchBookings } from "../api/deskly";
import { Booking } from "../lib/types";
import BookingList from "./BookingList";

export default function DayBookingList({ date }: { date: Date }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings(date.getFullYear(), date.getMonth() + 1)
      .then((all) => {
        setBookings(all.filter((b) => b.date.toDateString() === date.toDateString()));
        setIsLoading(false);
      })
      .catch(console.error);
  }, []);

  const title = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <List isLoading={isLoading}>
      <BookingList bookings={bookings} title={title} />
    </List>
  );
}
