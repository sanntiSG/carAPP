import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { Reservation } from '../models/Reservation';
import { Car } from '../models/Car';
import { authMiddleware } from '../middleware/auth';
import { sendEmail } from '../services/mail.service';
import { notifyWaitlist } from '../services/waitlist.service';

const router = express.Router();

// PUBLIC: Create reservation
router.post('/', async (req: Request, res: Response) => {
    try {
        const { carId, userEmail, userName, date } = req.body;

        if (!carId || !userEmail || !userName || !date) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        // Check if user already has an active reservation for THIS car
        const existing = await Reservation.findOne({ carId, userEmail, status: 'CONFIRMED' });
        if (existing) {
            return res.status(400).json({ error: 'Ya tienes una reserva activa para este vehículo.' });
        }

        const car = await Car.findById(carId);
        if (!car || (car.status !== 'AVAILABLE' && car.status !== 'STANDBY')) {
            // If not available, offer waitlist
            if (car) {
                // Check if already in waitlist
                const alreadyInWaitlist = car.waitlist.some(w => w.userEmail === userEmail);
                if (!alreadyInWaitlist) {
                    car.waitlist.push({
                        userEmail,
                        userName: userName || 'Interesado',
                        joinedAt: new Date()
                    } as any);
                    await car.save();

                    // Create a "WAITING" reservation so it's visible in admin panel
                    const waitlistReservation = new Reservation({
                        carId,
                        userEmail,
                        userName,
                        date: new Date(), // Just for record
                        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60000), // Far in the future
                        status: 'WAITING'
                    });
                    await waitlistReservation.save();

                    // Notify user they joined the waitlist
                    sendEmail({
                        to: `${userName} <${userEmail}>`,
                        subject: `Lista de espera: ${car.brand} ${car.model}`,
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                <h2>Te hemos anotado en la lista de espera</h2>
                                <p>Hola ${userName},</p>
                                <p>El <strong>${car.brand} ${car.model}</strong> se encuentra reservado momentáneamente.</p>
                                <p>Te avisaremos de inmediato si el auto vuelve a estar disponible. Eres el número <strong>${car.waitlist.length}</strong> en la fila.</p>
                            </div>
                        `
                    });
                }
                return res.status(200).json({ message: 'Added to waitlist', status: 'WAITLIST' });
            }
            return res.status(400).json({ error: 'Car not found' });
        }

        const appointmentDate = new Date(date);
        const expiresAt = new Date(appointmentDate.getTime() + 30 * 60000); // 30 min expiration
        const cancellationCode = crypto.randomBytes(16).toString('hex');

        const reservation = new Reservation({
            carId,
            userEmail,
            userName,
            date: appointmentDate,
            expiresAt,
            cancellationCode,
            status: 'CONFIRMED'
        });

        await reservation.save();

        // Update Car
        car.status = 'RESERVED';
        car.reservationCount += 1;
        car.lastReservationDate = new Date();
        car.history.push({
            event: 'RESERVATION',
            date: new Date(),
            details: `Reserved by ${userName} (${userEmail})`
        });
        await car.save();

        // Send Email
        const cancelLink = `${process.env.FRONTEND_URL}/cancel/${cancellationCode}`;
        sendEmail({
            to: `${userName} <${userEmail}>`,
            subject: `Reserva Confirmada: ${car.brand} ${car.model}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h1 style="color: #000;">¡Hola ${userName}!</h1>
                    <p>Tu visita para ver el <strong>${car.brand} ${car.model}</strong> ha sido reservada con éxito.</p>
                    <div style="background: #f4f4f4; padding: 15px; border-radius: 10px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Fecha y hora:</strong> ${appointmentDate.toLocaleString()}</p>
                    </div>
                    <p>⚠️ <strong>Importante:</strong> Tienes hasta 30 minutos después de la hora pactada para presentarte. De lo contrario, la reserva vencerá automáticamente.</p>
                    <p>Si no puedes asistir, por favor cancela tu reserva aquí:</p>
                    <a href="${cancelLink}" style="display: inline-block; padding: 10px 20px; background: #FF3B30; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Cancelar Reserva</a>
                </div>
            `
        });

        res.status(201).json(reservation);
    } catch (error: any) {
        console.error('Reservation creation error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Error de validación',
                details: Object.values(error.errors).map((err: any) => err.message)
            });
        }

        res.status(500).json({ error: 'Ha ocurrido un error al procesar la reserva.' });
    }
});

// PUBLIC: Cancel reservation via code
router.post('/cancel/:code', async (req: Request, res: Response) => {
    try {
        const reservation = await Reservation.findOne({ cancellationCode: req.params.code, status: 'CONFIRMED' });
        if (!reservation) return res.status(404).json({ error: 'Reservation not found or already cancelled' });

        reservation.status = 'CANCELLED';
        await reservation.save();

        const car = await Car.findById(reservation.carId);
        if (car) {
            car.status = 'AVAILABLE';
            car.history.push({
                event: 'CANCELLATION',
                date: new Date(),
                details: `Reservation cancelled by user ${reservation.userEmail}`
            });
            await car.save();

            // Notify Waitlist
            notifyWaitlist((car._id as any).toString(), 'AVAILABLE');
        }

        res.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel reservation' });
    }
});

// ADMIN: Get all reservations
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const reservations = await Reservation.find().populate('carId').sort({ date: 1 });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reservations' });
    }
});

// ADMIN: Update reservation status (Visitado, etc)
router.patch('/:id/status', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { status, nextCarStatus } = req.body; // status: COMPLETED | CANCELLED, nextCarStatus: AVAILABLE | SOLD | NEGOTIATION
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

        reservation.status = status;
        await reservation.save();

        const car = await Car.findById(reservation.carId);
        if (car) {
            if (status === 'COMPLETED') {
                // Determine intended final car status (defaulting to VISITED if not provided, but we'll try to use nextCarStatus)
                const finalStatus = nextCarStatus || 'VISITED';
                car.status = finalStatus;
                car.lastVisitDate = new Date();
                car.history.push({
                    event: 'VISIT_AND_DECISION',
                    date: new Date(),
                    details: `Visit completed by ${reservation.userName}. Car status set to ${finalStatus}.`
                });

                // Trigger waitlist notifications based on the result
                if (finalStatus === 'AVAILABLE') {
                    notifyWaitlist((car._id as any).toString(), 'AVAILABLE');
                } else if (['SOLD', 'NEGOTIATION'].includes(finalStatus)) {
                    notifyWaitlist((car._id as any).toString(), finalStatus);
                }

            } else if (status === 'CANCELLED') {
                car.status = 'AVAILABLE';
                car.history.push({
                    event: 'CANCELLATION',
                    date: new Date(),
                    details: `Reservation cancelled by admin`
                });
                // Notify waitlist when availability returns
                notifyWaitlist((car._id as any).toString(), 'AVAILABLE');
            }
            await car.save();
        }

        res.json(reservation);
    } catch (error) {
        console.error('Error updating reservation status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// ADMIN: Export reservations to CSV
router.get('/export', authMiddleware, async (req: Request, res: Response) => {
    try {
        const reservations = await Reservation.find().populate('carId').sort({ createdAt: -1 });

        let csv = 'Fecha,Cliente,Email,Auto,Precio,Estado\n';
        reservations.forEach((r: any) => {
            const date = new Date(r.date || r.createdAt).toLocaleString();
            const carName = r.carId ? `${r.carId.brand} ${r.carId.model}` : 'N/A';
            const price = r.carId ? r.carId.price : 'N/A';
            csv += `"${date}","${r.userName}","${r.userEmail}","${carName}","${price}","${r.status}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=reservas.csv');
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ error: 'Error al exportar' });
    }
});

// ADMIN: Clear all waitlist entries
router.delete('/waitlist', authMiddleware, async (req: Request, res: Response) => {
    try {
        // 1. Delete all WAITING reservations
        await Reservation.deleteMany({ status: 'WAITING' });

        // 2. Clear waitlist array from all cars
        await Car.updateMany({}, { $set: { waitlist: [] } });

        res.json({ message: 'Lista de espera vaciada por completo' });
    } catch (error) {
        res.status(500).json({ error: 'Error al vaciar lista de espera' });
    }
});

// ADMIN: Clear finished/cancelled reservations
router.delete('/all', authMiddleware, async (req: Request, res: Response) => {
    try {
        await Reservation.deleteMany({ status: { $in: ['COMPLETED', 'CANCELLED'] } });
        res.json({ message: 'Historial de reservas finalizadas vaciado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al vaciar historial' });
    }
});

export default router;
