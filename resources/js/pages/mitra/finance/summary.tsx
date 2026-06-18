import { Head, router } from '@inertiajs/react';
import { Banknote, CalendarDays, ClipboardList, TrendingUp } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type Summary = {
    total_bookings: number;
    gmv: number;
    commission_total: number;
    net_payout: number;
};

type DailyRow = {
    date: string;
    bookings: number;
    gmv: number;
};

type Props = {
    filters: {
        period: string;
        date_from: string;
        date_to: string;
        hotel_id?: string | null;
    };
    hotelOptions: Array<{ id: number; label: string }>;
    summary: Summary;
    daily: DailyRow[];
};

export default function MitraFinanceSummary({ filters, hotelOptions, summary, daily }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
        { title: 'Ringkasan Pendapatan', href: '/mitra/finance/summary' },
    ];

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/mitra/finance/summary', Object.fromEntries(form.entries()), { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ringkasan Pendapatan" />
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-sky-600">Keuangan Mitra</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Ringkasan pendapatan</h1>
                            <p className="text-sm text-slate-500">Pantau pemasukan, komisi, dan payout bersih.</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <TrendingUp className="size-4 text-sky-500" />
                            {filters.date_from} – {filters.date_to}
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-5">
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Hotel</label>
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
                            <label className="text-xs font-semibold uppercase text-slate-400">Periode</label>
                            <select
                                name="period"
                                defaultValue={filters.period}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="daily">Harian</option>
                                <option value="weekly">Mingguan</option>
                                <option value="monthly">Bulanan</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Dari</label>
                            <input
                                type="date"
                                name="date_from"
                                defaultValue={filters.date_from}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Sampai</label>
                            <input
                                type="date"
                                name="date_to"
                                defaultValue={filters.date_to}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                <CalendarDays className="mr-2 size-4" />
                                Terapkan
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            title: 'Total Booking',
                            value: summary.total_bookings,
                            icon: ClipboardList,
                            accent: 'bg-sky-50 text-sky-600',
                        },
                        {
                            title: 'Pendapatan Kotor',
                            value: `Rp ${summary.gmv.toLocaleString('id-ID')}`,
                            icon: Banknote,
                            accent: 'bg-emerald-50 text-emerald-600',
                        },
                        {
                            title: 'Komisi Platform',
                            value: `Rp ${summary.commission_total.toLocaleString('id-ID')}`,
                            icon: TrendingUp,
                            accent: 'bg-amber-50 text-amber-600',
                        },
                        {
                            title: 'Pendapatan Bersih',
                            value: `Rp ${summary.net_payout.toLocaleString('id-ID')}`,
                            icon: Banknote,
                            accent: 'bg-indigo-50 text-indigo-600',
                        },
                    ].map((card) => (
                        <div key={card.title} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.accent}`}>
                                <card.icon className="size-5" />
                            </div>
                            <p className="mt-3 text-xs font-semibold uppercase text-slate-400">{card.title}</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
                        </div>
                    ))}
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Ringkasan harian</h2>
                        <span className="text-xs text-slate-500">Berdasarkan tanggal check-out</span>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">Tanggal</th>
                                    <th className="py-3 pr-4">Booking</th>
                                    <th className="py-3">GMV</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {daily.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-6 text-center text-slate-500">
                                            Belum ada data booking untuk periode ini.
                                        </td>
                                    </tr>
                                )}
                                {daily.map((row) => (
                                    <tr key={row.date}>
                                        <td className="py-3 pr-4 text-slate-600">{row.date}</td>
                                        <td className="py-3 pr-4 text-slate-600">{row.bookings} booking</td>
                                        <td className="py-3 text-slate-600">Rp {row.gmv.toLocaleString('id-ID')}</td>
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
