import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ADMIN'], default: 'ADMIN' },
    name: String
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
