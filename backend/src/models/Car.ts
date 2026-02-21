import mongoose from 'mongoose';

const CarSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  images: [{ type: String }], // Gallery
  frontImageUrl: String,
  leftImageUrl: String,
  rightImageUrl: String,
  upImageUrl: String,
  backImageUrl: String,
  interiorImageUrl: String,
  description: String,
  status: {
    type: String,
    enum: ['AVAILABLE', 'RESERVED', 'SOLD', 'STANDBY', 'NEGOTIATION', 'VISITED'],
    default: 'AVAILABLE'
  },
  views: { type: Number, default: 0 },
  reservationCount: { type: Number, default: 0 },
  lastReservationDate: Date,
  lastVisitDate: Date,
  waitlist: [{
    userEmail: { type: String, required: true },
    userName: { type: String, required: false },
    joinedAt: { type: Date, default: Date.now }
  }],
  history: [{
    event: String, // 'RESERVATION', 'CANCELLATION', 'VISIT', 'SALE'
    date: { type: Date, default: Date.now },
    details: String
  }]
}, { timestamps: true });

export const Car = mongoose.model('Car', CarSchema);

