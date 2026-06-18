import { Head, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ReviewRow = {
    id: number;
    product_type: string;
    product_title: string;
    rating: number;
    comment?: string | null;
    status: string;
    reply?: string | null;
    reply_by?: string | null;
    user_name?: string | null;
    created_at?: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    filters: {
        status?: string;
        q?: string;
    };
    statusOptions: string[];
    reviews: {
        data: ReviewRow[];
        links: PaginationLink[];
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Review & Rating', href: '/admin/special-programs/reviews' },
];

const statusTone = (status: string) => {
    switch (status) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700';
        case 'removed':
            return 'bg-rose-50 text-rose-700';
        default:
            return 'bg-slate-100 text-slate-600';
    }
};

export default function SpecialProgramReviewsIndex({ filters, statusOptions, reviews }: Props) {
    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/admin/special-programs/reviews', Object.fromEntries(form.entries()), { preserveState: true });
    };

    const handleReply = async (review: ReviewRow) => {
        const result = await Swal.fire({
            title: `Balas ulasan ${review.product_title}`,
            input: 'textarea',
            inputLabel: 'Balasan',
            inputPlaceholder: 'Tulis balasan resmi untuk peserta...',
            inputValue: review.reply ?? '',
            showCancelButton: true,
            confirmButtonText: 'Kirim',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!value) return 'Balasan wajib diisi.';
                return null;
            },
        });

        if (!result.isConfirmed) return;

        router.post(`/admin/special-programs/reviews/${review.id}/reply`, { reply: result.value }, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire('Tersimpan', 'Balasan ulasan berhasil dipublikasikan.', 'success');
            },
        });
    };

    const handleDelete = async (review: ReviewRow) => {
        const result = await Swal.fire({
            title: 'Sembunyikan ulasan?',
            text: 'Ulasan akan disembunyikan dari publik, tetapi riwayatnya tetap tersimpan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sembunyikan',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;

        router.delete(`/admin/special-programs/reviews/${review.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire('Berhasil', 'Ulasan berhasil disembunyikan.', 'success');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Review & Rating Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Review & Rating Special Program</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Pantau pengalaman peserta, balas ulasan, dan sembunyikan ulasan yang tidak layak tampil.
                    </p>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-3">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Status</label>
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua</option>
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Cari</label>
                            <input
                                name="q"
                                defaultValue={filters.q ?? ''}
                                placeholder="Cari komentar, balasan, atau nama program"
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Terapkan filter
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Program</th>
                                    <th className="px-4 py-3 text-left">User</th>
                                    <th className="px-4 py-3 text-left">Rating</th>
                                    <th className="px-4 py-3 text-left">Komentar</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.data.map((review) => (
                                    <tr key={review.id} className="border-t border-slate-100 align-top">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-900">{review.product_title}</p>
                                            <p className="text-xs text-slate-500">Special Program</p>
                                        </td>
                                        <td className="px-4 py-3">{review.user_name ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-amber-600">{review.rating}/5</span>
                                        </td>
                                        <td className="max-w-md px-4 py-3 text-xs text-slate-500">
                                            <div>{review.comment ?? '-'}</div>
                                            {review.reply && (
                                                <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                                                    <span className="font-semibold">Balasan:</span> {review.reply}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={statusTone(review.status)}>{review.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleReply(review)}>
                                                    Balas
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleDelete(review)}>
                                                    Sembunyikan
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {reviews.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada ulasan special program.
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
