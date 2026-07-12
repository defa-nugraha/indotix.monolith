import { Head, router, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import Swal from 'sweetalert2';

type Organizer = {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    status: string;
    verification_status?: string | null;
};

type Props = {
    organizers: {
        data: Organizer[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { status?: string };
    canManageMitraEvent?: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Mitra Event (EO)', href: '/admin/events/organizers' },
];

export default function EventOrganizersIndex({ organizers, filters, canManageMitraEvent = false }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const formTitle = canManageMitraEvent ? 'Tambah Mitra Event' : 'Atur Organizer Event Saya';
    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        eo_name: '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mitra Event (EO)" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                {canManageMitraEvent ? 'Mitra Event (EO)' : 'Organizer Event Saya'}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {canManageMitraEvent
                                    ? 'Review dan approval mitra event.'
                                    : 'Kelola profil organizer yang akan dipakai saat membuat event.'}
                            </p>
                        </div>
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-sky-600 text-white hover:bg-sky-700">
                                    {formTitle}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        {formTitle}
                                    </DialogTitle>
                                </DialogHeader>
                                <form
                                    className="grid gap-4"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        createForm.post(
                                            '/admin/events/organizers',
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    createForm.reset();
                                                    setCreateOpen(false);
                                                    Swal.fire({
                                                        icon: 'success',
                                                        title: 'Tersimpan',
                                                        text: canManageMitraEvent
                                                            ? 'Mitra event berhasil dibuat.'
                                                            : 'Organizer event berhasil disimpan.',
                                                    });
                                                },
                                                onError: () => {
                                                    Swal.fire({
                                                        icon: 'error',
                                                        title: 'Gagal',
                                                        text: 'Periksa kembali data organizer.',
                                                    });
                                                },
                                            },
                                        );
                                    }}
                                >
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">
                                            {canManageMitraEvent ? 'Nama Penanggung Jawab' : 'Nama Penanggung Jawab'}
                                        </label>
                                        <input
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
                                        <label className="text-sm font-semibold text-slate-700">
                                            Email {canManageMitraEvent ? '' : '(opsional)'}
                                        </label>
                                        <input
                                            type="email"
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
                                        {canManageMitraEvent && (
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
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Nama EO / Organizer (opsional)
                                        </label>
                                        <input
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={createForm.data.eo_name}
                                            onChange={(event) =>
                                                createForm.setData(
                                                    'eo_name',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={createForm.errors.eo_name}
                                        />
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
                    <form
                        className="mt-6 flex flex-wrap gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get(
                                '/admin/events/organizers',
                                Object.fromEntries(data.entries()),
                                { preserveState: true },
                            );
                        }}
                    >
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Status</span>
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Semua status</option>
                                <option value="pending">Pending</option>
                                <option value="verified">Verified</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </label>
                        <Button
                            type="submit"
                            className="bg-sky-600 text-white hover:bg-sky-700"
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
                                    <th className="px-4 py-3 text-left">EO</th>
                                    <th className="px-4 py-3 text-left">
                                        Kontak
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {organizers.data.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">
                                                {item.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-slate-600">
                                                {item.email ?? '-'}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {item.phone ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={
                                                    item.status === 'verified'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : item.status ===
                                                            'suspended'
                                                          ? 'bg-rose-50 text-rose-700'
                                                          : 'bg-amber-50 text-amber-700'
                                                }
                                            >
                                                {item.status}
                                            </Badge>
                                            {item.verification_status && (
                                                <div className="mt-1 text-xs text-slate-400">
                                                    Verifikasi:{' '}
                                                    {item.verification_status}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="border-sky-200 text-slate-700 hover:bg-sky-50"
                                                >
                                                    <Link
                                                        href={`/admin/events/organizers/${item.id}`}
                                                    >
                                                        {canManageMitraEvent && item.status !== 'verified'
                                                            ? 'Validasi Dokumen'
                                                            : 'Detail'}
                                                    </Link>
                                                </Button>
                                                {canManageMitraEvent && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            Swal.fire({
                                                                icon: 'warning',
                                                                title: 'Hapus mitra event dan semua datanya?',
                                                                html: `Mitra <b>${item.name}</b> akan dihapus permanen. Semua event, tiket, booking, pembayaran, attendee, scan, refund, dispute, komisi, settlement, staff, dokumen, dan file upload terkait ikut dihapus.`,
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
                                                                        `/admin/events/organizers/${item.id}`,
                                                                        {
                                                                            onSuccess:
                                                                                () => {
                                                                                    Swal.fire(
                                                                                        {
                                                                                            icon: 'success',
                                                                                            title: 'Terhapus',
                                                                                            text: 'Mitra event dihapus.',
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
                                                                                                errors.organizer ??
                                                                                                'Mitra event gagal dihapus.',
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
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {organizers.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-8 text-center text-sm text-slate-500"
                                        >
                                            Belum ada data EO.
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
