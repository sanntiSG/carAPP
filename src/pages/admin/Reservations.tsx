import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Reservation } from '../../types';
import { CheckCircle, XCircle, Clock, ChevronDown, Info, Settings2, Calendar, Hash, DollarSign, PenTool, ShoppingBag, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [visitingId, setVisitingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const loadReservations = async () => {
    try {
      const data = await api.reservations.list();
      const sorted = (data as Reservation[]).sort((a, b) => {
        if (a.status === 'CONFIRMED' && b.status !== 'CONFIRMED') return -1;
        if (a.status !== 'CONFIRMED' && b.status === 'CONFIRMED') return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setReservations(sorted);
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 401) {
        window.location.href = '/admin';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleVisitComplete = async (id: string, nextCarStatus: string) => {
    try {
      await api.reservations.updateStatus(id, 'COMPLETED', nextCarStatus);
      setVisitingId(null);
      loadReservations();
    } catch (error) {
      alert('Error al actualizar estado');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.reservations.updateStatus(id, status);
      loadReservations();
    } catch (error) {
      alert('Error al actualizar estado');
    }
  };

  const handleCarStatusUpdate = async (carId: string, status: string) => {
    try {
      await api.cars.update(carId, { status });
      setAdjustingId(null);
      loadReservations();
    } catch (error) {
      alert('Error al actualizar el vehículo');
    }
  };

  const filteredReservations = reservations.filter(res => {
    if (filter === 'ALL') return true;
    return res.status === filter;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return { style: 'bg-black text-white', label: 'Pendiente' };
      case 'COMPLETED': return { style: 'bg-emerald-500 text-white', label: 'Finalizada' };
      case 'CANCELLED': return { style: 'bg-gray-200 text-gray-500', label: 'Cancelada' };
      default: return { style: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-hidden animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 italic">Agenda</h1>
          <p className="text-gray-400 font-bold mt-1 text-sm uppercase tracking-widest">Gestión de flujo operativo</p>
        </div>

        <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-gray-100 shadow-sm w-full md:w-fit overflow-x-auto">
          {(['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest ${filter === f ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-900'
                }`}
            >
              {f === 'ALL' ? 'Todas' : f === 'CONFIRMED' ? 'Pendientes' : f === 'COMPLETED' ? 'Finalizadas' : 'Canceladas'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredReservations.map((res: any) => {
            const config = getStatusConfig(res.status);
            const isInactive = res.status !== 'CONFIRMED';
            const isExpanded = expandedId === res._id;
            const isBeingVisited = visitingId === res._id;
            const isAdjusting = adjustingId === res._id;

            return (
              <motion.div
                key={res._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group bg-white rounded-3xl overflow-hidden border-2 transition-all duration-300 ${isInactive ? 'border-transparent opacity-75' : 'border-white shadow-sm hover:shadow-xl'}`}
              >
                {/* Main Row */}
                <div className="flex flex-col sm:flex-row items-center p-4 gap-4 sm:gap-6">
                  {/* Photo */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                    <img
                      src={res.carId?.imageUrl}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    <div className={`absolute inset-0 opacity-20 ${res.status === 'CANCELLED' ? 'bg-red-500' : ''}`} />
                  </div>

                  {/* Client & Car basic info */}
                  <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <span className={`w-fit mx-auto sm:mx-0 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${config.style}`}>
                        {config.label}
                      </span>
                      <p className="text-gray-400 font-bold text-[10px] uppercase tracking-tighter">
                        {new Date(res.date).toLocaleDateString()} • {new Date(res.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 truncate">{res.userName}</h3>
                    <p className="text-xs text-gray-500 font-bold truncate">{res.carId?.brand} {res.carId?.model}</p>
                    <p className="text-[10px] text-gray-300 font-bold truncate mt-0.5">{res.userEmail}</p>
                  </div>

                  {/* Actions Column */}
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                    {!isInactive ? (
                      <>
                        {!isBeingVisited ? (
                          <button
                            onClick={() => setVisitingId(res._id)}
                            className="flex-1 sm:w-32 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={14} /> Visitado
                          </button>
                        ) : (
                          <div className="flex-1 sm:w-32 grid grid-cols-3 gap-1">
                            <button onClick={() => handleVisitComplete(res._id, 'AVAILABLE')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors flex justify-center" title="Disponible"><PenTool size={14} /></button>
                            <button onClick={() => handleVisitComplete(res._id, 'NEGOTIATION')} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white transition-colors flex justify-center" title="Señado"><AlertCircle size={14} /></button>
                            <button onClick={() => handleVisitComplete(res._id, 'SOLD')} className="p-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-black hover:text-white transition-colors flex justify-center" title="Vendido"><ShoppingBag size={14} /></button>
                          </div>
                        )}
                        <button
                          onClick={() => updateStatus(res._id, 'CANCELLED')}
                          className="px-3 sm:px-0 sm:w-32 py-2.5 bg-white border border-gray-100 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={14} /> Cancelar
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center gap-2 flex-1 sm:w-32">
                        {res.status === 'COMPLETED' && (
                          <button
                            onClick={() => setAdjustingId(isAdjusting ? null : res._id)}
                            className={`p-2 rounded-xl transition-all ${isAdjusting ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:text-black'}`}
                            title="Re-ajustar estado del auto"
                          >
                            <Settings2 size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : res._id)}
                          className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:text-black'}`}
                          title="Más información"
                        >
                          <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsible: Adjust Car Status */}
                <AnimatePresence>
                  {isAdjusting && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-gray-50 bg-gray-50/30"
                    >
                      <div className="p-4 flex flex-wrap justify-center gap-2">
                        <p className="w-full text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Cambiar estado del vehículo</p>
                        <button onClick={() => handleCarStatusUpdate(res.carId._id, 'AVAILABLE')} className="flex-1 min-w-[100px] py-2 bg-white text-gray-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-gray-200 hover:border-black">Disponible</button>
                        <button onClick={() => handleCarStatusUpdate(res.carId._id, 'NEGOTIATION')} className="flex-1 min-w-[100px] py-2 bg-white text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-gray-200 hover:border-amber-400">Señado</button>
                        <button onClick={() => handleCarStatusUpdate(res.carId._id, 'SOLD')} className="flex-1 min-w-[100px] py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg border border-gray-200 hover:border-black">Vendido</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsible: Info */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-gray-50"
                    >
                      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 bg-gray-50/50">
                        <DetailItem icon={<Hash size={12} />} label="ID Reserva" value={res._id.slice(-6).toUpperCase()} />
                        <DetailItem icon={<DollarSign size={12} />} label="Precio Auto" value={`$${res.carId?.price?.toLocaleString()}`} />
                        <DetailItem icon={<Calendar size={12} />} label="Creada el" value={new Date(res.createdAt).toLocaleDateString()} />
                        <DetailItem icon={<Info size={12} />} label="Año Auto" value={res.carId?.year} />
                        <div className="col-span-2 sm:col-span-full pt-4 border-t border-gray-100 italic text-[10px] text-gray-400 font-medium">
                          Reserva gestionada por el canal oficial. Notificaciones de espera activas.
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          {filteredReservations.length === 0 && (
            <div className="py-20 text-center opacity-30">
              <Clock className="mx-auto mb-4" size={40} />
              <p className="font-black text-xs uppercase tracking-[0.3em]">Sin registros</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-xs font-black text-gray-900">{value}</p>
    </div>
  )
}
