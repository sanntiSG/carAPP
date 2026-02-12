import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Mail, Key } from 'lucide-react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';

export function AdminLogin() {
  const [email, setEmail] = useState('admin@dealer.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.auth.login({ email, password });
      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin/dashboard');
    } catch (error) {
      alert('Credenciales inválidas. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[60vw] h-[60vh] bg-blue-100/30 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-purple-100/20 rounded-full blur-[120px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-lg border-2 border-gray-50 relative"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="bg-black text-white p-5 rounded-[2rem] shadow-2xl shadow-black/20 mb-6 group">
            <ShieldCheck size={40} className="group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter text-gray-900">PARETO <span className="text-gray-200 font-light">SYSTEM</span></h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mt-3">Acceso administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Corporativo</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@paretosystem.com"
                className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-black text-gray-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Contraseña</label>
            <div className="relative">
              <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-black text-gray-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-6 rounded-[2rem] flex items-center justify-center gap-3 group mt-4 shadow-2xl shadow-black/20 hover:bg-gray-800 transition-all font-black uppercase tracking-[0.2em] text-xs active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : (
              <>
                Entrar al Sistema
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-loose">
            © 2026 PARETO AUTOMOTRIZ S.A.<br />
            SISTEMA DE GESTIÓN DE ALTO RENDIMIENTO
          </p>
        </div>
      </motion.div>
    </div>
  );
}
