import { Head, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import Swal from 'sweetalert2';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Mitra Wisata', href: '/admin/mitra-wisata' },
    { title: 'Detail Mitra Wisata', href: '#' },
];

type Onboarding = {
    id: number;
    responsible_name?: string | null;
    responsible_phone?: string | null;
    responsible_role?: string | null;
    destination_name?: string | null;
    destination_type?: string | null;
    description?: string | null;
    highlights?: string | null;
    province_code?: string | null;
    city_code?: string | null;
    address_full?: string | null;
    maps_pin_url?: string | null;
    open_days?: string[] | null;
    open_time?: string | null;
    close_time?: string | null;
    holiday_notes?: string | null;
    facilities?: string[] | null;
    photo_gate_path?: string | null;
    photo_area_path?: string | null;
    photo_ticket_path?: string | null;
    contact_phone?: string | null;
    contact_hours?: string | null;
    ktp_path?: string | null;
    selfie_ktp_path?: string | null;
    legal_doc_type?: string | null;
    legal_doc_number?: string | null;
    legal_doc_path?: string | null;
    bank_name?: string | null;
    bank_account_number?: string | null;
    bank_account_name?: string | null;
    verification_status?: string | null;
    verification_reason?: string | null;
    payout_status?: string | null;
    payout_reason?: string | null;
};

type Props = {
    mitra: {
        id: number;
        name: string;
        email: string;
        is_suspended: boolean;
        suspended_reason?: string | null;
        suspended_at?: string | null;
    };
    onboarding: Onboarding;
    cityName?: string | null;
    provinceName?: string | null;
};

const statusTone = (status?: string | null) => {
    if (status === 'verified') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending') return 'bg-amber-50 text-amber-700';
    if (status === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-slate-50 text-slate-600';
};

const imageUrl = (path?: string | null) => (path ? `/storage/${path}` : null);

const DocItem = ({ label, path }: { label: string; path?: string | null }) => {
    const url = imageUrl(path);
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
                <p className="text-[11px] font-semibold tracking-[0.15em] text-slate-400 uppercase">
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

export default function AdminMitraWisataShow({
    mitra,
    onboarding,
    cityName,
    provinceName,
}: Props) {
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
                if (!mitra.is_suspended && !value)
                    return 'Alasan suspend wajib diisi.';
                return null;
            },
        });

        if (!result.isConfirmed) return;

        router.post(
            `/admin/mitra-wisata/${mitra.id}/suspend`,
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
        const result = await Swal.fire({
            title:
                action === 'approve'
                    ? 'Setujui mitra wisata?'
                    : 'Tolak mitra wisata?',
            input: action === 'reject' ? 'textarea' : undefined,
            inputLabel: action === 'reject' ? 'Alasan penolakan' : undefined,
            inputValidator: (value: string | null) => {
                if (action === 'reject' && !value) return 'Alasan wajib diisi.';
                return null;
            },
            showCancelButton: true,
            confirmButtonText: action === 'approve' ? 'Setujui' : 'Tolak',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;
        router.post(
            `/admin/mitra-wisata/${mitra.id}/verify`,
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
        const result = await Swal.fire({
            title: action === 'approve' ? 'Setujui payout?' : 'Tolak payout?',
            input: action === 'reject' ? 'textarea' : undefined,
            inputLabel: action === 'reject' ? 'Alasan penolakan' : undefined,
            inputValidator: (value: string | null) => {
                if (action === 'reject' && !value) return 'Alasan wajib diisi.';
                return null;
            },
            showCancelButton: true,
            confirmButtonText: action === 'approve' ? 'Setujui' : 'Tolak',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;
        router.post(
            `/admin/mitra-wisata/${mitra.id}/payout`,
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
            <Head title="Detail Mitra Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.3em] text-sky-600 uppercase">
                                Detail Mitra Wisata
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                {onboarding.destination_name ??
                                    'Destinasi wisata'}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {mitra.name} · {mitra.email}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge
                                className={statusTone(
                                    onboarding.verification_status,
                                )}
                            >
                                {onboarding.verification_status}
                            </Badge>
                            <Badge
                                className={statusTone(onboarding.payout_status)}
                            >
                                {onboarding.payout_status}
                            </Badge>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Identitas Destinasi
                            </h2>
                            <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                <div>
                                    <span className="font-semibold">
                                        Jenis:
                                    </span>{' '}
                                    {onboarding.destination_type ?? '-'}
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        Provinsi:
                                    </span>{' '}
                                    {provinceName ?? '-'}
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        Kota/Kabupaten:
                                    </span>{' '}
                                    {cityName ?? '-'}
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        Alamat:
                                    </span>{' '}
                                    {onboarding.address_full ?? '-'}
                                </div>
                                <div>
                                    <span className="font-semibold">Maps:</span>{' '}
                                    {onboarding.maps_pin_url ?? '-'}
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        Deskripsi:
                                    </span>{' '}
                                    {onboarding.description ?? '-'}
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        Highlight:
                                    </span>{' '}
                                    {onboarding.highlights ?? '-'}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Operasional
                            </h2>
                            <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                <div>
                                    <span className="font-semibold">
                                        Hari buka:
                                    </span>{' '}
                                    {(onboarding.open_days ?? []).join(', ') ||
                                        '-'}
                                </div>
                                <div>
                                    <span className="font-semibold">Jam:</span>{' '}
                                    {onboarding.open_time ?? '-'} -{' '}
                                    {onboarding.close_time ?? '-'}
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        Catatan libur:
                                    </span>{' '}
                                    {onboarding.holiday_notes ?? '-'}
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        Fasilitas:
                                    </span>{' '}
                                    {(onboarding.facilities ?? []).join(', ') ||
                                        '-'}
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        Kontak loket:
                                    </span>{' '}
                                    {onboarding.contact_phone ?? '-'}
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        Jam kontak:
                                    </span>{' '}
                                    {onboarding.contact_hours ?? '-'}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Dokumen & Foto
                            </h2>
                            <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                                <DocItem
                                    label="Foto Gerbang"
                                    path={onboarding.photo_gate_path}
                                />
                                <DocItem
                                    label="Foto Area"
                                    path={onboarding.photo_area_path}
                                />
                                <DocItem
                                    label="Foto Loket"
                                    path={onboarding.photo_ticket_path}
                                />
                                <DocItem
                                    label="KTP"
                                    path={onboarding.ktp_path}
                                />
                                <DocItem
                                    label="Selfie + KTP"
                                    path={onboarding.selfie_ktp_path}
                                />
                                <DocItem
                                    label="Dokumen Legalitas"
                                    path={onboarding.legal_doc_path}
                                />
                            </div>
                            <div className="mt-3 text-xs text-slate-500">
                                Legalitas: {onboarding.legal_doc_type ?? '-'} ·{' '}
                                {onboarding.legal_doc_number ?? '-'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900">
                                Aksi Verifikasi
                            </h3>
                            <div className="mt-4 flex flex-col gap-3">
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

                        <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900">
                                Payout
                            </h3>
                            <div className="mt-2 text-sm text-slate-600">
                                <div>{onboarding.bank_name ?? '-'}</div>
                                <div>
                                    {onboarding.bank_account_number ?? '-'}
                                </div>
                                <div>{onboarding.bank_account_name ?? '-'}</div>
                            </div>
                            <div className="mt-4 flex flex-col gap-3">
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

                        <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900">
                                Status Akun
                            </h3>
                            <div className="mt-2 text-sm text-slate-600">
                                {mitra.is_suspended ? 'Suspended' : 'Active'}
                            </div>
                            {mitra.suspended_reason && (
                                <div className="mt-2 text-xs text-slate-500">
                                    Alasan: {mitra.suspended_reason}
                                </div>
                            )}
                            {mitra.suspended_at && (
                                <div className="mt-1 text-xs text-slate-400">
                                    Tanggal suspend: {mitra.suspended_at}
                                </div>
                            )}
                            <Button
                                type="button"
                                onClick={handleSuspend}
                                className={`mt-4 w-full ${mitra.is_suspended ? 'bg-sky-600 hover:bg-sky-700' : 'bg-rose-600 hover:bg-rose-700'} text-white`}
                            >
                                {mitra.is_suspended
                                    ? 'Aktifkan Akun'
                                    : 'Suspend Akun'}
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
