import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { CheckCircle, XCircle, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export function CancelReservation() {
    const { code } = useParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        if (code) {
            api.reservations.cancel(code)
                .then(() => setStatus('success'))
                .catch(() => setStatus('error'));
        }
    }, [code]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--apple-bg)] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card bg-white p-10 max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="space-y-4">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-[var(--apple-gray)] font-medium">Cancelando tu reserva...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="bg-emerald-100 text-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle size={40} />
                        </div>
                        <h1 className="text-3xl font-bold">Reserva Cancelada</h1>
                        <p className="text-[var(--apple-gray)] font-medium">Tu visita ha sido cancelada exitosamente y el auto ha sido liberado para otros clientes.</p>
                        <Link to="/" className="btn-primary inline-flex items-center gap-2 mt-4">
                            <Home size={20} /> Volver al Inicio
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="bg-red-100 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                            <XCircle size={40} />
                        </div>
                        <h1 className="text-3xl font-bold">Error al cancelar</h1>
                        <p className="text-[var(--apple-gray)] font-medium">No pudimos encontrar tu reserva o ya fue cancelada anteriormente.</p>
                        <Link to="/" className="btn-secondary inline-flex items-center gap-2 mt-4">
                            <Home size={20} /> Volver al Inicio
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
