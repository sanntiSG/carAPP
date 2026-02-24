import mongoose from 'mongoose';
import { User } from './models/User';
import { Car } from './models/Car';
import { Setting } from './models/Setting';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-dealer-dev';

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Car.deleteMany({});
        await Setting.deleteMany({});

        // Create Admin
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD deben estar definidos en el archivo .env');
        }

        const admin = new User({
            email: adminEmail,
            password: adminPassword,
            name: 'Dealer Admin',
            role: 'ADMIN'
        });
        await admin.save();
        console.log('Admin user created.');

        // Create Cars
        const cars = [
            {
                brand: 'Porsche',
                model: '911 Carrera',
                year: 2024,
                price: 120000,
                imageUrl: 'https://images.unsplash.com/photo-1503376710383-300067648f32?auto=format&fit=crop&q=80&w=1000',
                description: 'The iconic sports car with timeless design.',
                status: 'AVAILABLE',
                views: 52
            },
            {
                brand: 'Audi',
                model: 'RS7 Sportback',
                year: 2023,
                price: 115000,
                imageUrl: 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&q=80&w=1000',
                description: 'Performance meets luxury in this stunning grand tourer.',
                status: 'AVAILABLE',
                views: 89
            },
            {
                brand: 'Mercedes-Benz',
                model: 'G-Class',
                year: 2024,
                price: 140000,
                imageUrl: 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&q=80&w=1000',
                description: 'The ultimate luxury off-roader.',
                status: 'AVAILABLE',
                views: 120
            }
        ];
        await Car.insertMany(cars);
        console.log('Sample cars created.');

        // Create Default Schedule (Settings)
        const defaultSchedule = {
            monday: { open: '09:00', close: '19:00' },
            tuesday: { open: '09:00', close: '19:00' },
            wednesday: { open: '09:00', close: '19:00' },
            thursday: { open: '09:00', close: '19:00' },
            friday: { open: '09:00', close: '19:00' },
            saturday: { open: '09:00', close: '14:00' },
            sunday: { open: null, close: null }
        };

        await Setting.create({
            key: 'dealership_hours',
            value: defaultSchedule,
            description: 'Weekly business hours'
        });
        console.log('Default schedule created.');

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();