import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Option = { id: string | number; label: string };

type ScanRow = {
    id: number;
    scanned_at: string;
    officer_name?: string | null;
    location?: string | null;
    is_anomaly: boolean;
    booking?: { id?: number; booking_code?: string | null };
    destination?: { id?: number; name?: string | null };
    ticket?: { id?: number; name?: string | null };
};

type Props = {
    scans: {
        data: ScanRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    destinations: Option[];
    filters: {
        destination?: string;
        anomaly?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Monitoring Validasi QR', href: '/admin/wisata/scans' },
];

export default function AdminWisataScansIndex({ scans, destinations, filters }: Props) {
    const submitFilters = (form: HTMLFormElement) => {
        const data = new FormData(form);
        router.get('/admin/wisata/scans', Object.fromEntries(data.entries()), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monitoring Validasi QR" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Monitoring Validasi QR</h1>
                    <p className="text-sm text-slate-500">Pantau tiket yang sudah discan dan deteksi anomali.</p>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitFilters(event.currentTarget);
                        }}
                    >
                        <select
                            name="destination"
                            defaultValue={filters.destination ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">Semua destinasi</option>
                            {destinations.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        <select
                            name="anomaly"
                            defaultValue={filters.anomaly ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">Semua status</option>
                            <option value="yes">Anomali</option>
                            <option value="no">Normal</option>
                        </select>
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
                                    <th className="px-4 py-3 text-left">Waktu Scan</th>
                                    <th className="px-4 py-3 text-left">Destinasi</th>
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">Petugas</th>
                                    <th className="px-4 py-3 text-left">Lokasi</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scans.data.map((scan) => (
                                    <tr key={scan.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{scan.scanned_at}</td>
                                        <td className="px-4 py-3">{scan.destination?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{scan.ticket?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{scan.officer_name ?? '-'}</td>
                                        <td className="px-4 py-3">{scan.location ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={scan.is_anomaly ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>
                                                {scan.is_anomaly ? 'Double Scan' : 'Normal'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {scans.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada data scan.
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
