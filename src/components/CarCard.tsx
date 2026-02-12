import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Eye, Calendar } from 'lucide-react';

interface CarCardProps {
  car: {
    _id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    imageUrl: string;
    status: string;
    views: number;
    reservationCount: number;
  };
}

export const CarCard = ({ car }: CarCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-700';
      case 'RESERVED': return 'bg-amber-100 text-amber-700';
      case 'SOLD': return 'bg-gray-100 text-gray-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Disponible';
      case 'RESERVED': return 'Reservado';
      case 'SOLD': return 'Vendido';
      case 'VISITED': return 'En Visita';
      default: return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card group flex flex-col overflow-hidden h-full"
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={car.imageUrl}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(car.status)}`}>
            {getStatusLabel(car.status)}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-semibold leading-tight">{car.brand} {car.model}</h3>
            <p className="text-[var(--apple-gray)] text-sm">{car.year}</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold italic">$ {car.price.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-[var(--apple-gray)] text-xs border-t border-gray-100 pt-4">
          <div className="flex items-center gap-1">
            <Eye size={14} />
            <span>{car.views} vistas</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{car.reservationCount} reservado</span>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <Link
            to={`/car/${car._id}`}
            className="w-full btn-secondary text-center block text-sm group-hover:bg-[var(--apple-text)] group-hover:text-white transition-all"
          >
            Ver Detalles
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
