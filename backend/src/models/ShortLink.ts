import mongoose, { Schema, Document } from 'mongoose';

export interface IShortLink extends Document {
    originalUrl: string;
    shortCode: string;
    createdAt: Date;
}

const ShortLinkSchema: Schema = new Schema({
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 } // Expira en 30 días
});

export const ShortLink = mongoose.model<IShortLink>('ShortLink', ShortLinkSchema);
