import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type BookingRow = {
    id: number;
    status: string;
    quantity: number;
    visit_date?: string | null;
    guest_name?: string | null;
    guest_phone?: string | null;
    program?: { name?: string | null };
    variant?: { name?: string | null };
    user?: { name?: string | null };
};

type Props = {
    bookings: {
        data: BookingRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    programs: Array<{ id: number; name: string }>;
    filters: { status?: string; program_id?: number | null; date?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    {
        title: 'Booking Special Program',
        href: '/admin/special-programs/bookings',
    },
];

const statusTone = (status?: string) => {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending_payment') return 'bg-amber-50 text-amber-700';
    if (status === 'cancelled') return 'bg-red-50 text-red-700';
    if (status === 'expired') return 'bg-slate-100 text-slate-600';
    if (status === 'completed') return 'bg-blue-50 text-blue-700';
    return 'bg-slate-50 text-slate-600';
};

export default function EventBookingsIndex({
    bookings,
    programs,
    filters,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Booking Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Monitoring Booking Special Program
                    </h1>
                    <p className="text-sm text-slate-500">
                        Filter berdasarkan program, status, dan tanggal.
                    </p>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get(
                                '/admin/special-programs/bookings',
                                Object.fromEntries(data.entries()),
                                { preserveState: true },
                            );
                        }}
                    >
                        <select
                            name="program_id"
                            defaultValue={filters.program_id ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">Semua program</option>
                            {programs.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <select
                            name="status"
                            defaultValue={filters.status ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">Semua status</option>
                            <option value="pending_payment">
                                Pending Payment
                            </option>
                            <option value="paid">Paid</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="expired">Expired</option>
                        </select>
                        <input
                            type="date"
                            name="date"
                            defaultValue={filters.date ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <Button
                            type="submit"
                            className="bg-sky-600 text-white hover:bg-sky-700 md:col-span-3"
                        >
                            Filter
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Paket
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Variant
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Tanggal
                                    </th>
                                    <th className="px-4 py-3 text-left">Pax</th>
                                    <th className="px-4 py-3 text-left">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.data.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3">
                                            {item.program?.name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.variant?.name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.guest_name ??
                                                item.user?.name ??
                                                '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.visit_date ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.quantity}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={statusTone(
                                                    item.status,
                                                )}
                                            >
                                                {item.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/special-programs/bookings/${item.id}`}
                                                className="text-sky-600 hover:underline"
                                            >
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {bookings.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-sm text-slate-500"
                                        >
                                            Belum ada booking special program.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
