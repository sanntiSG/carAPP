import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema({
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED', 'WAITING'],
    default: 'CONFIRMED'
  },
  expiresAt: { type: Date, required: true }, // 30 min after 'date'
  cancellationCode: { type: String, unique: true, sparse: true } // sparse allows multiple nulls if not provided
}, { timestamps: true });

export const Reservation = mongoose.model('Reservation', ReservationSchema);
