export interface Preferences {
  apiUrl: string;
  refreshToken: string;
}

export interface Booking {
  date: Date;
  seatBooked: BookingSeat|null;
  from: string|null;
  until: string|null;
  userStatus: string|null;
}

export interface BookingSeat {
  id: string;
  number: string;
  name: string;
  floorName: string;
  locationName: string;
  roomName: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string|null;
  refresh_token_expiration: string|null;
}

export interface AuthData {
  token: string;
  tokenExpiration: number;
  refreshToken: string;
  refreshTokenExpiration: number;
}
