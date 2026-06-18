import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Eye, Filter, Receipt, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type BookingRow = {
    id: number;
    midtrans_order_id?: string | null;
    hotel_name?: string | null;
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    nights?: number | null;
    rooms_count?: number | null;
    guests_count?: number | null;
    total?: number | null;
    status: string;
    payment_status?: string | null;
    created_at?: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    bookings: {
        data: BookingRow[];
        links: PaginationLink[];
    };
    filters: {
        status?: string;
        hotel_id?: string;
        date_from?: string;
        date_to?: string;
    };
    statusOptions: string[];
    hotelOptions: Array<{ id: number; label: string }>;
    isMitra?: boolean;
    basePath?: string;
};

const statusBadge = (status: string) => {
    switch (status) {
        case 'paid':
            return 'bg-emerald-50 text-emerald-700';
        case 'pending_payment':
            return 'bg-amber-50 text-amber-700';
        case 'cancelled':
            return 'bg-rose-50 text-rose-700';
        case 'expired':
            return 'bg-slate-100 text-slate-600';
        case 'completed':
            return 'bg-sky-50 text-sky-700';
        case 'no_show':
            return 'bg-orange-50 text-orange-700';
        default:
            return 'bg-slate-100 text-slate-600';
    }
};

export default function AdminBookingIndex({
    bookings,
    filters,
    statusOptions,
    hotelOptions,
    isMitra = false,
    basePath = '/admin/bookings',
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: isMitra ? '/mitra/dashboard' : '/dashboard' },
        { title: 'Booking & Transaksi', href: basePath },
    ];
    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get(basePath, Object.fromEntries(form.entries()), {
            preserveState: true,
        });
    };

    const resetFilters = () => {
        router.get(basePath);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monitoring Booking" />
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-sky-600">
                                Monitoring Booking
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                Manajemen booking & transaksi
                            </h1>
                            <p className="text-sm text-slate-500">
                                Pantau status booking, pembayaran, dan support.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Receipt className="size-4 text-sky-500" />
                            {bookings.data.length} booking ditampilkan
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-5">
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Hotel
                            </label>
                            <select
                                name="hotel_id"
                                defaultValue={filters.hotel_id ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua hotel</option>
                                {hotelOptions.map((hotel) => (
                                    <option key={hotel.id} value={hotel.id}>
                                        {hotel.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Status
                            </label>
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua</option>
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Dari tanggal
                            </label>
                            <input
                                type="date"
                                name="date_from"
                                defaultValue={filters.date_from ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Sampai tanggal
                            </label>
                            <input
                                type="date"
                                name="date_to"
                                defaultValue={filters.date_to ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="flex items-end gap-3 md:col-span-2">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                <Filter className="mr-2 size-4" />
                                Terapkan
                            </Button>
                            <Button type="button" variant="outline" onClick={resetFilters}>
                                <RotateCcw className="mr-2 size-4" />
                                Reset
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">Booking</th>
                                    <th className="py-3 pr-4">Hotel</th>
                                    <th className="py-3 pr-4">Tanggal</th>
                                    <th className="py-3 pr-4">Total</th>
                                    <th className="py-3 pr-4">Status</th>
                                    <th className="py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bookings.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-500">
                                            Belum ada booking.
                                        </td>
                                    </tr>
                                )}
                                {bookings.data.map((booking) => (
                                    <tr key={booking.id}>
                                        <td className="py-4 pr-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="font-semibold text-slate-900">
                                                    {booking.guest_name ?? 'Tamu'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {booking.midtrans_order_id ?? `INDOTIX-${booking.id}`}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {booking.guest_email ?? '-'} · {booking.guest_phone ?? '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {booking.hotel_name ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="size-4 text-slate-400" />
                                                {booking.check_in ?? '-'} → {booking.check_out ?? '-'}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {booking.nights ?? 0} malam · {booking.rooms_count ?? 0} kamar
                                            </div>
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {booking.total ? `Rp ${booking.total.toLocaleString('id-ID')}` : '-'}
                                        </td>
                                        <td className="py-4 pr-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Pembayaran: {booking.payment_status ?? '-'}
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="border-slate-200"
                                            >
                                                <Link href={`${basePath}/${booking.id}`}>
                                                    <Eye className="mr-1 size-3" />
                                                    Detail
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
