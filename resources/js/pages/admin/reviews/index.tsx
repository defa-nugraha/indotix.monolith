import { Head, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { BulkDeleteTable, BulkDeleteRow, BulkDeleteSelectAll } from '@/components/admin/bulk-delete-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

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
        type?: string;
        status?: string;
        q?: string;
    };
    typeOptions: string[];
    statusOptions: string[];
    reviews: {
        data: ReviewRow[];
        links: PaginationLink[];
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/dashboard' },
    { title: 'Ulasan Produk', href: '/admin/reviews' },
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

const typeLabel = (type: string) => {
    switch (type) {
        case 'hotel':
            return 'Hotel';
        case 'wisata':
            return 'Wisata';
        case 'event':
            return 'Event';
        case 'academy':
            return 'Academy';
        case 'souvenir':
            return 'Retail Shop';
        case 'special_program':
            return 'Special Program';
        default:
            return type;
    }
};

export default function AdminReviews({ filters, typeOptions, statusOptions, reviews }: Props) {
    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/admin/reviews', Object.fromEntries(form.entries()), { preserveState: true });
    };

    const handleReply = async (review: ReviewRow) => {
        const result = await Swal.fire({
            title: `Balas ulasan ${review.product_title}`,
            input: 'textarea',
            inputLabel: 'Balasan',
            inputPlaceholder: 'Tulis balasan...',
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

        router.post(`/admin/reviews/${review.id}/reply`, { reply: result.value });
    };

    const handleDelete = async (review: ReviewRow) => {
        const result = await Swal.fire({
            title: 'Hapus ulasan?',
            text: 'Ulasan akan disembunyikan dari publik.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;

        router.delete(`/admin/reviews/${review.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ulasan Produk" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Ulasan Produk</h1>
                    <p className="mt-1 text-sm text-slate-500">Balas dan moderasi ulasan user di semua produk.</p>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Tipe</label>
                            <select
                                name="type"
                                defaultValue={filters.type ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua</option>
                                {typeOptions.map((type) => (
                                    <option key={type} value={type}>
                                        {typeLabel(type)}
                                    </option>
                                ))}
                            </select>
                        </div>
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
                                placeholder="Cari komentar atau balasan"
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="md:col-span-4">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Terapkan filter
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <BulkDeleteTable className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <BulkDeleteSelectAll />
                                    <th className="px-4 py-3 text-left">Produk</th>
                                    <th className="px-4 py-3 text-left">User</th>
                                    <th className="px-4 py-3 text-left">Rating</th>
                                    <th className="px-4 py-3 text-left">Komentar</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.data.map((review) => (
                                    <BulkDeleteRow deleteUrl={`/admin/reviews/${review.id}`} key={review.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-900">{review.product_title}</p>
                                            <p className="text-xs text-slate-500">{typeLabel(review.product_type)}</p>
                                        </td>
                                        <td className="px-4 py-3">{review.user_name ?? '-'}</td>
                                        <td className="px-4 py-3">{review.rating}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
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
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </BulkDeleteRow>
                                ))}
                                {reviews.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada ulasan.
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
