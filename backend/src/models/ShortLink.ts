import mongoose, { Schema, Document } from 'mongoose';

export interface IShortLink extends Document {
    originalUrl: string;
    shortCode: string;
    createdAt: Date;
}

const ShortLinkSchema: Schema = new Schema({
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now } // Ahora son permanentes (sin expirar)
});

export const ShortLink = mongoose.model<IShortLink>('ShortLink', ShortLinkSchema);