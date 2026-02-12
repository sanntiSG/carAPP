import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Car } from '../types';
import { CarCard } from '../components/CarCard';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

export function Catalog() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  useEffect(() => {
    gsap.fromTo(".gsap-header",
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power4.out" }
    );

    // ... rest of the logic
    const loadCars = async () => {
      try {
        const data = await api.cars.list();
        setCars(data);
      } catch (error) {
        console.error('Failed to load cars', error);
      } finally {
        setLoading(false);
      }
    };
    loadCars();
  }, []);

  const filteredCars = cars.filter(car => {
    const matchesSearch =
      car.brand.toLowerCase().includes(filter.toLowerCase()) ||
      car.model.toLowerCase().includes(filter.toLowerCase());
    const matchesBrand = brandFilter ? car.brand === brandFilter : true;
    return matchesSearch && matchesBrand;
  });

  const uniqueBrands = Array.from(new Set(cars.map(c => c.brand)));

  return (
    <div className="min-h-screen bg-[var(--apple-bg)] pt-32 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4 gsap-header"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-[var(--apple-text)] tracking-tight">
            Encuentra tu próximo viaje.
          </h1>
          <p className="text-xl md:text-2xl text-[var(--apple-gray)] max-w-2xl mx-auto font-medium">
            Reserva una visita. Vívelo. Decide.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--apple-blue)] transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar por modelo..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-[var(--apple-blue)] outline-none transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-4 md:pb-0 no-scrollbar">
            <button
              onClick={() => setBrandFilter('')}
              className={`px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${!brandFilter ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              Todos
            </button>
            {uniqueBrands.map(brand => (
              <button
                key={brand}
                onClick={() => setBrandFilter(brand)}
                className={`px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${brandFilter === brand ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-96 bg-gray-200 rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCars.map(car => (
              <CarCard key={car._id} car={car} />
            ))}
          </div>
        )}

        {!loading && filteredCars.length === 0 && (
          <div className="text-center py-32 glass-card bg-white/50">
            <p className="text-gray-400 text-xl font-medium">No se encontraron vehículos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
