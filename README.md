# Desk.ly for Raycast

Manage your [desk.ly](https://desk.ly) desk-sharing bookings directly from Raycast — view upcoming bookings, book a seat, and keep an eye on today's reservation without leaving your keyboard.

> **Disclaimer:** This extension is an independent community project and is not affiliated with, endorsed by, or officially supported by desk.ly or its operators.

## Commands

### Next Bookings

Displays a list of your upcoming desk.ly reservations. Each booking shows the seat name, date, time range, and optionally the location, floor, and room (configurable in preferences). You can view booking details and delete existing bookings directly from the list.

### Book a Seat

Opens an interactive view to search for available seats and create a new booking for a chosen date and time slot.

### Today's Bookings

A background command that runs every 15 minutes and surfaces your current-day booking as a subtitle in the Raycast menu bar. Shows the booked seat name and time range, or "No booking today" when nothing is scheduled.

## Setup

### 1. Get your Refresh Token

The extension authenticates with desk.ly using a refresh token stored in your browser session:

1. Open [app.desk.ly](https://app.desk.ly) in your browser and log in.
2. Open the browser's developer tools:
   - **Chrome / Edge:** `F12` → **Application** tab → **Storage → Cookies** → select `https://app.desk.ly`
   - **Firefox:** `F12` → **Storage** tab → **Cookies** → select `https://app.desk.ly`
   - **Safari:** Enable the Develop menu first, then `Develop → Show Web Inspector` → **Storage** → **Cookies**
3. Find the cookie named **`refreshToken`** and copy its value.

### 2. Configure the Extension

Open Raycast, search for any Desk.ly command, and press `⌘` `⏎` to open its preferences (or go to `Raycast Settings → Extensions → Desk.ly`):

| Preference | Required | Description |
| --- | --- | --- |
| **Refresh Token** | Yes | The `refreshToken` cookie value copied above |
| **API URL** | No | Override if you use a self-hosted desk.ly instance (default: `https://app.desk.ly`) |
| **Show Location** | No | Show the location name as an accessory in the booking list |
| **Show Floor** | No | Show the floor name as an accessory in the booking list (default: on) |
| **Show Room** | No | Show the room name as an accessory in the booking list (default: on) |

## Notes

- The refresh token is a long-lived credential. Treat it like a password — do not share it.
- If your token expires or becomes invalid, repeat the steps above to obtain a fresh one and update the preference.
- The extension caches a short-lived access token internally so that repeated commands do not trigger unnecessary network requests.
