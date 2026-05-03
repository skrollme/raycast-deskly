import {
  Action,
  ActionPanel,
  Form,
  Icon,
  launchCommand,
  LaunchProps,
  LaunchType,
  popToRoot,
  showToast,
  Toast,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useEffect, useState } from "react";
import { bookSeat, fetchBookings, fetchFavoriteSeats, fetchInformation } from "./api/deskly";
import { Booking } from "./lib/types";
import DesklyEmptyView from "./components/DesklyEmptyView";

function nextWeekday(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

async function fetchBookingFormData() {
  const [favoriteSeats, information] = await Promise.all([fetchFavoriteSeats(), fetchInformation()]);

  const maxDays = information.accountInformation?.maxBookingDays ?? 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + maxDays + 1);

  const months: { year: number; month: number }[] = [];
  const cursor = new Date(today.getFullYear(), today.getMonth(), 1);
  while (cursor <= endDate) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const allBookings: Booking[] = (
    await Promise.all(months.map(({ year, month }) => fetchBookings(year, month)))
  ).flat();

  const relevantBookings = allBookings
    .filter((b) => {
      const d = new Date(b.date);
      d.setHours(0, 0, 0, 0);
      return d >= today && d <= endDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastBookedDate = new Date(relevantBookings.length > 0 ? relevantBookings[0].date : today);
  lastBookedDate.setHours(0, 0, 0, 0);

  console.log(lastBookedDate);

  return { favoriteSeats, defaultDate: nextWeekday(lastBookedDate), maxDays };
}

export default function Command(props: LaunchProps) {
  const contextDate = (props.launchContext as { defaultDate?: string } | undefined)?.defaultDate;
  const { data, isLoading, error } = useCachedPromise(fetchBookingFormData);
  const [date, setDate] = useState<Date | null | undefined>(contextDate ? new Date(contextDate) : undefined);
  const [dateError, setDateError] = useState<string | undefined>();
  const [seatError, setSeatError] = useState<string | undefined>();

  useEffect(() => {
    if (data?.defaultDate !== undefined && date === undefined) {
      setDate(data.defaultDate);
    }
  }, [data]);

  const hasNoFavorites = !isLoading && (!data?.favoriteSeats || data.favoriteSeats.length === 0);

  if (error) {
    return (
      <DesklyEmptyView
        title="Error"
        description={error instanceof Error ? error.message : "An unexpected error occurred."}
        icon={Icon.ExclamationMark}
      />
    );
  }

  if (hasNoFavorites) {
    return (
      <DesklyEmptyView
        title="No favorite seats"
        description="You have no favorite seats set. Please add favorites on the desk.ly website before booking."
        icon={Icon.XMarkCircle}
      />
    );
  }

  async function handleSubmit(values: { date: Date | null; seat: string }) {
    let valid = true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDays = data?.maxDays ?? 30;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + maxDays + 1);

    if (!values.date) {
      setDateError("Please select a date.");
      valid = false;
    } else {
      const selected = new Date(values.date);
      selected.setHours(0, 0, 0, 0);
      if (selected < today || selected > endDate) {
        setDateError(`Date must be between today and ${endDate.toLocaleDateString()}.`);
        valid = false;
      } else {
        setDateError(undefined);
      }
    }

    if (!values.seat) {
      setSeatError("Please select a seat.");
      valid = false;
    } else {
      setSeatError(undefined);
    }

    if (!valid || !values.date) return;

    const seat = data?.favoriteSeats.find((s) => s.id === values.seat);
    if (!seat) return;

    const toast = await showToast({ style: Toast.Style.Animated, title: "Booking seat…" });
    try {
      await bookSeat(values.date, seat);
      toast.style = Toast.Style.Success;
      toast.title = "Seat booked!";
      const bookedDate = new Date(values.date);
      bookedDate.setHours(0, 0, 0, 0);
      if (bookedDate.getTime() === today.getTime()) {
        await launchCommand({ name: "todays-booking", type: LaunchType.Background });
      }
      await popToRoot();
    } catch (e) {
      toast.style = Toast.Style.Failure;
      toast.title = "Booking failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Book Seat" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.DatePicker
        id="date"
        title="Date"
        type={Form.DatePicker.Type.Date}
        value={date ?? null}
        error={dateError}
        onChange={(newDate) => {
          setDate(newDate);
          setDateError(undefined);
        }}
      />
      <Form.Dropdown id="seat" title="Seat" error={seatError} onChange={() => setSeatError(undefined)}>
        {(data?.favoriteSeats ?? []).map((seat) => (
          <Form.Dropdown.Item
            key={seat.id}
            value={seat.id}
            title={`${seat.name} (${seat.floorName} · ${seat.roomName})`}
          />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
