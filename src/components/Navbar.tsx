import { Link } from 'react-router-dom';
import { Car } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="nav-blur h-16 flex items-center justify-between px-6 md:px-12 fixed w-full top-0 z-50">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="bg-black text-white p-1.5 rounded-lg group-hover:scale-110 transition-transform">
          <Car size={20} />
        </div>
        <span className="font-semibold text-lg tracking-tight">AutoReserve</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--apple-gray)]">
        <Link to="/" className="hover:text-[var(--apple-text)] transition-colors">Catálogo</Link>
        <Link to="/#historia" className="hover:text-[var(--apple-text)] transition-colors">Nosotros</Link>
        <Link to="/#contacto" className="hover:text-[var(--apple-text)] transition-colors">Contacto</Link>
      </div>

      <Link to="/admin" className="text-sm font-medium hover:text-[var(--apple-blue)] transition-colors">
        Admin Access
      </Link>
    </nav>
  );
};
