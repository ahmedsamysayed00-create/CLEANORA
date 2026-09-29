import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/components/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { HomePage } from '@/pages/HomePage';
import { ServicesPage } from '@/pages/ServicesPage';
import { ServiceDetailPage } from '@/pages/ServiceDetailPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { QuotePage } from '@/pages/QuotePage';
import { BookPage } from '@/pages/BookPage';
import { BookingSuccessPage } from '@/pages/BookingSuccessPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';

import { CustomerDashboard } from '@/pages/customer/CustomerDashboard';
import { CustomerBookings } from '@/pages/customer/CustomerBookings';
import { CustomerBookingDetail } from '@/pages/customer/CustomerBookingDetail';
import { CustomerProfile } from '@/pages/customer/CustomerProfile';

import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminBookings } from '@/pages/admin/AdminBookings';
import { AdminBookingDetail } from '@/pages/admin/AdminBookingDetail';
import { AdminCustomers } from '@/pages/admin/AdminCustomers';
import { AdminServices } from '@/pages/admin/AdminServices';
import { AdminPricing } from '@/pages/admin/AdminPricing';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth routes (no layout) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:slug" element={<ServiceDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/quote" element={<QuotePage />} />
              <Route path="/book" element={<BookPage />} />
              <Route path="/booking-success/:id" element={<BookingSuccessPage />} />
            </Route>

            {/* Customer routes */}
            <Route
              element={
                <ProtectedRoute requireRole="customer">
                  <CustomerLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/bookings" element={<CustomerBookings />} />
              <Route path="/customer/bookings/:id" element={<CustomerBookingDetail />} />
              <Route path="/customer/profile" element={<CustomerProfile />} />
            </Route>

            {/* Admin routes */}
            <Route
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/bookings/:id" element={<AdminBookingDetail />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/services" element={<AdminServices />} />
              <Route path="/admin/pricing" element={<AdminPricing />} />
            </Route>

            {/* Fallback */}
            <Route
              path="*"
              element={
                <div className="flex min-h-screen items-center justify-center bg-secondary-50">
                  <div className="text-center">
                    <p className="text-6xl font-bold text-primary-600">404</p>
                    <p className="mt-4 text-secondary-600">Page not found.</p>
                  </div>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
