import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { Car } from '../types';
import { ChevronLeft, Calendar as CalendarIcon, Clock, Shield, History, Info } from 'lucide-react';

export function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', date: '', time: '' });

  useEffect(() => {
    if (id) {
      api.cars.get(id)
        .then(setCar)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car) return;

    try {
      const reservationDate = new Date(`${formData.date}T${formData.time}`);
      await api.reservations.create({
        carId: car._id,
        userName: formData.name,
        userEmail: formData.email,
        date: reservationDate.toISOString()
      });
      alert('Reserva creada con éxito. Revisa tu email.');
      setShowModal(false);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Error al crear la reserva.');
    }
  };

  if (loading || !car) return <div className="pt-32 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--apple-gray)] mb-8 hover:text-black transition-colors">
          <ChevronLeft size={20} /> Volver al catálogo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="rounded-3xl overflow-hidden glass-card aspect-[4/3]">
              <img src={car.imageUrl} alt={car.model} className="w-full h-full object-cover" />
            </div>
            {/* Historial Público */}
            <div className="mt-12 glass-card p-8 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-6">
                <History className="text-[var(--apple-blue)]" />
                <h3 className="text-xl font-semibold">Historial del Vehículo</h3>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between border-b pb-4">
                  <span className="text-[var(--apple-gray)]">Reservas realizadas</span>
                  <span className="font-semibold">{car.reservationCount}</span>
                </div>
                <div className="flex justify-between border-b pb-4">
                  <span className="text-[var(--apple-gray)]">Última reserva</span>
                  <span className="font-semibold">{car.lastReservationDate ? new Date(car.lastReservationDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b pb-4">
                  <span className="text-[var(--apple-gray)]">Estado actual</span>
                  <span className={`font-bold ${car.status === 'AVAILABLE' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {car.status === 'AVAILABLE' ? 'Disponible' : car.status}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
            <div className="mb-6">
              <span className="text-[var(--apple-blue)] font-semibold uppercase tracking-widest text-sm">{car.brand}</span>
              <h1 className="text-4xl md:text-5xl font-bold mt-2">{car.model} {car.year}</h1>
              <p className="text-3xl font-light mt-4 italic text-gray-400">$ {car.price.toLocaleString()}</p>
            </div>

            <p className="text-lg text-[var(--apple-gray)] leading-relaxed mb-10">
              {car.description || 'Este vehículo se encuentra en excelentes condiciones y listo para ser visitado. Cada detalle ha sido cuidado para garantizar una experiencia de conducción premium.'}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs text-[var(--apple-gray)] uppercase font-bold mb-1">Visitas</p>
                <p className="text-xl font-semibold">{car.views}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs text-[var(--apple-gray)] uppercase font-bold mb-1">Interesados</p>
                <p className="text-xl font-semibold">{car.waitlist.length}</p>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <button
                onClick={() => setShowModal(true)}
                disabled={car.status === 'SOLD'}
                className="w-full btn-primary py-5 text-lg"
              >
                {car.status === 'AVAILABLE' ? 'Reservar Visita' : 'Anotarme en Lista de Espera'}
              </button>
              <p className="text-center text-xs text-[var(--apple-gray)] flex items-center justify-center gap-1">
                <Shield size={14} /> Tu reserva bloquea el auto por 30 minutos desde la hora pactada.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reservation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 w-full max-w-md relative z-10 bg-white"
            >
              <h2 className="text-2xl font-bold mb-6">Reservar Visita</h2>
              <form onSubmit={handleReserve} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                  <input
                    required
                    type="text"
                    className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    required
                    type="email"
                    className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha</label>
                    <input
                      required
                      type="date"
                      className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hora</label>
                    <input
                      required
                      type="time"
                      className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full btn-primary mt-6">Confirmar Reserva</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
