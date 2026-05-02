# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development mode with hot reload
npm run build        # Build the extension for production
npm run lint         # Run ESLint
npm run fix-lint     # Auto-fix lint issues
npm run publish      # Publish to Raycast store
```

There are no automated tests. Validate changes by running `npm run dev` and testing in Raycast directly.

## Architecture

This is a Raycast extension for managing [desk.ly](https://desk.ly) desk-sharing bookings. It uses token-based auth (refresh token stored in Raycast preferences) to call the desk.ly REST API.

### Commands (entry points)

- [src/next-bookings.tsx](src/next-bookings.tsx) — "Next Bookings" list view command; fetches calendar data and renders upcoming bookings
- [src/todays-booking.tsx](src/todays-booking.tsx) — "Today's Bookings" no-view command; runs every 15 minutes in the background; fetches today's booking via `fetchBookings` and updates the command subtitle with seat name + time, or "No booking today"

### API layer

[src/api/deskly.tsx](src/api/deskly.tsx) is the sole HTTP client. Key functions:

- `fetchCalendar()` — primary endpoint used by `next-bookings`; returns next bookings with `seatBooked` field
- `fetchBookings()` — month-based endpoint using `seat` field instead of `seatBooked`
- `fetchInformation()` — returns user info; caches result in `LocalStorage`
- `fetchAccessToken()` — exchanges the refresh token for a short-lived access token; caches in `LocalStorage` with expiration tracking; called automatically before every authenticated request

The two endpoints return structurally similar `Booking` objects but use different field names for the booked seat: `fetchCalendar` → `booking.seatBooked`, `fetchBookings` → `booking.seat`. The `renderSeatName()` utility handles both.

### Auth flow

1. Raycast preference `refreshToken` is the user's long-lived credential
2. Before any API call, `fetchAccessToken()` checks `LocalStorage` for a cached access token
3. If missing or expired, it posts to `/de/api/authorize/refreshToken` to get a new one
4. The access token is sent as `Authorization: Bearer <token>`

### Types

All shared interfaces live in [src/lib/types.tsx](src/lib/types.tsx): `Preferences`, `Booking`, `BookingSeat`, `AuthData`, `Information`.

### Utilities

[src/lib/utils.tsx](src/lib/utils.tsx) has three pure rendering helpers:

- `renderBookingDate(booking)` — formats date as "Today", "Tomorrow", or weekday + time range
- `renderSeatName(booking)` — reads from `booking.seat` or `booking.seatBooked`
- `renderSeatIcon(booking)` — maps `userStatus` ("absent" / "home" / "office") to an icon

### Configuration

The extension declares two Raycast preferences in `package.json`:

- `apiUrl` — optional, defaults to `https://app.desk.ly`
- `refreshToken` — required; obtain from a desk.ly session

Prettier is configured for 120-character line width with double quotes (see [.prettierrc](.prettierrc)).
