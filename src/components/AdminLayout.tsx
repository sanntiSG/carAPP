import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Car, LogOut, Menu, X, Settings, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin');
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/admin');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Reservas', path: '/admin/reservations' },
    { icon: Car, label: 'Inventario', path: '/admin/cars' },
  ];

  const NavLink = ({ item, onClick }: { item: any, onClick?: () => void }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={`relative flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all duration-300 uppercase tracking-widest ${isActive
          ? 'bg-black text-white shadow-2xl shadow-black/20 translate-x-1'
          : 'text-gray-400 hover:text-black hover:bg-gray-50'
          }`}
      >
        <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-300'} />
        {item.label}
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute left-1 w-1 h-6 bg-white rounded-full"
          />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col md:flex-row font-sans selection:bg-black selection:text-white">
      {/* Mobile Top Bar */}
      <header className={`md:hidden px-6 py-5 flex items-center justify-between sticky top-0 z-[60] transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm' : 'bg-transparent'}`}>
        <h1 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
          <ShieldCheck className="text-black" size={24} />
          <span>PARETO <span className="text-gray-300 font-light">ADMIN</span></span>
        </h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-black text-white rounded-2xl shadow-xl active:scale-90 transition-transform"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[55] p-8 pt-24 flex flex-col md:hidden"
          >
            <nav className="space-y-4">
              {navItems.map((item) => (
                <NavLink key={item.path} item={item} onClick={() => setIsMobileMenuOpen(false)} />
              ))}
            </nav>
            <div className="mt-auto pt-8 border-t-2 border-gray-50 space-y-4">
              <button className="flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 w-full transition-all">
                <Settings size={20} /> Ajustes
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black text-red-500 bg-red-50 uppercase tracking-widest w-full transition-all"
              >
                <LogOut size={20} /> Cerrar Sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-100 hidden md:flex flex-col sticky top-0 h-screen overflow-hidden">
        <div className="p-10">
          <h1 className="text-3xl font-black italic tracking-tighter flex items-center gap-3">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-black/20">
              <ShieldCheck size={28} />
            </div>
            PARETO
          </h1>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mt-3 ml-1">Panel de Control</p>
        </div>

        <nav className="flex-1 px-8 space-y-4 py-6">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        <div className="p-8 space-y-4">
          <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 mb-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Usuario</p>
            <p className="text-sm font-black text-gray-900 truncate">Administrador Central</p>
            <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-black w-2/3"></div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="group flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black text-gray-400 hover:text-red-600 hover:bg-red-50 w-full transition-all duration-300 uppercase tracking-widest"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full relative">
        <div className="max-w-7xl mx-auto p-6 md:p-12 min-h-screen">
          <Outlet />
        </div>

        {/* Subtle Background Elements */}
        <div className="fixed top-0 right-0 -z-10 w-[50vw] h-[50vh] bg-blue-50/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-0 left-80 -z-10 w-[30vw] h-[30vh] bg-emerald-50/20 rounded-full blur-[100px] pointer-events-none" />
      </main>
    </div>
  );
}
