import { Head, Link, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Kelola Mitra', href: '/admin/mitra' },
];

type MitraRow = {
    id: number;
    name: string;
    email: string;
    verification_status: string;
    payout_status: string;
    is_suspended?: boolean;
    hotel_name: string | null;
    city_name: string | null;
    updated_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PageProps = {
    mitra: {
        data: MitraRow[];
        links: PaginationLink[];
    };
    filters: {
        search?: string;
        verification_status?: string;
        payout_status?: string;
        suspended?: string;
    };
    verificationStatuses: string[];
    payoutStatuses: string[];
    suspensionStatuses: string[];
};

const statusTone = (status: string) => {
    if (status === 'verified') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending') return 'bg-amber-50 text-amber-700';
    if (status === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-slate-50 text-slate-600';
};

export default function AdminMitraIndex({
    mitra,
    filters,
    verificationStatuses,
    payoutStatuses,
    suspensionStatuses,
}: PageProps) {
    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/admin/mitra', Object.fromEntries(form.entries()), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Mitra">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <div className="pointer-events-none absolute -left-32 top-12 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
                <div className="pointer-events-none absolute right-[-10%] top-0 h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />

                <section className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/85 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                                Mitra
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                Kelola pendaftaran mitra
                            </h1>
                            <p className="text-sm text-slate-600">
                                Review dokumen, status verifikasi, dan setup payout.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form
                        onSubmit={applyFilters}
                        className="grid gap-4 md:grid-cols-4"
                    >
                        <div className="grid gap-2 md:col-span-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Cari mitra
                            </label>
                            <input
                                name="search"
                                defaultValue={filters.search ?? ''}
                                placeholder="Nama atau email"
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Status akun
                            </label>
                            <select
                                name="suspended"
                                defaultValue={filters.suspended ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua</option>
                                {suspensionStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Status verifikasi
                            </label>
                            <select
                                name="verification_status"
                                defaultValue={filters.verification_status ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua</option>
                                {verificationStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Status payout
                            </label>
                            <select
                                name="payout_status"
                                defaultValue={filters.payout_status ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua</option>
                                {payoutStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid items-end">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Terapkan filter
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Mitra</th>
                                    <th className="px-4 py-3 text-left">Hotel</th>
                                    <th className="px-4 py-3 text-left">Kota</th>
                                    <th className="px-4 py-3 text-left">Verifikasi</th>
                                    <th className="px-4 py-3 text-left">Akun</th>
                                    <th className="px-4 py-3 text-left">Payout</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mitra.data.map((row) => (
                                    <tr key={row.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">
                                                {row.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {row.email}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-700">
                                                {row.hotel_name ?? 'Belum diisi'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-700">
                                                {row.city_name ?? 'Belum diisi'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={statusTone(row.verification_status)}>
                                                {row.verification_status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={
                                                    row.is_suspended
                                                        ? 'bg-red-50 text-red-700'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                }
                                            >
                                                {row.is_suspended ? 'suspended' : 'active'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={statusTone(row.payout_status)}>
                                                {row.payout_status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="border-sky-200 text-slate-700 hover:bg-sky-50"
                                            >
                                                <Link href={`/admin/mitra/${row.id}`}>
                                                    Detail
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {mitra.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-sm text-slate-500"
                                        >
                                            Tidak ada data mitra.
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
