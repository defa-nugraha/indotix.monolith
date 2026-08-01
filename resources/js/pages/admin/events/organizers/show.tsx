import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';

type Organizer = {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    status: string;
    notes?: string | null;
    documents?: Record<string, any> | null;
    onboarding?: {
        responsible_name?: string | null;
        responsible_phone?: string | null;
        responsible_role?: string | null;
        eo_name?: string | null;
        organizer_type?: string | null;
        founded_year?: number | null;
        eo_description?: string | null;
        legal_doc_type?: string | null;
        legal_doc_number?: string | null;
        legal_doc_path?: string | null;
        ktp_path?: string | null;
        selfie_ktp_path?: string | null;
        bank_name?: string | null;
        bank_account_number?: string | null;
        bank_account_name?: string | null;
        bank_account_relation?: string | null;
        operational_phone?: string | null;
        operational_email?: string | null;
        operational_hours?: string | null;
        verification_status?: string | null;
        verification_reason?: string | null;
        created_at?: string | null;
    } | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Mitra Event (EO)', href: '/admin/events/organizers' },
    { title: 'Detail', href: '#' },
];

const statusTone = (status?: string | null) => {
    if (status === 'verified') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending') return 'bg-amber-50 text-amber-700';
    if (status === 'suspended' || status === 'rejected')
        return 'bg-rose-50 text-rose-700';
    return 'bg-slate-50 text-slate-600';
};

export default function EventOrganizerShow({
    organizer,
    canManageMitraEvent = false,
}: {
    organizer: Organizer;
    canManageMitraEvent?: boolean;
}) {
    const previewUrl = (path?: string | null) =>
        path ? `/storage/${path}` : null;

    const DocumentPreview = ({
        label,
        path,
    }: {
        label: string;
        path?: string | null;
    }) => {
        if (!path) {
            return (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-xs text-slate-500">
                    {label}: belum diunggah
                </div>
            );
        }
        const url = previewUrl(path);
        const isPdf = path.toLowerCase().endsWith('.pdf');
        return (
            <div className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm">
                <p className="text-xs font-semibold text-slate-600">{label}</p>
                {isPdf ? (
                    <a
                        href={url ?? '#'}
                        className="mt-2 inline-flex rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600"
                    >
                        Lihat PDF
                    </a>
                ) : (
                    <img
                        src={url ?? ''}
                        alt={label}
                        className="mt-2 h-24 w-full rounded-lg object-cover"
                    />
                )}
            </div>
        );
    };

    const handleVerify = async (action: 'approve' | 'reject') => {
        const status = action === 'approve' ? 'verified' : 'suspended';
        const result =
            action === 'approve'
                ? await Swal.fire({
                      title: 'Setujui mitra event?',
                      text: 'Dokumen pendaftaran EO akan diverifikasi.',
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonText: 'Setujui',
                      cancelButtonText: 'Batal',
                  })
                : await Swal.fire({
                      title: 'Tolak mitra event?',
                      input: 'textarea',
                      inputLabel: 'Alasan penolakan',
                      inputPlaceholder:
                          'Tulis alasan agar mitra bisa memperbaiki dokumen.',
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
            `/admin/events/organizers/${organizer.id}/status`,
            {
                status,
                notes: action === 'reject' ? result.value : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Status verifikasi diperbarui.',
                        confirmButtonText: 'OK',
                    });
                },
                onError: () => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: 'Gagal memperbarui status verifikasi.',
                        confirmButtonText: 'OK',
                    });
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail EO" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Detail Mitra Event
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                {organizer.name}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {organizer.email ?? '-'}
                                {organizer.phone ? ` · ${organizer.phone}` : ''}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                Tanggal pengajuan:{' '}
                                {organizer.onboarding?.created_at
                                    ? new Date(
                                          organizer.onboarding.created_at,
                                      ).toLocaleDateString('id-ID', {
                                          day: '2-digit',
                                          month: 'long',
                                          year: 'numeric',
                                      })
                                    : '-'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge className={statusTone(organizer.status)}>
                                {organizer.status}
                            </Badge>
                            {organizer.onboarding?.verification_status && (
                                <Badge
                                    className={statusTone(
                                        organizer.onboarding
                                            .verification_status,
                                    )}
                                >
                                    {organizer.onboarding.verification_status}
                                </Badge>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-6">
                        {organizer.onboarding && (
                            <>
                                <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Penanggung Jawab
                                    </h2>
                                    <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                        <div>
                                            <span className="font-semibold">
                                                Nama:
                                            </span>{' '}
                                            {organizer.onboarding
                                                .responsible_name ?? '-'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                HP:
                                            </span>{' '}
                                            {organizer.onboarding
                                                .responsible_phone ?? '-'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                Jabatan:
                                            </span>{' '}
                                            {organizer.onboarding
                                                .responsible_role ?? '-'}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        EO / Organisasi
                                    </h2>
                                    <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                        <div>
                                            <span className="font-semibold">
                                                Nama EO:
                                            </span>{' '}
                                            {organizer.onboarding.eo_name ??
                                                '-'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                Jenis:
                                            </span>{' '}
                                            {organizer.onboarding
                                                .organizer_type ?? '-'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                Tahun berdiri:
                                            </span>{' '}
                                            {organizer.onboarding
                                                .founded_year ?? '-'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                Deskripsi:
                                            </span>{' '}
                                            {organizer.onboarding
                                                .eo_description ?? '-'}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Legalitas & Operasional
                                    </h2>
                                    <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                        <div>
                                            <span className="font-semibold">
                                                Jenis dokumen:
                                            </span>{' '}
                                            {organizer.onboarding
                                                .legal_doc_type ?? '-'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                Nomor dokumen:
                                            </span>{' '}
                                            {organizer.onboarding
                                                .legal_doc_number ?? '-'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                Kontak:
                                            </span>{' '}
                                            {organizer.onboarding
                                                .operational_phone ?? '-'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                Email:
                                            </span>{' '}
                                            {organizer.onboarding
                                                .operational_email ?? '-'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                Jam:
                                            </span>{' '}
                                            {organizer.onboarding
                                                .operational_hours ?? '-'}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Dokumen
                                    </h2>
                                    <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                                        <DocumentPreview
                                            label="Dokumen Legal"
                                            path={
                                                organizer.onboarding
                                                    .legal_doc_path
                                            }
                                        />
                                        <DocumentPreview
                                            label="KTP"
                                            path={organizer.onboarding.ktp_path}
                                        />
                                        <DocumentPreview
                                            label="Selfie + KTP"
                                            path={
                                                organizer.onboarding
                                                    .selfie_ktp_path
                                            }
                                        />
                                    </div>
                                    {(organizer.onboarding
                                        .verification_reason ||
                                        organizer.notes) && (
                                        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                            Alasan penolakan:{' '}
                                            {organizer.onboarding
                                                .verification_reason ??
                                                organizer.notes}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="space-y-6">
                        {canManageMitraEvent && (
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
                        )}

                        <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900">
                                Rekening
                            </h3>
                            <div className="mt-2 text-sm text-slate-600">
                                <div>
                                    {organizer.onboarding?.bank_name ?? '-'}
                                </div>
                                <div>
                                    {organizer.onboarding
                                        ?.bank_account_number ?? '-'}
                                </div>
                                <div>
                                    {organizer.onboarding?.bank_account_name ??
                                        '-'}
                                </div>
                                <div>
                                    {organizer.onboarding
                                        ?.bank_account_relation ?? '-'}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900">
                                Status EO
                            </h3>
                            <div className="mt-2 text-sm text-slate-600">
                                {organizer.status}
                            </div>
                            {organizer.notes && (
                                <div className="mt-2 text-xs text-slate-500">
                                    Catatan: {organizer.notes}
                                </div>
                            )}
                            {canManageMitraEvent && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-4 w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                                    onClick={() => {
                                        Swal.fire({
                                            title: 'Kembalikan ke pending?',
                                            text: 'Status EO akan dikembalikan ke pending untuk review ulang.',
                                            icon: 'question',
                                            showCancelButton: true,
                                            confirmButtonText: 'Ya, pending',
                                            cancelButtonText: 'Batal',
                                        }).then((result) => {
                                            if (!result.isConfirmed) return;
                                            router.post(
                                                `/admin/events/organizers/${organizer.id}/status`,
                                                { status: 'pending', notes: null },
                                                { preserveScroll: true },
                                            );
                                        });
                                    }}
                                >
                                    Set Pending
                                </Button>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
