import express, { Request, Response } from 'express';
import { Car } from '../models/Car';
import { Reservation } from '../models/Reservation';
import { authMiddleware } from '../middleware/auth';
import { notifyWaitlist } from '../services/waitlist.service';

const router = express.Router();

// PUBLIC: Get all cars (with filters)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { brand, year, minPrice, maxPrice, status } = req.query;
        let query: any = {};

        if (brand) query.brand = new RegExp(brand as string, 'i');
        if (year) query.year = year;
        if (status) query.status = status;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const cars = await Car.find(query).sort({ createdAt: -1 });
        res.json(cars);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cars' });
    }
});

// PUBLIC: Get car by ID & track view
router.get('/:id', async (req: Request, res: Response) => {
    try {
        // Find and increment views atomically
        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!car) return res.status(404).json({ error: 'Car not found' });

        res.json(car);
    } catch (error) {
        console.error('Error fetching car:', error);
        res.status(500).json({ error: 'Error fetching car' });
    }
});

// ADMIN: Create car
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const car = new Car(req.body);
        await car.save();
        res.status(201).json(car);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create car' });
    }
});

// ADMIN: Update car
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const oldCar = await Car.findById(req.params.id);

        const car: any = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // If status changed, notify waitlist and handle reservations
        if (oldCar && status && oldCar.status !== status) {
            notifyWaitlist((car?._id as any).toString(), status);

            // If the car is no longer basically available (Sold/Señado), or even if it's back to Available,
            // we should "disable" the previous confirmed reservation for this car.
            if (['SOLD', 'NEGOTIATION', 'AVAILABLE'].includes(status)) {
                await Reservation.updateMany(
                    { carId: car?._id, status: 'CONFIRMED' },
                    { status: 'COMPLETED' }
                );
            }

            // Log in history
            if (car) {
                car.history.push({
                    event: 'STATUS_CHANGE',
                    date: new Date(),
                    details: `Status manually changed from ${oldCar.status} to ${status}`
                });
                await car.save();
            }
        }

        res.json(car);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update car' });
    }
});

// ADMIN: Delete car
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        await Car.findByIdAndDelete(req.params.id);
        res.json({ message: 'Car deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete car' });
    }
});

export default router;
