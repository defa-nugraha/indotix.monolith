import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { BreadcrumbItem } from '@/types';

type Mitra = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    is_suspended?: boolean;
    suspended_reason?: string | null;
    suspended_at?: string | null;
};

type Onboarding = {
    current_step: number;
    hotel_name: string | null;
    property_type: string | null;
    city_code: string | null;
    address_short: string | null;
    estimated_room_count: number | null;
    responsible_name: string | null;
    responsible_nik: string | null;
    responsible_role: string | null;
    ktp_path: string | null;
    selfie_ktp_path: string | null;
    legal_doc_type: string | null;
    legal_doc_number: string | null;
    legal_doc_path: string | null;
    photo_front_path: string | null;
    photo_lobby_path: string | null;
    photo_room_path: string | null;
    address_full: string | null;
    maps_pin_url: string | null;
    reception_phone: string | null;
    operational_hours: string | null;
    reservation_pic: string | null;
    verification_status: 'draft' | 'pending' | 'verified' | 'rejected';
    verification_reason: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    tax_npwp: string | null;
    tax_type: string | null;
    payout_status: 'draft' | 'pending' | 'verified' | 'rejected';
    payout_reason: string | null;
    created_at?: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Kelola Mitra', href: '/admin/mitra' },
    { title: 'Detail Mitra', href: '#' },
];

const statusTone = (status: string) => {
    if (status === 'verified') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending') return 'bg-amber-50 text-amber-700';
    if (status === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-slate-50 text-slate-600';
};

const fileUrl = (path?: string | null) => (path ? `/storage/${path}` : null);

const Preview = ({ label, path }: { label: string; path?: string | null }) => {
    const url = fileUrl(path);
    const isPdf = path?.toLowerCase().endsWith('.pdf') ?? false;
    const hasFile = Boolean(path);

    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
            {hasFile ? (
                isPdf ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-500">
                        PDF
                    </div>
                ) : (
                    <img
                        src={url ?? ''}
                        alt={label}
                        className="h-12 w-12 rounded-lg object-cover"
                    />
                )
            ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-400">
                    -
                </div>
            )}
            <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">
                    {label}
                </p>
                {hasFile ? (
                    <a
                        href={url ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-sky-600 hover:underline"
                    >
                        Lihat
                    </a>
                ) : (
                    <p className="text-xs text-slate-400">Belum diunggah</p>
                )}
            </div>
        </div>
    );
};

export default function AdminMitraShow({
    mitra,
    onboarding,
    cityName,
}: {
    mitra: Mitra;
    onboarding: Onboarding;
    cityName?: string | null;
}) {
    const [editOpen, setEditOpen] = useState(false);
    const editForm = useForm({
        name: mitra.name ?? '',
        email: mitra.email ?? '',
        phone: mitra.phone ?? '',
        password: '',
        hotel_name: onboarding.hotel_name ?? '',
        responsible_name: onboarding.responsible_name ?? '',
        reception_phone: onboarding.reception_phone ?? '',
    });

    const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        editForm.put(`/admin/mitra/${mitra.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                editForm.setData('password', '');
                setEditOpen(false);
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Data mitra diperbarui.',
                    icon: 'success',
                });
            },
            onError: () =>
                Swal.fire({
                    title: 'Gagal',
                    text: 'Periksa kembali data mitra.',
                    icon: 'error',
                }),
        });
    };

    const handleSuspend = async () => {
        const result = await Swal.fire({
            title: mitra.is_suspended ? 'Aktifkan mitra?' : 'Suspend mitra?',
            text: mitra.is_suspended
                ? 'Akun mitra akan diaktifkan kembali.'
                : 'Mitra tidak bisa login hingga diaktifkan kembali.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: mitra.is_suspended ? 'Aktifkan' : 'Suspend',
            cancelButtonText: 'Batal',
            input: mitra.is_suspended ? undefined : 'textarea',
            inputLabel: mitra.is_suspended ? undefined : 'Alasan suspend',
            inputPlaceholder: mitra.is_suspended
                ? undefined
                : 'Tulis alasan suspend',
            inputValidator: (value: string | null) => {
                if (!mitra.is_suspended && !value) {
                    return 'Alasan suspend wajib diisi.';
                }
                return null;
            },
        });

        if (!result.isConfirmed) return;

        router.post(
            `/admin/mitra/${mitra.id}/suspend`,
            {
                action: mitra.is_suspended ? 'unsuspend' : 'suspend',
                reason: mitra.is_suspended ? null : result.value,
            },
            {
                onSuccess: () =>
                    Swal.fire({
                        title: 'Berhasil',
                        text: mitra.is_suspended
                            ? 'Mitra diaktifkan kembali.'
                            : 'Mitra berhasil disuspend.',
                        icon: 'success',
                    }),
                onError: () =>
                    Swal.fire({
                        title: 'Gagal',
                        text: 'Tidak dapat memperbarui status suspend.',
                        icon: 'error',
                    }),
            },
        );
    };
    const handleVerify = async (action: 'approve' | 'reject') => {
        const result =
            action === 'approve'
                ? await Swal.fire({
                      title: 'Verifikasi mitra?',
                      text: 'Status verifikasi akan menjadi VERIFIED.',
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonText: 'Setujui',
                      cancelButtonText: 'Batal',
                  })
                : await Swal.fire({
                      title: 'Tolak verifikasi?',
                      input: 'textarea',
                      inputLabel: 'Alasan penolakan',
                      inputPlaceholder: 'Tulis alasan penolakan',
                      inputAttributes: { 'aria-label': 'Alasan penolakan' },
                      showCancelButton: true,
                      confirmButtonText: 'Tolak',
                      cancelButtonText: 'Batal',
                      inputValidator: (value) => {
                          if (!value) {
                              return 'Alasan wajib diisi.';
                          }
                          return null;
                      },
                  });

        if (!result.isConfirmed) return;

        router.post(
            `/admin/mitra/${mitra.id}/verify`,
            {
                action,
                reason: action === 'reject' ? result.value : null,
            },
            {
                onSuccess: () =>
                    Swal.fire({
                        title: 'Berhasil',
                        text: 'Status verifikasi diperbarui.',
                        icon: 'success',
                    }),
                onError: () =>
                    Swal.fire({
                        title: 'Gagal',
                        text: 'Tidak dapat memperbarui status verifikasi.',
                        icon: 'error',
                    }),
            },
        );
    };

    const handlePayout = async (action: 'approve' | 'reject') => {
        const result =
            action === 'approve'
                ? await Swal.fire({
                      title: 'Setujui payout?',
                      text: 'Status payout akan menjadi VERIFIED.',
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonText: 'Setujui',
                      cancelButtonText: 'Batal',
                  })
                : await Swal.fire({
                      title: 'Tolak payout?',
                      input: 'textarea',
                      inputLabel: 'Alasan penolakan',
                      inputPlaceholder: 'Tulis alasan penolakan',
                      inputAttributes: { 'aria-label': 'Alasan penolakan' },
                      showCancelButton: true,
                      confirmButtonText: 'Tolak',
                      cancelButtonText: 'Batal',
                      inputValidator: (value) => {
                          if (!value) {
                              return 'Alasan wajib diisi.';
                          }
                          return null;
                      },
                  });

        if (!result.isConfirmed) return;

        router.post(
            `/admin/mitra/${mitra.id}/payout`,
            {
                action,
                reason: action === 'reject' ? result.value : null,
            },
            {
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
            <Head title="Detail Mitra">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <div className="pointer-events-none absolute top-12 -left-32 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
                <div className="pointer-events-none absolute top-0 right-[-10%] h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Mitra
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                {mitra.name}
                            </h1>
                            <p className="text-sm text-slate-600">
                                {mitra.email}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                Tanggal pengajuan:{' '}
                                {onboarding.created_at
                                    ? new Date(
                                          onboarding.created_at,
                                      ).toLocaleDateString('id-ID', {
                                          day: '2-digit',
                                          month: 'long',
                                          year: 'numeric',
                                      })
                                    : '-'}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge
                                className={statusTone(
                                    onboarding.verification_status,
                                )}
                            >
                                Verifikasi: {onboarding.verification_status}
                            </Badge>
                            <Badge
                                className={statusTone(onboarding.payout_status)}
                            >
                                Payout: {onboarding.payout_status}
                            </Badge>
                            <Badge
                                className={
                                    mitra.is_suspended
                                        ? 'bg-red-50 text-red-700'
                                        : 'bg-emerald-50 text-emerald-700'
                                }
                            >
                                {mitra.is_suspended ? 'suspended' : 'active'}
                            </Badge>
                            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-sky-200 text-sky-700 hover:bg-sky-50"
                                    onClick={() => setEditOpen(true)}
                                >
                                    Edit Mitra
                                </Button>
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Edit Mitra Hotel
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form
                                        className="grid gap-4"
                                        onSubmit={handleUpdate}
                                    >
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-slate-700">
                                                    Nama <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                    value={editForm.data.name}
                                                    required
                                                    onChange={(event) =>
                                                        editForm.setData(
                                                            'name',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        editForm.errors.name
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-slate-700">
                                                    Email <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                    value={editForm.data.email}
                                                    required
                                                    onChange={(event) =>
                                                        editForm.setData(
                                                            'email',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        editForm.errors.email
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-slate-700">
                                                    Nomor HP
                                                </label>
                                                <input
                                                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                    value={editForm.data.phone}
                                                    onChange={(event) =>
                                                        editForm.setData(
                                                            'phone',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        editForm.errors.phone
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-slate-700">
                                                    Password Baru
                                                </label>
                                                <input
                                                    type="password"
                                                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                    value={
                                                        editForm.data.password
                                                    }
                                                    onChange={(event) =>
                                                        editForm.setData(
                                                            'password',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Kosongkan jika tidak diubah"
                                                />
                                                <InputError
                                                    message={
                                                        editForm.errors.password
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-slate-700">
                                                    Nama Hotel
                                                </label>
                                                <input
                                                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                    value={
                                                        editForm.data
                                                            .hotel_name
                                                    }
                                                    onChange={(event) =>
                                                        editForm.setData(
                                                            'hotel_name',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        editForm.errors
                                                            .hotel_name
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-slate-700">
                                                    Penanggung Jawab
                                                </label>
                                                <input
                                                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                    value={
                                                        editForm.data
                                                            .responsible_name
                                                    }
                                                    onChange={(event) =>
                                                        editForm.setData(
                                                            'responsible_name',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        editForm.errors
                                                            .responsible_name
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2 md:col-span-2">
                                                <label className="text-sm font-semibold text-slate-700">
                                                    Nomor Resepsionis
                                                </label>
                                                <input
                                                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                                    value={
                                                        editForm.data
                                                            .reception_phone
                                                    }
                                                    onChange={(event) =>
                                                        editForm.setData(
                                                            'reception_phone',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        editForm.errors
                                                            .reception_phone
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter className="gap-2 sm:justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setEditOpen(false)
                                                }
                                            >
                                                Batal
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="bg-sky-600 text-white hover:bg-sky-700"
                                                disabled={editForm.processing}
                                            >
                                                Simpan Perubahan
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                            <Button
                                variant="outline"
                                className={
                                    mitra.is_suspended
                                        ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                        : 'border-red-200 text-red-600 hover:bg-red-50'
                                }
                                onClick={handleSuspend}
                            >
                                {mitra.is_suspended ? 'Aktifkan' : 'Suspend'}
                            </Button>
                        </div>
                    </div>
                    {mitra.is_suspended && mitra.suspended_reason && (
                        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                            Alasan suspend: {mitra.suspended_reason}
                        </div>
                    )}
                    {mitra.is_suspended && (
                        <div className="mt-3 text-sm text-slate-500">
                            Tanggal suspend:{' '}
                            <span className="font-semibold text-slate-900">
                                {mitra.suspended_at ?? '-'}
                            </span>
                        </div>
                    )}
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Tahap 1 - Data Hotel
                        </h2>
                        <span className="text-xs text-slate-500">
                            Step {onboarding.current_step}
                        </span>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Nama Hotel
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.hotel_name ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Jenis Properti
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.property_type ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Kota
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {cityName ??
                                    onboarding.city_code ??
                                    'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Alamat singkat
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.address_short ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Perkiraan kamar
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.estimated_room_count ??
                                    'Belum diisi'}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Tahap 2 - Verifikasi Hotel
                        </h2>
                        <Badge
                            className={statusTone(
                                onboarding.verification_status,
                            )}
                        >
                            {onboarding.verification_status}
                        </Badge>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Nama sesuai KTP
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.responsible_name ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                NIK
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.responsible_nik ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Jabatan
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.responsible_role ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Legalitas
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.legal_doc_type ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Nomor dokumen
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.legal_doc_number ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs text-slate-400 uppercase">
                                Alamat lengkap
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.address_full ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs text-slate-400 uppercase">
                                Pin Maps
                            </p>
                            {onboarding.maps_pin_url ? (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="mt-2 border-sky-200 text-sky-700 hover:bg-sky-50"
                                >
                                    <a
                                        href={onboarding.maps_pin_url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Lihat Google Maps
                                    </a>
                                </Button>
                            ) : (
                                <p className="text-sm font-semibold text-slate-900">
                                    Belum diisi
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Nomor resepsionis
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.reception_phone ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Jam operasional
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.operational_hours ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                PIC reservasi
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.reservation_pic ?? 'Belum diisi'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                        <Preview label="KTP" path={onboarding.ktp_path} />
                        <Preview
                            label="Selfie + KTP"
                            path={onboarding.selfie_ktp_path}
                        />
                        <Preview
                            label="Dokumen Legalitas"
                            path={onboarding.legal_doc_path}
                        />
                        <Preview
                            label="Foto Depan"
                            path={onboarding.photo_front_path}
                        />
                        <Preview
                            label="Foto Resepsionis"
                            path={onboarding.photo_lobby_path}
                        />
                        <Preview
                            label="Foto Kamar"
                            path={onboarding.photo_room_path}
                        />
                    </div>

                    {onboarding.verification_status === 'rejected' &&
                        onboarding.verification_reason && (
                            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                Alasan penolakan:{' '}
                                {onboarding.verification_reason}
                            </div>
                        )}

                    <div className="mt-6 rounded-3xl border border-sky-100/80 bg-slate-50/70 p-5">
                        <h3 className="text-sm font-semibold text-slate-900">
                            Aksi Verifikasi
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Setujui dokumen jika data sudah benar, atau tolak
                            dengan alasan agar mitra bisa mengajukan ulang.
                        </p>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <Button
                                className="bg-sky-600 text-white hover:bg-sky-700"
                                onClick={() => handleVerify('approve')}
                            >
                                Setujui
                            </Button>
                            <Button
                                variant="outline"
                                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                onClick={() => handleVerify('reject')}
                            >
                                Tolak
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Tahap 3 - Setup Finansial
                        </h2>
                        <Badge className={statusTone(onboarding.payout_status)}>
                            {onboarding.payout_status}
                        </Badge>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Nama bank
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.bank_name ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Nomor rekening
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.bank_account_number ??
                                    'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Nama pemilik rekening
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.bank_account_name ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                NPWP
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.tax_npwp ?? 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Tipe pajak
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {onboarding.tax_type ?? 'Belum diisi'}
                            </p>
                        </div>
                    </div>

                    {onboarding.payout_status === 'rejected' &&
                        onboarding.payout_reason && (
                            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                Alasan penolakan: {onboarding.payout_reason}
                            </div>
                        )}

                    <div className="mt-6 rounded-3xl border border-sky-100/80 bg-slate-50/70 p-5">
                        <h3 className="text-sm font-semibold text-slate-900">
                            Payout
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Verifikasi rekening payout jika data bank sudah
                            sesuai, atau tolak dengan alasan perbaikan.
                        </p>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <Button
                                className="bg-sky-600 text-white hover:bg-sky-700"
                                onClick={() => handlePayout('approve')}
                            >
                                Setujui Payout
                            </Button>
                            <Button
                                variant="outline"
                                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                onClick={() => handlePayout('reject')}
                            >
                                Tolak Payout
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
