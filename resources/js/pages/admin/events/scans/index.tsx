import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ScanRow = {
    id: number;
    scanned_at?: string | null;
    officer_name?: string | null;
    location?: string | null;
    is_anomaly: boolean;
    booking?: { booking_code?: string | null; event?: { title?: string | null } };
    ticket?: { name?: string | null };
};

type Props = {
    scans: { data: ScanRow[] };
    events: Array<{ id: number; title: string }>;
    filters: { event_id?: number | null };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Monitoring QR', href: '/admin/events/scans' },
];

export default function EventScansIndex({ scans, events, filters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monitoring QR Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Monitoring QR Scan</h1>
                    <p className="text-sm text-slate-500">Pantau scan tiket dan deteksi anomali.</p>
                    <form
                        className="mt-6 flex flex-wrap gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get('/admin/events/scans', Object.fromEntries(data.entries()), { preserveState: true });
                        }}
                    >
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Event</span>
                            <select name="event_id" defaultValue={filters.event_id ?? ''} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <option value="">Semua event</option>
                                {events.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.title}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Filter
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Waktu</th>
                                    <th className="px-4 py-3 text-left">Event</th>
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">Petugas</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scans.data.map((scan) => (
                                    <tr key={scan.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{scan.scanned_at ?? '-'}</td>
                                        <td className="px-4 py-3">{scan.booking?.event?.title ?? '-'}</td>
                                        <td className="px-4 py-3">{scan.ticket?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{scan.officer_name ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={scan.is_anomaly ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}>
                                                {scan.is_anomaly ? 'Double' : 'Normal'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {scans.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada scan.
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
