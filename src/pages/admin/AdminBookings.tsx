import { useState, useMemo, useCallback } from 'react';
import { Search, Filter, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { BookingStatusBadge } from '@/components/BookingCard';
import { useAllBookings } from '@/hooks/useBookings';
import { useServices } from '@/hooks/useServices';
import { formatBookingRef, formatDate, formatPrice, BOOKING_STATUSES, STATUS_LABELS } from '@/utils/bookingStatus';
import type { Booking, BookingStatus, Service } from '@/types/database';

type StatusFilter = 'all' | BookingStatus;
type DateFilter = 'all' | 'upcoming' | 'past';

interface BookingWithService extends Booking {
  service?: Pick<Service, 'id' | 'name'> | null;
}

export function AdminBookings() {
  const { state, reload } = useAllBookings();
  const servicesState = useServices();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filtered = useMemo(() => {
    if (state.status !== 'success') return [];
    let result = state.bookings as BookingWithService[];

    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    if (dateFilter === 'upcoming') {
      result = result.filter((b) => {
        if (!b.booking_date) return false;
        return new Date(b.booking_date + 'T00:00:00') >= today;
      });
    } else if (dateFilter === 'past') {
      result = result.filter((b) => {
        if (!b.booking_date) return false;
        return new Date(b.booking_date + 'T00:00:00') < today;
      });
    }

    if (serviceFilter !== 'all') {
      result = result.filter((b) => b.service_id === serviceFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((b) => {
        const ref = formatBookingRef(b.id).toLowerCase();
        const addr = (b.address ?? '').toLowerCase();
        const svc = (b.service?.name ?? '').toLowerCase();
        return ref.includes(q) || addr.includes(q) || svc.includes(q);
      });
    }

    return result;
  }, [state, statusFilter, dateFilter, serviceFilter, search, today]);

  const handleRetry = useCallback(() => {
    reload();
  }, [reload]);

  const services = servicesState.status === 'success' ? servicesState.services : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">All Bookings</h1>
        <p className="mt-1 text-sm text-secondary-500">Manage customer bookings across all services.</p>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" aria-hidden="true" />
            <Input
              placeholder="Search by ref, service, address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Search bookings"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </Select>
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            aria-label="Filter by date"
          >
            <option value="all">All dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </Select>
          <Select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            aria-label="Filter by service"
            disabled={servicesState.status !== 'success'}
          >
            <option value="all">All services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {state.status === 'loading' && <LoadingState label="Loading bookings…" />}
      {state.status === 'error' && (
        <ErrorState title="Couldn't load bookings" description={state.message} onRetry={handleRetry} />
      )}

      {state.status === 'success' && state.bookings.length === 0 && (
        <Card className="p-8">
          <EmptyState
            icon={CalendarDays}
            title="No bookings yet"
            description="When customers book services, they will appear here."
          />
        </Card>
      )}

      {state.status === 'success' && state.bookings.length > 0 && filtered.length === 0 && (
        <Card className="p-8">
          <EmptyState
            icon={Filter}
            title="No bookings match your filters"
            description="Try adjusting your search or filter criteria."
          />
        </Card>
      )}

      {state.status === 'success' && filtered.length > 0 && (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden lg:block">
            <table className="w-full text-left">
              <thead className="border-b border-secondary-200 bg-secondary-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold text-secondary-600">Booking</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold text-secondary-600">Service</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold text-secondary-600">Date</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold text-secondary-600">Price</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold text-secondary-600">Status</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold text-secondary-600 sr-only">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-secondary-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-secondary-900">{formatBookingRef(b.id)}</p>
                      <p className="text-xs text-secondary-500">{b.property_type ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-700">
                      {b.service?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-700">
                      {formatDate(b.booking_date)}
                      {b.booking_time && <span className="block text-xs text-secondary-500">{b.booking_time}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-secondary-900">
                      {formatPrice(b.estimated_price)}
                    </td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={b.status as BookingStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <LinkButton to={`/admin/bookings/${b.id}`} variant="ghost" size="sm">
                        View
                      </LinkButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="grid gap-3 lg:hidden">
            {filtered.map((b) => (
              <LinkButton
                key={b.id}
                to={`/admin/bookings/${b.id}`}
                variant="outline"
                className="flex flex-col items-stretch gap-0 p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-900">{formatBookingRef(b.id)}</span>
                  <BookingStatusBadge status={b.status as BookingStatus} />
                </div>
                <p className="mt-2 text-sm text-secondary-700">{b.service?.name ?? '—'}</p>
                <p className="mt-1 text-xs text-secondary-500">
                  {formatDate(b.booking_date)}{b.booking_time && ` at ${b.booking_time}`}
                </p>
                <p className="mt-1 text-sm font-semibold text-primary-700">{formatPrice(b.estimated_price)}</p>
              </LinkButton>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
