export interface Preferences {
  apiUrl: string;
  refreshToken: string;
  showLocation: boolean;
  showFloor: boolean;
  showRoom: boolean;
}

export interface Booking {
  date: Date;
  multipleBookings: boolean | null;
  seat: BookingSeat | null;
  seatBooked: BookingSeat | null;
  from: string | null;
  until: string | null;
  userStatus: string | null;
}

export interface BookingSeat {
  id: string;
  number: number | null;
  name: string;
  floorName: string;
  locationName: string;
  roomName: string;
}

export interface AuthData {
  token: string;
  tokenExpiration: number;
  refreshToken: string;
  refreshTokenExpiration: number;
}

export interface Information {
  user: {
    id: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}
