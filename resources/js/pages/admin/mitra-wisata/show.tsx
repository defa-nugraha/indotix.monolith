import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleDashed,
    Clock3,
    ShieldCheck,
    WalletCards,
    XCircle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

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
    created_at?: string | null;
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
    sensitiveDocumentUrls: {
        ktp?: string | null;
        selfie?: string | null;
        legal?: string | null;
    };
};

const verificationStatusMeta = (status?: string | null) => {
    if (status === 'verified') {
        return {
            label: 'Terverifikasi',
            description: 'Data dan dokumen destinasi telah disetujui admin.',
            icon: CheckCircle2,
            tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
            iconTone: 'text-emerald-600',
        };
    }

    if (status === 'pending') {
        return {
            label: 'Menunggu Verifikasi',
            description:
                'Pengajuan siap diperiksa dan memerlukan keputusan admin.',
            icon: Clock3,
            tone: 'border-amber-200 bg-amber-50 text-amber-900',
            iconTone: 'text-amber-600',
        };
    }

    if (status === 'rejected') {
        return {
            label: 'Ditolak',
            description:
                'Pengajuan memerlukan perbaikan sebelum dapat disetujui.',
            icon: XCircle,
            tone: 'border-rose-200 bg-rose-50 text-rose-900',
            iconTone: 'text-rose-600',
        };
    }

    return {
        label: 'Belum Diajukan',
        description: 'Data masih berupa draft dan belum diajukan oleh mitra.',
        icon: CircleDashed,
        tone: 'border-slate-200 bg-slate-50 text-slate-800',
        iconTone: 'text-slate-500',
    };
};

const payoutStatusMeta = (status?: string | null) => {
    if (status === 'verified') {
        return {
            label: 'Terverifikasi',
            description: 'Rekening payout telah diperiksa dan disetujui admin.',
            icon: CheckCircle2,
            tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
            iconTone: 'text-emerald-600',
        };
    }

    if (status === 'pending') {
        return {
            label: 'Menunggu Verifikasi',
            description:
                'Data rekening siap diperiksa dan memerlukan keputusan admin.',
            icon: Clock3,
            tone: 'border-amber-200 bg-amber-50 text-amber-900',
            iconTone: 'text-amber-600',
        };
    }

    if (status === 'rejected') {
        return {
            label: 'Ditolak',
            description:
                'Data rekening perlu diperbaiki sebelum dapat digunakan untuk payout.',
            icon: XCircle,
            tone: 'border-rose-200 bg-rose-50 text-rose-900',
            iconTone: 'text-rose-600',
        };
    }

    return {
        label: 'Belum Diajukan',
        description:
            'Data rekening payout masih berupa draft dan belum diajukan.',
        icon: CircleDashed,
        tone: 'border-slate-200 bg-slate-50 text-slate-800',
        iconTone: 'text-slate-500',
    };
};

const imageUrl = (path?: string | null) => (path ? `/storage/${path}` : null);

const DocItem = ({
    label,
    path,
    protectedUrl,
}: {
    label: string;
    path?: string | null;
    protectedUrl?: string | null;
}) => {
    const url = protectedUrl ?? imageUrl(path);
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

export default function AdminMitraWisataShow({
    mitra,
    onboarding,
    cityName,
    provinceName,
    sensitiveDocumentUrls,
}: Props) {
    const verificationStatus = onboarding.verification_status ?? 'draft';
    const verificationMeta = verificationStatusMeta(verificationStatus);
    const VerificationIcon = verificationMeta.icon;
    const payoutStatus = onboarding.payout_status ?? 'draft';
    const payoutMeta = payoutStatusMeta(payoutStatus);
    const PayoutStatusIcon = payoutMeta.icon;

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
                    ? 'Verifikasi destinasi wisata?'
                    : 'Tolak verifikasi destinasi?',
            text:
                action === 'approve'
                    ? 'Status akan berubah menjadi Terverifikasi dan mitra dapat melanjutkan pengelolaan destinasi.'
                    : undefined,
            icon: action === 'approve' ? 'question' : 'warning',
            input: action === 'reject' ? 'textarea' : undefined,
            inputLabel: action === 'reject' ? 'Alasan penolakan' : undefined,
            inputPlaceholder:
                action === 'reject'
                    ? 'Jelaskan data atau dokumen yang perlu diperbaiki'
                    : undefined,
            inputAttributes:
                action === 'reject'
                    ? { 'aria-label': 'Alasan penolakan verifikasi' }
                    : undefined,
            inputValidator: (value: string | null) => {
                if (action === 'reject' && !value) return 'Alasan wajib diisi.';
                return null;
            },
            showCancelButton: true,
            confirmButtonText:
                action === 'approve' ? 'Ya, Verifikasi' : 'Tolak Pengajuan',
            cancelButtonText: 'Batal',
            confirmButtonColor: action === 'approve' ? '#0284c7' : '#e11d48',
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
            title:
                action === 'approve'
                    ? 'Verifikasi rekening payout?'
                    : 'Tolak verifikasi rekening?',
            text:
                action === 'approve'
                    ? 'Status rekening akan berubah menjadi Terverifikasi dan dapat digunakan untuk proses payout.'
                    : undefined,
            icon: action === 'approve' ? 'question' : 'warning',
            input: action === 'reject' ? 'textarea' : undefined,
            inputLabel: action === 'reject' ? 'Alasan penolakan' : undefined,
            inputPlaceholder:
                action === 'reject'
                    ? 'Jelaskan data rekening yang perlu diperbaiki'
                    : undefined,
            inputAttributes:
                action === 'reject'
                    ? { 'aria-label': 'Alasan penolakan rekening payout' }
                    : undefined,
            inputValidator: (value: string | null) => {
                if (action === 'reject' && !value) return 'Alasan wajib diisi.';
                return null;
            },
            showCancelButton: true,
            confirmButtonText:
                action === 'approve' ? 'Ya, Verifikasi' : 'Tolak Rekening',
            cancelButtonText: 'Batal',
            confirmButtonColor: action === 'approve' ? '#0284c7' : '#e11d48',
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
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Detail Mitra Wisata
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                {onboarding.destination_name ??
                                    'Destinasi wisata'}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {mitra.name} · {mitra.email}
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
                        <div className="flex flex-wrap gap-2">
                            <div className="min-w-52 border-l-4 border-sky-500 pl-3">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase">
                                    Status Verifikasi Destinasi
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                    {verificationMeta.label}
                                </p>
                            </div>
                            <div className="min-w-44 border-l border-slate-200 pl-3">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase">
                                    Status Rekening Payout
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                    {payoutMeta.label}
                                </p>
                            </div>
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
                                    protectedUrl={sensitiveDocumentUrls.ktp}
                                />
                                <DocItem
                                    label="Selfie + KTP"
                                    path={onboarding.selfie_ktp_path}
                                    protectedUrl={sensitiveDocumentUrls.selfie}
                                />
                                <DocItem
                                    label="Dokumen Legalitas"
                                    path={onboarding.legal_doc_path}
                                    protectedUrl={sensitiveDocumentUrls.legal}
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
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-sky-600" />
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Verifikasi Destinasi
                                </h3>
                            </div>
                            <div
                                className={`mt-4 rounded-lg border p-4 ${verificationMeta.tone}`}
                                role="status"
                            >
                                <div className="flex items-start gap-3">
                                    <VerificationIcon
                                        className={`mt-0.5 h-5 w-5 shrink-0 ${verificationMeta.iconTone}`}
                                    />
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {verificationMeta.label}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 opacity-80">
                                            {verificationMeta.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {verificationStatus === 'rejected' &&
                                onboarding.verification_reason && (
                                    <div className="mt-3 rounded-lg border border-rose-100 bg-white px-4 py-3 text-xs leading-5 text-rose-700">
                                        <span className="font-semibold">
                                            Alasan penolakan:
                                        </span>{' '}
                                        {onboarding.verification_reason}
                                    </div>
                                )}
                            <p className="mt-4 text-xs leading-5 text-slate-500">
                                Periksa identitas, lokasi, foto, dan dokumen
                                legalitas sebelum mengambil keputusan.
                            </p>
                            <div className="mt-4 flex flex-col gap-3">
                                {verificationStatus !== 'verified' && (
                                    <Button
                                        className="bg-sky-600 text-white hover:bg-sky-700"
                                        onClick={() => handleVerify('approve')}
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Verifikasi & Setujui
                                    </Button>
                                )}
                                {verificationStatus !== 'rejected' && (
                                    <Button
                                        variant="outline"
                                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                        onClick={() => handleVerify('reject')}
                                    >
                                        <XCircle className="h-4 w-4" />
                                        {verificationStatus === 'verified'
                                            ? 'Batalkan Verifikasi'
                                            : 'Tolak & Minta Perbaikan'}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                            <div className="flex items-center gap-2">
                                <WalletCards className="h-5 w-5 text-sky-600" />
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Rekening Payout
                                </h3>
                            </div>
                            <div
                                className={`mt-4 rounded-lg border p-4 ${payoutMeta.tone}`}
                                role="status"
                            >
                                <div className="flex items-start gap-3">
                                    <PayoutStatusIcon
                                        className={`mt-0.5 h-5 w-5 shrink-0 ${payoutMeta.iconTone}`}
                                    />
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {payoutMeta.label}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 opacity-80">
                                            {payoutMeta.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {payoutStatus === 'rejected' &&
                                onboarding.payout_reason && (
                                    <div className="mt-3 rounded-lg border border-rose-100 bg-white px-4 py-3 text-xs leading-5 text-rose-700">
                                        <span className="font-semibold">
                                            Alasan penolakan:
                                        </span>{' '}
                                        {onboarding.payout_reason}
                                    </div>
                                )}
                            <dl className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/60 px-4 text-sm">
                                <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
                                    <dt className="text-xs font-semibold text-slate-500">
                                        Bank
                                    </dt>
                                    <dd className="font-medium text-slate-800">
                                        {onboarding.bank_name ?? '-'}
                                    </dd>
                                </div>
                                <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
                                    <dt className="text-xs font-semibold text-slate-500">
                                        Nomor rekening
                                    </dt>
                                    <dd className="font-medium break-all text-slate-800">
                                        {onboarding.bank_account_number ?? '-'}
                                    </dd>
                                </div>
                                <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
                                    <dt className="text-xs font-semibold text-slate-500">
                                        Atas nama
                                    </dt>
                                    <dd className="font-medium text-slate-800">
                                        {onboarding.bank_account_name ?? '-'}
                                    </dd>
                                </div>
                            </dl>
                            <p className="mt-4 text-xs leading-5 text-slate-500">
                                Periksa nama bank, nomor rekening, dan nama
                                pemilik rekening sebelum mengambil keputusan.
                            </p>
                            <div className="mt-4 flex flex-col gap-3">
                                {payoutStatus !== 'verified' && (
                                    <Button
                                        className="bg-sky-600 text-white hover:bg-sky-700"
                                        onClick={() => handlePayout('approve')}
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Verifikasi Rekening
                                    </Button>
                                )}
                                {payoutStatus !== 'rejected' && (
                                    <Button
                                        variant="outline"
                                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                        onClick={() => handlePayout('reject')}
                                    >
                                        <XCircle className="h-4 w-4" />
                                        {payoutStatus === 'verified'
                                            ? 'Batalkan Verifikasi Rekening'
                                            : 'Tolak & Minta Perbaikan'}
                                    </Button>
                                )}
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
