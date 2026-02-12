import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g., 'dealership_hours'
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    description: String
}, { timestamps: true });

export const Setting = mongoose.model('Setting', SettingSchema);
