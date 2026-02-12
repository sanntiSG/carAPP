export type CarStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'STANDBY' | 'NEGOTIATION' | 'VISITED';

export interface Car {
  _id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  imageUrl: string;
  images?: string[];
  status: CarStatus;
  views: number;
  reservationCount: number;
  lastReservationDate?: string;
  lastVisitDate?: string;
  description: string;
  waitlist: { userEmail: string; joinedAt: string }[];
  history: { event: string; date: string; details: string }[];
}

export interface Reservation {
  _id: string;
  carId: string | Car;
  userEmail: string;
  userName: string;
  date: string;
  createdAt: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
  expiresAt: string;
  cancellationCode?: string;
}

export interface Setting {
  _id: string;
  key: string;
  value: any;
}
