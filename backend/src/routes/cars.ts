import express, { Request, Response } from 'express';
import { Car } from '../models/Car';
import { Reservation } from '../models/Reservation';
import { authMiddleware } from '../middleware/auth';
import { notifyWaitlist } from '../services/waitlist.service';
import multer from 'multer';
import path from 'path';
import {
    moderateAndUploadImage,
    moderateImageUrl,
    listLibraryImages,
    listLibraryFolders
} from '../services/image.service';

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes (jpg, jpeg, png, webp)'));
    }
});

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

// ADMIN: Get uploaded images (optionally by folder)
router.get('/library', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { folder } = req.query;
        const images = await listLibraryImages(folder as string);
        res.json(images);
    } catch (error: any) {
        res.status(500).json({ error: 'Error al obtener la galería' });
    }
});

// ADMIN: Get all library folders
router.get('/list-folders', authMiddleware, async (req: Request, res: Response) => {
    try {
        const folders = await listLibraryFolders();
        res.json(folders);
    } catch (error: any) {
        res.status(500).json({ error: 'Error al obtener las carpetas' });
    }
});

// PUBLIC: Get car by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ error: 'Car not found' });
        res.json(car);
    } catch (error) {
        console.error('Error fetching car:', error);
        res.status(500).json({ error: 'Error fetching car' });
    }
});

// PUBLIC: Track view (increment)
router.post('/:id/view', async (req: Request, res: Response) => {
    try {
        await Car.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to track view' });
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

        const car: any = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

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

// ADMIN: Upload image with moderation
router.post('/upload-image', authMiddleware, upload.single('image'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        const result = await moderateAndUploadImage(req.file.path);

        if (!result.safe) {
            return res.status(400).json({ error: result.message });
        }

        res.json({ url: result.url });
    } catch (error: any) {
        console.error('Upload route error:', error);
        res.status(500).json({ error: error.message || 'Error al subir la imagen' });
    }
});

// ADMIN: Moderate image by URL
router.post('/moderate-url', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Se requiere una URL de imagen' });
        }

        const result = await moderateImageUrl(url);

        if (!result.safe) {
            return res.status(400).json({ error: result.message });
        }

        res.json({ safe: true });
    } catch (error: any) {
        console.error('Moderate URL route error:', error);
        res.status(500).json({ error: error.message || 'Error al validar la URL' });
    }
});

export default router;
