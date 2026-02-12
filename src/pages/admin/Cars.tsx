import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Car as CarType } from '../../types';
import { Plus, Edit3, Trash2, Eye, Calendar, Tag, X, Image as ImageIcon, DollarSign, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminCars() {
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Partial<CarType> | null>(null);

  const loadCars = async () => {
    try {
      const data = await api.cars.list();
      setCars(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCars();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCar?._id) {
        await api.cars.update(editingCar._id, editingCar);
      } else {
        await api.cars.create(editingCar);
      }
      setShowModal(false);
      loadCars();
    } catch (error) {
      alert('Error al guardar el vehículo');
    }
  };

  const deleteCar = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este vehículo? Esto borrará también su historial.')) {
      try {
        await api.cars.delete(id);
        loadCars();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-gray-900 italic">Inventario</h1>
          <p className="text-gray-500 font-bold mt-2 text-lg">Control total sobre tus unidades disponibles.</p>
        </div>
        <button
          onClick={() => { setEditingCar({}); setShowModal(true); }}
          className="group flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> Nuevo Vehículo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {cars.map((car) => (
            <motion.div
              layout
              key={car._id}
              className="group glass-card overflow-hidden flex flex-col transition-all duration-500 border-2 border-gray-50 hover:border-black shadow-sm hover:shadow-2xl"
            >
              <div className="h-64 relative overflow-hidden">
                <img src={car.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => { setEditingCar(car); setShowModal(true); }}
                    className="p-3 bg-white text-black rounded-xl hover:bg-black hover:text-white transition-all shadow-lg active:scale-90"
                    title="Editar"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => deleteCar(car._id)}
                    className="p-3 bg-white text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-90"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="absolute bottom-4 left-4">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${car.status === 'AVAILABLE' ? 'bg-emerald-500 text-white' :
                    car.status === 'SOLD' ? 'bg-gray-900 text-white' :
                      'bg-amber-400 text-black'
                    }`}>
                    {car.status === 'AVAILABLE' ? 'En Stock' : car.status === 'SOLD' ? 'Vendido' : car.status}
                  </span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter">{car.brand} {car.model}</h3>
                    <p className="text-gray-400 font-black text-xs uppercase tracking-widest">{car.year}</p>
                  </div>
                  <p className="text-xl font-black text-black italic bg-gray-50 px-3 py-1 rounded-lg">
                    ${car.price.toLocaleString()}
                  </p>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Vistas</span>
                      <span className="flex items-center gap-1.5 text-sm font-black text-gray-600"><Eye size={14} className="text-blue-500" /> {car.views}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Citas</span>
                      <span className="flex items-center gap-1.5 text-sm font-black text-gray-600"><Calendar size={14} className="text-amber-500" /> {car.reservationCount}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-right">Interesados</span>
                    <span className="flex items-center gap-1 text-sm font-black text-black">
                      {car.waitlist?.length || 0} <Plus size={10} className="text-gray-400" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Car Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setShowModal(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 w-full max-w-3xl relative z-10 max-h-[95vh] overflow-y-auto shadow-2xl overflow-x-hidden"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter italic">{editingCar?._id ? 'Editar Unidad' : 'Nueva Unidad'}</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Completa todos los campos obligatorios.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-black hover:text-white transition-all group">
                  <X size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Marca</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input required placeholder="Ej: BMW" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl outline-none transition-all font-bold" value={editingCar?.brand || ''} onChange={e => setEditingCar({ ...editingCar, brand: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Modelo</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input required placeholder="Ej: Serie 3 320i" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl outline-none transition-all font-bold" value={editingCar?.model || ''} onChange={e => setEditingCar({ ...editingCar, model: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Año</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input required type="number" placeholder="Ej: 2024" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl outline-none transition-all font-bold" value={editingCar?.year || ''} onChange={e => setEditingCar({ ...editingCar, year: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Precio (USD)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input required type="number" placeholder="0.00" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl outline-none transition-all font-bold" value={editingCar?.price || ''} onChange={e => setEditingCar({ ...editingCar, price: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">URL de Imagen</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input required placeholder="https://..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl outline-none transition-all font-bold" value={editingCar?.imageUrl || ''} onChange={e => setEditingCar({ ...editingCar, imageUrl: e.target.value })} />
                    </div>
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Descripción</label>
                    <textarea rows={4} placeholder="Detalles del equipamiento, estado, etc..." className="w-full p-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-3xl outline-none transition-all font-bold" value={editingCar?.description || ''} onChange={e => setEditingCar({ ...editingCar, description: e.target.value })} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 font-black text-gray-400 uppercase tracking-widest text-xs hover:text-black transition-colors">Cancelar</button>
                  <button type="submit" className="px-12 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-xl shadow-black/20">
                    {editingCar?._id ? 'Guardar Cambios' : 'Ingresar Vehículo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
