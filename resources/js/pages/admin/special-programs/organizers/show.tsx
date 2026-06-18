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
    } | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Mitra Event (EO)', href: '/admin/events/organizers' },
    { title: 'Detail', href: '#' },
];

export default function EventOrganizerShow({ organizer }: { organizer: Organizer }) {
    const previewUrl = (path?: string | null) => (path ? `/storage/${path}` : null);

    const DocumentPreview = ({ label, path }: { label: string; path?: string | null }) => {
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
                    <a href={url ?? '#'} className="mt-2 inline-flex rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">
                        Lihat PDF
                    </a>
                ) : (
                    <img src={url ?? ''} alt={label} className="mt-2 h-24 w-full rounded-lg object-cover" />
                )}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail EO" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">{organizer.name}</h1>
                            <p className="text-sm text-slate-500">{organizer.email ?? '-'}</p>
                            <p className="text-sm text-slate-500">{organizer.phone ?? '-'}</p>
                        </div>
                        <Badge className={organizer.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : organizer.status === 'suspended' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}>
                            {organizer.status}
                        </Badge>
                    </div>
                </section>

                {organizer.onboarding && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Data Pendaftaran EO</h2>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-700 shadow-sm">
                                <p className="text-xs font-semibold uppercase text-slate-400">Penanggung Jawab</p>
                                <div className="mt-3 space-y-1">
                                    <div>Nama: {organizer.onboarding.responsible_name ?? '-'}</div>
                                    <div>HP: {organizer.onboarding.responsible_phone ?? '-'}</div>
                                    <div>Jabatan: {organizer.onboarding.responsible_role ?? '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-700 shadow-sm">
                                <p className="text-xs font-semibold uppercase text-slate-400">EO / Organisasi</p>
                                <div className="mt-3 space-y-1">
                                    <div>Nama EO: {organizer.onboarding.eo_name ?? '-'}</div>
                                    <div>Jenis: {organizer.onboarding.organizer_type ?? '-'}</div>
                                    <div>Tahun berdiri: {organizer.onboarding.founded_year ?? '-'}</div>
                                    <div>Deskripsi: {organizer.onboarding.eo_description ?? '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-700 shadow-sm">
                                <p className="text-xs font-semibold uppercase text-slate-400">Legalitas</p>
                                <div className="mt-3 space-y-1">
                                    <div>Jenis: {organizer.onboarding.legal_doc_type ?? '-'}</div>
                                    <div>Nomor: {organizer.onboarding.legal_doc_number ?? '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-700 shadow-sm">
                                <p className="text-xs font-semibold uppercase text-slate-400">Kontak Operasional</p>
                                <div className="mt-3 space-y-1">
                                    <div>PIC: {organizer.onboarding.operational_phone ?? '-'}</div>
                                    <div>Email: {organizer.onboarding.operational_email ?? '-'}</div>
                                    <div>Jam: {organizer.onboarding.operational_hours ?? '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-700 shadow-sm md:col-span-2">
                                <p className="text-xs font-semibold uppercase text-slate-400">Rekening</p>
                                <div className="mt-3 grid gap-2 md:grid-cols-2">
                                    <div>Bank: {organizer.onboarding.bank_name ?? '-'}</div>
                                    <div>Nomor: {organizer.onboarding.bank_account_number ?? '-'}</div>
                                    <div>Nama: {organizer.onboarding.bank_account_name ?? '-'}</div>
                                    <div>Relasi: {organizer.onboarding.bank_account_relation ?? '-'}</div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            <DocumentPreview label="Dokumen Legal" path={organizer.onboarding.legal_doc_path} />
                            <DocumentPreview label="KTP" path={organizer.onboarding.ktp_path} />
                            <DocumentPreview label="Selfie + KTP" path={organizer.onboarding.selfie_ktp_path} />
                        </div>
                    </section>
                )}

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Aksi Status</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                        {['pending', 'verified', 'suspended'].map((status) => (
                            <Button
                                key={status}
                                type="button"
                                variant={status === 'verified' ? 'default' : 'outline'}
                                className={status === 'verified' ? 'bg-sky-600 text-white hover:bg-sky-700' : ''}
                                onClick={() => {
                                    Swal.fire({
                                        title: 'Ubah status EO?',
                                        text: `Status akan diubah menjadi ${status}.`,
                                        icon: 'question',
                                        showCancelButton: true,
                                        confirmButtonText: 'Ya, simpan',
                                        cancelButtonText: 'Batal',
                                    }).then((result) => {
                                        if (!result.isConfirmed) {
                                            return;
                                        }
                                        router.post(
                                            `/admin/events/organizers/${organizer.id}/status`,
                                            { status },
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    Swal.fire({
                                                        icon: 'success',
                                                        title: 'Berhasil',
                                                        text: 'Status berhasil diperbarui.',
                                                        confirmButtonText: 'OK',
                                                    });
                                                },
                                                onError: () => {
                                                    Swal.fire({
                                                        icon: 'error',
                                                        title: 'Gagal',
                                                        text: 'Gagal memperbarui status.',
                                                        confirmButtonText: 'OK',
                                                    });
                                                },
                                            }
                                        );
                                    });
                                }}
                            >
                                {status}
                            </Button>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
