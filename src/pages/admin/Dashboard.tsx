import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Reservation } from '../../types';
import { BarChart3, Calendar as CalendarIcon, Car as CarIcon, Users, ArrowUpRight, Clock, CheckCircle, ShoppingBag, PenTool, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCars: 0,
    activeReservations: 0,
    todaysVisits: 0,
    waitlistCount: 0,
  });
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitingId, setVisitingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const cars = await api.cars.list();
      const reservations = await api.reservations.list();

      const today = new Date().toISOString().split('T')[0];
      const todaysVisits = reservations.filter((r: any) => r.date.startsWith(today)).length;
      const activeRes = reservations.filter((r: any) => r.status === 'CONFIRMED').length;
      const totalWaitlist = cars.reduce((acc: number, car: any) => acc + (car.waitlist?.length || 0), 0);

      setStats({
        totalCars: cars.length,
        activeReservations: activeRes,
        todaysVisits,
        waitlistCount: totalWaitlist,
      });

      const sorted = (reservations as Reservation[]).sort((a, b) => {
        if (a.status === 'CONFIRMED' && b.status !== 'CONFIRMED') return -1;
        if (a.status !== 'CONFIRMED' && b.status === 'CONFIRMED') return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setRecentReservations(sorted.slice(0, 5));
    } catch (error: any) {
      console.error('Error loading dashboard data', error);
      if (error.response?.status === 401) {
        window.location.href = '/admin';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVisitComplete = async (id: string, nextCarStatus: string) => {
    try {
      await api.reservations.updateStatus(id, 'COMPLETED', nextCarStatus);
      setVisitingId(null);
      loadData();
    } catch (error) {
      alert('Error al actualizar estado');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 italic">Dashboard</h1>
          <p className="text-gray-400 font-bold mt-1 text-xs uppercase tracking-widest">Resumen de operaciones</p>
        </div>
        <div className="text-[10px] font-black bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 uppercase tracking-widest text-gray-400">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<CarIcon size={20} />} label="Stock" value={stats.totalCars} color="black" />
        <StatCard icon={<CalendarIcon size={20} />} label="Citas" value={stats.activeReservations} color="black" />
        <StatCard icon={<Users size={20} />} label="Espera" value={stats.waitlistCount} color="black" />
        <StatCard icon={<BarChart3 size={20} />} label="Hoy" value={stats.todaysVisits} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-50 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black tracking-tighter uppercase">Actividad Reciente</h2>
            <Link to="/admin/reservations" className="text-[9px] font-black text-black uppercase tracking-widest flex items-center gap-1 hover:translate-x-1 transition-transform">
              Agenda <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {recentReservations.map((res: any) => {
                const isInactive = res.status !== 'CONFIRMED';
                const isBeingVisited = visitingId === res._id;

                return (
                  <motion.div
                    layout
                    key={res._id}
                    className={`p-4 rounded-3xl border-2 transition-all duration-300 ${isInactive ? 'bg-gray-50/50 border-transparent opacity-60' : 'bg-white border-gray-50 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={res.carId?.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-gray-900 truncate">{res.userName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{res.carId?.brand} {res.carId?.model}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-gray-900">{new Date(res.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-[9px] text-gray-300 font-bold uppercase">{new Date(res.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1">
                        {!isInactive && !isBeingVisited && (
                          <button onClick={() => setVisitingId(res._id)} className="p-2 bg-black text-white rounded-xl hover:scale-105 transition-transform"><CheckCircle size={14} /></button>
                        )}
                        {isBeingVisited && (
                          <div className="flex gap-1">
                            <button onClick={() => handleVisitComplete(res._id, 'AVAILABLE')} className="p-2 bg-emerald-500 text-white rounded-lg" title="Sigue Disponible"><PenTool size={12} /></button>
                            <button onClick={() => handleVisitComplete(res._id, 'NEGOTIATION')} className="p-2 bg-amber-500 text-white rounded-lg" title="Señado"><AlertCircle size={12} /></button>
                            <button onClick={() => handleVisitComplete(res._id, 'SOLD')} className="p-2 bg-gray-900 text-white rounded-lg" title="Vendido"><ShoppingBag size={12} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {recentReservations.length === 0 && (
              <div className="text-center py-10 opacity-20">
                <Clock className="mx-auto mb-2" size={32} />
                <p className="text-[9px] font-black uppercase tracking-widest">Sin actividad</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-lg font-black uppercase tracking-tighter mb-6 italic">Acceso Directo</h3>
              <div className="space-y-3">
                <QuickLink to="/admin/cars" label="Inventario" desc="Control de unidades" />
                <QuickLink to="/admin/reservations" label="Calendario" desc="Plan de ventas" />
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <CarIcon size={180} />
            </div>
          </div>

          <div className="bg-emerald-500 p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[160px] shadow-lg shadow-emerald-500/20">
            <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Eficiencia</p>
            <div>
              <p className="text-4xl font-black italic text-white tracking-tighter">98%</p>
              <p className="text-[10px] font-black text-black uppercase tracking-widest">Citas Completadas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, label, desc }: { to: string, label: string, desc: string }) {
  return (
    <Link to={to} className="block p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group/link">
      <div className="flex justify-between items-center">
        <p className="font-black text-xs uppercase tracking-widest">{label}</p>
        <ArrowUpRight size={14} className="opacity-30 group-hover/link:opacity-100 transition-opacity" />
      </div>
      <p className="text-[9px] text-white/40 font-bold uppercase mt-1">{desc}</p>
    </Link>
  )
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  const colors: any = {
    black: 'bg-black text-white',
    emerald: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-[2rem] border border-gray-50 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all sm:p-8"
    >
      <div className={`${colors[color] || colors.black} w-10 h-10 rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">{label}</p>
        <p className="text-3xl sm:text-4xl font-black mt-1 tracking-tighter italic">{value}</p>
      </div>
    </motion.div>
  );
}
