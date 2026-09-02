import { Head, Link, useForm } from '@inertiajs/react';
import { FileText, Pencil, Trash2, Upload } from 'lucide-react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type DocumentRow = {
    business_type: 'wisata';
    label: string;
    id?: number | null;
    title?: string | null;
    file_url?: string | null;
    uploaded_by?: string | null;
    updated_at?: string | null;
    signatures_count: number;
};

type Props = {
    documents: DocumentRow[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kelola Mitra', href: '/admin/mitra' },
    { title: 'Dokumen S&K Mitra', href: '/admin/mitra-documents' },
];

export default function TermsDocuments({ documents }: Props) {
    const form = useForm<{
        business_type: 'wisata';
        title: string;
        document: File | null;
    }>({
        business_type: 'wisata',
        title: '',
        document: null,
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/admin/mitra-documents', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset('title', 'document');
                Swal.fire({
                    icon: 'success',
                    title: 'Dokumen disimpan',
                    text: 'Dokumen syarat dan ketentuan mitra berhasil diperbarui.',
                });
            },
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Pastikan dokumen berformat PDF dan data sudah lengkap.',
                }),
        });
    };

    const editDocument = (item: DocumentRow) => {
        form.setData({
            business_type: item.business_type,
            title: item.title ?? '',
            document: null,
        });
    };

    const deleteDocument = (item: DocumentRow) => {
        if (!item.id) {
            return;
        }

        Swal.fire({
            icon: 'warning',
            title: 'Hapus dokumen?',
            text: 'Dokumen S&K aktif akan dihapus dan mitra belum bisa menandatangani dokumen ini sampai PDF baru diunggah.',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            form.delete(`/admin/mitra-documents/${item.id}`, {
                preserveScroll: true,
                onSuccess: () =>
                    Swal.fire({
                        icon: 'success',
                        title: 'Dokumen dihapus',
                        text: 'Dokumen S&K mitra berhasil dihapus.',
                    }),
            });
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dokumen S&K Mitra" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-sky-600">
                        Dokumen Mitra
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold">
                        Kelola syarat dan ketentuan mitra
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Upload PDF syarat dan ketentuan untuk mitra wisata. Setelah pendaftaran disetujui, mitra akan diminta menandatangani dokumen ini.
                    </p>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    {documents.map((item) => (
                        <article key={item.business_type} className="rounded-3xl border border-sky-100/80 bg-white/90 p-5 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                                    <FileText className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-semibold text-slate-900">{item.label}</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {item.title ?? 'Belum ada dokumen aktif'}
                                    </p>
                                </div>
                            </div>
                            <dl className="mt-4 grid gap-3 text-sm text-slate-600">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <dt className="text-xs font-semibold uppercase text-slate-400">Ditandatangani</dt>
                                    <dd className="mt-1 font-semibold text-slate-900">{item.signatures_count} mitra</dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <dt className="text-xs font-semibold uppercase text-slate-400">Update terakhir</dt>
                                    <dd className="mt-1">{item.updated_at ?? '-'}</dd>
                                </div>
                            </dl>
                            {item.file_url && (
                                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                    <Button asChild variant="outline">
                                        <Link href={item.file_url} target="_blank">
                                            Lihat PDF
                                        </Link>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => editDocument(item)}
                                    >
                                        <Pencil className="mr-2 size-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={() => deleteDocument(item)}
                                    >
                                        <Trash2 className="mr-2 size-4" />
                                        Hapus
                                    </Button>
                                </div>
                            )}
                        </article>
                    ))}
                </section>

                <form onSubmit={submit} className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Kategori mitra</label>
                            <select
                                value={form.data.business_type}
                                onChange={(event) => form.setData('business_type', event.target.value as 'wisata')}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                <option value="wisata">Mitra Wisata</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Judul dokumen</label>
                            <input
                                value={form.data.title}
                                onChange={(event) => form.setData('title', event.target.value)}
                                placeholder="Contoh: S&K Mitra Wisata 2026"
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">File PDF</label>
                            <input
                                type="file"
                                accept="application/pdf,.pdf"
                                onChange={(event) => form.setData('document', event.target.files?.[0] ?? null)}
                                className="h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div className="mt-5">
                        <Button type="submit" disabled={form.processing} className="bg-sky-600 text-white hover:bg-sky-700">
                            <Upload className="mr-2 size-4" />
                            Simpan dokumen
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
