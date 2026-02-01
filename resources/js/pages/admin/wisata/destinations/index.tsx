import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type DestinationRow = {
    id: number;
    destination_name: string | null;
    destination_type: string | null;
    city_code: string | null;
    verification_status: string;
    is_live: boolean;
    is_suspended: boolean;
    user?: { id?: number; name?: string; email?: string };
};

type Option = { id: string; label: string };

type Props = {
    destinations: {
        data: DestinationRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    cities: Option[];
    filters: {
        search?: string;
        status?: string;
        city?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Wisata', href: '/admin/wisata/destinations' },
];

const statusTone = (status?: string | null) => {
    if (status === 'verified') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending') return 'bg-amber-50 text-amber-700';
    if (status === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-slate-50 text-slate-600';
};

export default function AdminWisataDestinationsIndex({ destinations, cities, filters }: Props) {
    const submitFilters = (form: HTMLFormElement) => {
        const data = new FormData(form);
        router.get('/admin/wisata/destinations', Object.fromEntries(data.entries()), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master Destinasi Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                                Wisata
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Master Destinasi Wisata</h1>
                            <p className="text-sm text-slate-500">
                                Monitor destinasi, status live, dan tindakan admin.
                            </p>
                        </div>
                    </div>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitFilters(event.currentTarget);
                        }}
                    >
                        <input
                            name="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Cari destinasi / mitra"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <select
                            name="status"
                            defaultValue={filters.status ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">Semua status</option>
                            <option value="draft">Draft</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select
                            name="city"
                            defaultValue={filters.city ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">Semua kota</option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                    {city.label}
                                </option>
                            ))}
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
                                    <th className="px-4 py-3 text-left">Destinasi</th>
                                    <th className="px-4 py-3 text-left">Mitra</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Live</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {destinations.data.map((row) => (
                                    <tr key={row.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">
                                                {row.destination_name ?? 'Belum diisi'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {row.destination_type ?? '-'} · {row.city_code ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-slate-900">{row.user?.name ?? '-'}</div>
                                            <div className="text-xs text-slate-500">{row.user?.email ?? ''}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={statusTone(row.verification_status)}>
                                                {row.verification_status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={row.is_live ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}>
                                                {row.is_live ? 'Live' : 'Draft'}
                                            </Badge>
                                            {row.is_suspended && (
                                                <Badge className="ml-2 bg-red-50 text-red-600">Suspended</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/wisata/destinations/${row.id}`}
                                                className="text-sm font-semibold text-sky-600 hover:underline"
                                            >
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {destinations.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada destinasi wisata.
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
