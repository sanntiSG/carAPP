import { Car } from '../models/Car';
import { Reservation } from '../models/Reservation';
import { sendEmail } from './mail.service';

export const notifyWaitlist = async (carId: string, status: string) => {
    const car = await Car.findById(carId);
    if (!car || !car.waitlist || car.waitlist.length === 0) return;

    const waitlist = car.waitlist;

    if (status === 'AVAILABLE') {
        const firstUser = waitlist[0];

        // Remove the "WAITING" reservation for this user as they are being notified
        await Reservation.findOneAndDelete({ carId, userEmail: firstUser.userEmail, status: 'WAITING' });

        sendEmail({
            to: `${firstUser.userName} <${firstUser.userEmail}>`,
            subject: `¡Buenas noticias! El ${car.brand} ${car.model} está disponible`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #0076FF;">¡Es tu turno!</h2>
                    <p>Hola ${firstUser.userName},</p>
                    <p>Te informamos que el <strong>${car.brand} ${car.model}</strong> ya está disponible para reserva.</p>
                    <p>Eres el <strong>primero en la lista de espera</strong>. ¡Aprovecha y resérvalo ahora antes de que alguien más lo haga!</p>
                    <a href="${process.env.FRONTEND_URL}/car/${car._id}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px;">Reservar ahora</a>
                </div>
            `
        });
    } else if (status === 'SOLD' || status === 'NEGOTIATION') {
        const statusLabel = status === 'SOLD' ? 'vendido' : 'señado';

        for (const user of waitlist) {
            sendEmail({
                to: `${user.userName} <${user.userEmail}>`,
                subject: `Actualización de inventario: ${car.brand} ${car.model}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #FF3B30;">Auto no disponible</h2>
                        <p>Hola ${user.userName},</p>
                        <p>Te informamos que el <strong>${car.brand} ${car.model}</strong> por el cual estabas en lista de espera ha sido <strong>${statusLabel}</strong>.</p>
                        <p>Te invitamos a revisar nuestro catálogo para encontrar otras opciones similares.</p>
                        <a href="${process.env.FRONTEND_URL}/" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px;">Ver catálogo</a>
                    </div>
                `
            });
        }

        // Clear waitlist and remove associated WAITING reservations
        await Reservation.deleteMany({ carId, status: 'WAITING' });

        car.waitlist = [];
        await car.save();
    }
};
