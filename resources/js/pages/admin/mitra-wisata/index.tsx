import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { BulkDeleteTable, BulkDeleteRow, BulkDeleteSelectAll } from '@/components/admin/bulk-delete-table';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

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
        verification_status: 'draft',
        payout_status: 'draft',
        is_suspended: false,
        suspended_reason: '',
    });

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/admin/mitra-wisata', Object.fromEntries(form.entries()), {
            preserveState: true,
        });
    };

    const handlePayout = async (
        row: MitraRow,
        action: 'approve' | 'reject',
    ) => {
        const result =
            action === 'approve'
                ? await Swal.fire({
                      title: 'Setujui payout mitra wisata?',
                      text: `Rekening payout ${row.name} akan diverifikasi.`,
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonText: 'Setujui',
                      cancelButtonText: 'Batal',
                  })
                : await Swal.fire({
                      title: 'Tolak payout mitra wisata?',
                      input: 'textarea',
                      inputLabel: 'Alasan penolakan',
                      inputPlaceholder:
                          'Tulis alasan agar mitra bisa memperbaiki data payout.',
                      showCancelButton: true,
                      confirmButtonText: 'Tolak',
                      cancelButtonText: 'Batal',
                      inputValidator: (value: string | null) => {
                          if (!value) {
                              return 'Alasan penolakan wajib diisi.';
                          }
                          return null;
                      },
                  });

        if (!result.isConfirmed) return;

        router.post(
            `/admin/mitra-wisata/${row.id}/payout`,
            {
                action,
                reason: action === 'reject' ? result.value : null,
            },
            {
                preserveScroll: true,
                onSuccess: () =>
                    Swal.fire({
                        title: 'Berhasil',
                        text: 'Status payout diperbarui.',
                        icon: 'success',
                    }),
                onError: () =>
                    Swal.fire({
                        title: 'Gagal',
                        text: 'Tidak dapat memperbarui status payout.',
                        icon: 'error',
                    }),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mitra Wisata">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-sans text-slate-900">
                <section className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/85 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Mitra Wisata
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                Review pendaftaran destinasi wisata
                            </h1>
                            <p className="text-sm text-slate-600">
                                Verifikasi destinasi, dokumen, dan status payout
                                mitra wisata.
                            </p>
                        </div>
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-sky-600 text-white hover:bg-sky-700">
                                    Tambah Mitra Wisata
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        Tambah Mitra Wisata
                                    </DialogTitle>
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
                                        <Label required className="text-sm font-semibold text-slate-700">
                                            Nama
                                        </Label>
                                        <input
                                            required
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={createForm.data.name}
                                            onChange={(event) =>
                                                createForm.setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={createForm.errors.name}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label required className="text-sm font-semibold text-slate-700">
                                            Email
                                        </Label>
                                        <input
                                            type="email"
                                            required
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={createForm.data.email}
                                            onChange={(event) =>
                                                createForm.setData(
                                                    'email',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={createForm.errors.email}
                                        />
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-slate-700">
                                                Nomor HP
                                            </label>
                                            <input
                                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                value={createForm.data.phone}
                                                onChange={(event) =>
                                                    createForm.setData(
                                                        'phone',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    createForm.errors.phone
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-slate-700">
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                value={createForm.data.password}
                                                onChange={(event) =>
                                                    createForm.setData(
                                                        'password',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Kosongkan untuk auto"
                                            />
                                            <InputError
                                                message={
                                                    createForm.errors.password
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Nama Destinasi (opsional)
                                        </label>
                                        <input
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={
                                                createForm.data.destination_name
                                            }
                                            onChange={(event) =>
                                                createForm.setData(
                                                    'destination_name',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                createForm.errors
                                                    .destination_name
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Kategori Destinasi
                                        </label>
                                        <select
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={
                                                createForm.data.destination_type
                                            }
                                            onChange={(event) =>
                                                createForm.setData(
                                                    'destination_type',
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            <option value="">Pilih</option>
                                            <option value="alam">Alam</option>
                                            <option value="edukasi">
                                                Edukasi
                                            </option>
                                            <option value="budaya">
                                                Budaya
                                            </option>
                                            <option value="wahana">
                                                Wahana
                                            </option>
                                            <option value="event">Event</option>
                                        </select>
                                        <InputError
                                            message={
                                                createForm.errors
                                                    .destination_type
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-semibold text-slate-700">
                                                Status Verifikasi
                                            </Label>
                                            <select
                                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                value={
                                                    createForm.data
                                                        .verification_status
                                                }
                                                onChange={(event) =>
                                                    createForm.setData(
                                                        'verification_status',
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                {verificationStatuses.map(
                                                    (status) => (
                                                        <option
                                                            key={status}
                                                            value={status}
                                                        >
                                                            {status}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <InputError
                                                message={
                                                    createForm.errors
                                                        .verification_status
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-semibold text-slate-700">
                                                Status Payout
                                            </Label>
                                            <select
                                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                value={
                                                    createForm.data
                                                        .payout_status
                                                }
                                                onChange={(event) =>
                                                    createForm.setData(
                                                        'payout_status',
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                {payoutStatuses.map(
                                                    (status) => (
                                                        <option
                                                            key={status}
                                                            value={status}
                                                        >
                                                            {status}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <InputError
                                                message={
                                                    createForm.errors
                                                        .payout_status
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                        <label className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    createForm.data.is_suspended
                                                }
                                                onChange={(event) =>
                                                    createForm.setData(
                                                        'is_suspended',
                                                        event.target.checked,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                            Suspend akun mitra setelah dibuat
                                        </label>
                                        {createForm.data.is_suspended && (
                                            <div className="grid gap-2">
                                                <Label
                                                    required
                                                    className="text-sm font-semibold text-slate-700"
                                                >
                                                    Alasan Suspend
                                                </Label>
                                                <textarea
                                                    required
                                                    maxLength={1000}
                                                    className="min-h-[90px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                    value={
                                                        createForm.data
                                                            .suspended_reason
                                                    }
                                                    onChange={(event) =>
                                                        createForm.setData(
                                                            'suspended_reason',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        createForm.errors
                                                            .suspended_reason
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter className="gap-2 sm:justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setCreateOpen(false)}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-sky-600 text-white hover:bg-sky-700"
                                            disabled={createForm.processing}
                                        >
                                            Simpan
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form
                        onSubmit={applyFilters}
                        className="grid gap-4 md:grid-cols-4"
                    >
                        <div className="grid gap-2 md:col-span-3">
                            <label className="text-xs font-semibold text-slate-400 uppercase">
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
                            <label className="text-xs font-semibold text-slate-400 uppercase">
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
                            <label className="text-xs font-semibold text-slate-400 uppercase">
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
                            <label className="text-xs font-semibold text-slate-400 uppercase">
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
                            <Button
                                type="submit"
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                Terapkan filter
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 shadow-sm">
                    <div className="overflow-x-auto">
                        <BulkDeleteTable className="w-full text-sm" deletionWarning="Mitra beserta destinasi, tiket, booking, payout, komisi, afiliasi, review, dispute, staff, dokumen, dan file upload terkait akan dihapus permanen.">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <BulkDeleteSelectAll />
                                    <th className="px-4 py-3 text-left">
                                        Mitra
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Destinasi
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Lokasi
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Verifikasi
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Akun
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Payout
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {mitra.data.map((row) => (
                                    <BulkDeleteRow deleteUrl={`/admin/mitra-wisata/${row.id}`}
                                        key={row.id}
                                        className="border-t border-slate-100"
                                    >
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
                                                {row.destination_name ??
                                                    'Belum diisi'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {row.destination_type ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-700">
                                                {row.city_name ?? 'Belum diisi'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {row.province_name ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={statusTone(
                                                    row.verification_status,
                                                )}
                                            >
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
                                                {row.is_suspended
                                                    ? 'suspended'
                                                    : 'active'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-2">
                                                <Badge
                                                    className={statusTone(
                                                        row.payout_status,
                                                    )}
                                                >
                                                    {row.payout_status}
                                                </Badge>
                                                {[
                                                    'pending',
                                                    'rejected',
                                                ].includes(
                                                    row.payout_status,
                                                ) && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700"
                                                            onClick={() =>
                                                                handlePayout(
                                                                    row,
                                                                    'approve',
                                                                )
                                                            }
                                                        >
                                                            Verifikasi Payout
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 border-red-200 px-3 text-xs text-red-600 hover:bg-red-50"
                                                            onClick={() =>
                                                                handlePayout(
                                                                    row,
                                                                    'reject',
                                                                )
                                                            }
                                                        >
                                                            Tolak
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="border-sky-200 text-slate-700 hover:bg-sky-50"
                                                >
                                                    <Link
                                                        href={`/admin/mitra-wisata/${row.id}`}
                                                    >
                                                        {row.verification_status ===
                                                        'verified'
                                                            ? 'Detail'
                                                            : 'Validasi Dokumen'}
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        Swal.fire({
                                                            icon: 'warning',
                                                            title: 'Hapus mitra wisata dan semua datanya?',
                                                            html: `Mitra <b>${row.name}</b> akan dihapus permanen. Semua destinasi, tiket, booking, payout, komisi, afiliasi, review, dispute, staff, dokumen, dan file upload terkait ikut dihapus.`,
                                                            showCancelButton: true,
                                                            confirmButtonText:
                                                                'Hapus permanen',
                                                            cancelButtonText:
                                                                'Batal',
                                                            confirmButtonColor:
                                                                '#dc2626',
                                                        }).then((result) => {
                                                            if (
                                                                result.isConfirmed
                                                            ) {
                                                                router.delete(
                                                                    `/admin/mitra-wisata/${row.id}`,
                                                                    {
                                                                        onSuccess:
                                                                            () => {
                                                                                Swal.fire(
                                                                                    {
                                                                                        icon: 'success',
                                                                                        title: 'Terhapus',
                                                                                        text: 'Mitra wisata dihapus.',
                                                                                    },
                                                                                );
                                                                            },
                                                                        onError:
                                                                            (
                                                                                errors,
                                                                            ) => {
                                                                                Swal.fire(
                                                                                    {
                                                                                        icon: 'error',
                                                                                        title: 'Gagal',
                                                                                        text:
                                                                                            errors.mitra ??
                                                                                            'Mitra wisata gagal dihapus.',
                                                                                    },
                                                                                );
                                                                            },
                                                                    },
                                                                );
                                                            }
                                                        });
                                                    }}
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </BulkDeleteRow>
                                ))}
                                {mitra.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-slate-500"
                                        >
                                            Belum ada mitra wisata.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </BulkDeleteTable>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
