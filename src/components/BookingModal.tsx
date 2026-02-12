import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

interface BookingModalProps {
  carId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingModal({ carId, isOpen, onClose, onSuccess }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);

  // Simple mock availability slots
  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.reservations.create({
        carId,
        userEmail: formData.email,
        userName: formData.name,
        date: `${date}T${time}:00.000Z`, // ISO format construction
      });
      setStep(3); // Success step
      setTimeout(() => {
        onSuccess();
        onClose();
        setStep(1);
        setFormData({ name: '', email: '' });
        setDate('');
        setTime('');
      }, 2000);
    } catch (error) {
      console.error(error);
      alert('Failed to book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Book a Visit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={`py-2 px-3 text-sm rounded-lg border transition-all ${
                        time === slot 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!date || !time}
                onClick={() => setStep(2)}
                className="w-full bg-black text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors mt-4"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
                  placeholder="john@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">We'll send your reservation link here.</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3 text-sm text-gray-600">
                <Clock className="shrink-0 mt-0.5" size={16} />
                <p>
                  Reservation for <span className="font-semibold">{date}</span> at <span className="font-semibold">{time}</span>. 
                  Valid for 30 mins after start time.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-black text-white py-3 rounded-xl font-medium disabled:opacity-50 hover:bg-gray-800"
                >
                  {loading ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Reserved!</h3>
              <p className="text-gray-500">Check your email for the confirmation link.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
