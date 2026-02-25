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
    type: string;
    reviews: {
        data: ReviewRow[];
        links: PaginationLink[];
    };
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

export default function MitraReviews({ type, reviews }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
        { title: `Ulasan ${typeLabel(type)}`, href: '#' },
    ];

    const baseUrl = type === 'wisata' ? '/mitra/wisata/reviews' : type === 'event' ? '/mitra/events/reviews' : '/mitra/reviews';

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

        router.post(`${baseUrl}/${review.id}/reply`, { reply: result.value });
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

        router.delete(`${baseUrl}/${review.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Ulasan ${typeLabel(type)}`} />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Ulasan {typeLabel(type)}</h1>
                    <p className="mt-1 text-sm text-slate-500">Balas ulasan pelanggan dan kelola feedback.</p>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
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
                                    <tr key={review.id} className="border-t border-slate-100">
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
                                    </tr>
                                ))}
                                {reviews.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada ulasan.
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
