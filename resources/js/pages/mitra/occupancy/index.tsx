import { Head, router } from '@inertiajs/react';
import { CalendarDays, Hotel, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type OccupancyDay = {
    date: string;
    rooms_sold: number;
    rooms_total: number;
    occupancy_rate: number;
};

type Props = {
    hotelOptions: Array<{ id: number; label: string }>;
    selectedHotelId?: number | null;
    month: string;
    occupancy: OccupancyDay[];
};

export default function MitraOccupancyIndex({ hotelOptions, selectedHotelId, month, occupancy }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
        { title: 'Kalender Okupansi', href: '/mitra/occupancy' },
    ];

    const { calendarCells, monthLabel } = useMemo(() => {
        if (occupancy.length === 0) {
            return { calendarCells: [] as Array<OccupancyDay | null>, monthLabel: month };
        }

        const firstDate = new Date(`${occupancy[0].date}T00:00:00`);
        const startDay = firstDate.getDay();
        const padded: Array<OccupancyDay | null> = Array(startDay).fill(null);
        const items = occupancy.map((day) => day);
        const lastDate = new Date(`${occupancy[occupancy.length - 1].date}T00:00:00`);
        const label = lastDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        return {
            calendarCells: [...padded, ...items],
            monthLabel: label,
        };
    }, [occupancy, month]);

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/mitra/occupancy', Object.fromEntries(form.entries()), { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kalender Okupansi" />
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-sky-600">Kalender Okupansi</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Pantau kamar terisi per hari</h1>
                            <p className="text-sm text-slate-500">Visual cepat untuk mengatur harga dan ketersediaan.</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <TrendingUp className="size-4 text-sky-500" />
                            {monthLabel}
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-3">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Hotel</label>
                            <select
                                name="hotel_id"
                                defaultValue={selectedHotelId ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Pilih hotel</option>
                                {hotelOptions.map((hotel) => (
                                    <option key={hotel.id} value={hotel.id}>
                                        {hotel.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Bulan</label>
                            <input
                                type="month"
                                name="month"
                                defaultValue={month}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                <CalendarDays className="mr-2 size-4" />
                                Tampilkan
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">{monthLabel}</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Hotel className="size-4" />
                            {selectedHotelId ? 'Hotel terpilih' : 'Pilih hotel untuk melihat data'}
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-slate-400">
                        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                            <div key={day} className="text-center font-semibold">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 grid grid-cols-7 gap-2">
                        {calendarCells.length === 0 && (
                            <div className="col-span-7 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                Pilih hotel dan bulan untuk melihat okupansi.
                            </div>
                        )}
                        {calendarCells.map((day, index) => {
                            if (!day) {
                                return <div key={`empty-${index}`} />;
                            }
                            const dateObj = new Date(`${day.date}T00:00:00`);
                            const label = dateObj.getDate();
                            const rate = day.occupancy_rate;
                            const accent = rate >= 80 ? 'bg-rose-50 text-rose-700' : rate >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';

                            return (
                                <div
                                    key={day.date}
                                    className="rounded-2xl border border-slate-100 bg-white p-2 shadow-xs"
                                >
                                    <div className="text-sm font-semibold text-slate-900">{label}</div>
                                    <div className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${accent}`}>
                                        {rate}% terisi
                                    </div>
                                    <div className="mt-2 text-[10px] text-slate-500">
                                        {day.rooms_sold} / {day.rooms_total} kamar
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
