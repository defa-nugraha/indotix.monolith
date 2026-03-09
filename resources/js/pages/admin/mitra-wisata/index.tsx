import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import InputError from '@/components/input-error';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Swal from 'sweetalert2';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Mitra Wisata', href: '/admin/mitra-wisata' },
];

type MitraRow = {
    id: number;
    name: string;
    email: string;
    verification_status: string;
    payout_status: string;
    is_suspended?: boolean;
    destination_name: string | null;
    destination_type: string | null;
    city_name: string | null;
    province_name: string | null;
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

export default function AdminMitraWisataIndex({
    mitra,
    filters,
    verificationStatuses,
    payoutStatuses,
    suspensionStatuses,
}: PageProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        destination_name: '',
        destination_type: '',
    });

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/admin/mitra-wisata', Object.fromEntries(form.entries()), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mitra Wisata">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/85 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                                Mitra Wisata
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                Review pendaftaran destinasi wisata
                            </h1>
                            <p className="text-sm text-slate-600">
                                Verifikasi destinasi, dokumen, dan status payout mitra wisata.
                            </p>
                        </div>
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-sky-600 text-white hover:bg-sky-700">Tambah Mitra Wisata</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Mitra Wisata</DialogTitle>
                                </DialogHeader>
                                <form
                                    className="grid gap-4"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        createForm.post('/admin/mitra-wisata', {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                createForm.reset();
                                                setCreateOpen(false);
                                            },
                                        });
                                    }}
                                >
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Nama</label>
                                        <input
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={createForm.data.name}
                                            onChange={(event) => createForm.setData('name', event.target.value)}
                                        />
                                        <InputError message={createForm.errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={createForm.data.email}
                                            onChange={(event) => createForm.setData('email', event.target.value)}
                                        />
                                        <InputError message={createForm.errors.email} />
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-slate-700">Nomor HP</label>
                                            <input
                                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                value={createForm.data.phone}
                                                onChange={(event) => createForm.setData('phone', event.target.value)}
                                            />
                                            <InputError message={createForm.errors.phone} />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-slate-700">Password</label>
                                            <input
                                                type="password"
                                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                value={createForm.data.password}
                                                onChange={(event) => createForm.setData('password', event.target.value)}
                                                placeholder="Kosongkan untuk auto"
                                            />
                                            <InputError message={createForm.errors.password} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Nama Destinasi (opsional)</label>
                                        <input
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={createForm.data.destination_name}
                                            onChange={(event) => createForm.setData('destination_name', event.target.value)}
                                        />
                                        <InputError message={createForm.errors.destination_name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Kategori Destinasi</label>
                                        <select
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={createForm.data.destination_type}
                                            onChange={(event) => createForm.setData('destination_type', event.target.value)}
                                        >
                                            <option value="">Pilih</option>
                                            <option value="alam">Alam</option>
                                            <option value="edukasi">Edukasi</option>
                                            <option value="budaya">Budaya</option>
                                            <option value="wahana">Wahana</option>
                                            <option value="event">Event</option>
                                        </select>
                                        <InputError message={createForm.errors.destination_type} />
                                    </div>
                                    <DialogFooter className="gap-2 sm:justify-end">
                                        <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                                            Batal
                                        </Button>
                                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700" disabled={createForm.processing}>
                                            Simpan
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-4">
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
                                    <th className="px-4 py-3 text-left">Destinasi</th>
                                    <th className="px-4 py-3 text-left">Lokasi</th>
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
                                            <div className="font-semibold text-slate-900">{row.name}</div>
                                            <div className="text-xs text-slate-500">{row.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-700">{row.destination_name ?? 'Belum diisi'}</div>
                                            <div className="text-xs text-slate-500">{row.destination_type ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-700">{row.city_name ?? 'Belum diisi'}</div>
                                            <div className="text-xs text-slate-500">{row.province_name ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={statusTone(row.verification_status)}>{row.verification_status}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={row.is_suspended ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>
                                                {row.is_suspended ? 'suspended' : 'active'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={statusTone(row.payout_status)}>{row.payout_status}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="border-sky-200 text-slate-700 hover:bg-sky-50"
                                                >
                                                    <Link href={`/admin/mitra-wisata/${row.id}`}>Detail</Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        Swal.fire({
                                                            icon: 'warning',
                                                            title: 'Hapus mitra wisata?',
                                                            text: 'Mitra akan dihapus permanen jika tidak punya data terkait.',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Hapus',
                                                            cancelButtonText: 'Batal',
                                                        }).then((result) => {
                                                            if (result.isConfirmed) {
                                                                router.delete(`/admin/mitra-wisata/${row.id}`, {
                                                                    onSuccess: () => {
                                                                        Swal.fire({
                                                                            icon: 'success',
                                                                            title: 'Terhapus',
                                                                            text: 'Mitra wisata dihapus.',
                                                                        });
                                                                    },
                                                                    onError: (errors) => {
                                                                        Swal.fire({
                                                                            icon: 'error',
                                                                            title: 'Gagal',
                                                                            text: errors.mitra ?? 'Mitra wisata gagal dihapus.',
                                                                        });
                                                                    },
                                                                });
                                                            }
                                                        });
                                                    }}
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {mitra.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                            Belum ada mitra wisata.
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
