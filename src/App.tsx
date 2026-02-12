import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PublicLayout } from './components/PublicLayout';
import { AdminLayout } from './components/AdminLayout';
import { Catalog } from './pages/Catalog';
import { CarDetails } from './pages/CarDetails';
import { AdminLogin } from './pages/admin/Login';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminReservations } from './pages/admin/Reservations';
import { AdminCars } from './pages/admin/Cars';
import { CancelReservation } from './pages/CancelReservation';

export function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Catalog />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/cancel/:code" element={<CancelReservation />} />
        </Route>

        {/* Admin Login */}
        <Route path="/admin" element={<AdminLogin />} />

        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="cars" element={<AdminCars />} />
        </Route>
      </Routes>
    </Router>
  );
}
