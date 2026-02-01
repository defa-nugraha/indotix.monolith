import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';

type DestinationRow = {
    id: number;
    destination_name?: string | null;
    description?: string | null;
    content_hidden: boolean;
    content_hidden_reason?: string | null;
    photo_gate_path?: string | null;
    photo_area_path?: string | null;
    photo_ticket_path?: string | null;
    photo_gate_hidden: boolean;
    photo_area_hidden: boolean;
    photo_ticket_hidden: boolean;
};

type ReviewRow = {
    id: number;
    rating: number;
    comment?: string | null;
    status: string;
    flag_reason?: string | null;
    destination?: string | null;
};

type Props = {
    destinations: { data: DestinationRow[] };
    reviews: { data: ReviewRow[] };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Konten & Review', href: '/admin/wisata/content' },
];

const imageUrl = (path?: string | null) => (path ? `/storage/${path}` : null);

export default function AdminWisataContent({ destinations, reviews }: Props) {
    const handleContent = async (item: DestinationRow) => {
        const result = await Swal.fire({
            title: item.content_hidden ? 'Tampilkan konten?' : 'Sembunyikan konten?',
            input: 'textarea',
            inputLabel: 'Alasan moderasi',
            inputPlaceholder: 'Tulis alasan...',
            showCancelButton: true,
            confirmButtonText: item.content_hidden ? 'Tampilkan' : 'Sembunyikan',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!item.content_hidden && !value) return 'Alasan wajib diisi.';
                return null;
            },
        });

        if (!result.isConfirmed) return;

        router.post(`/admin/wisata/content/${item.id}`, {
            content_hidden: !item.content_hidden,
            reason: result.value,
        });
    };

    const handlePhoto = (item: DestinationRow, key: 'photo_gate_hidden' | 'photo_area_hidden' | 'photo_ticket_hidden') => {
        router.post(`/admin/wisata/content/${item.id}`, {
            content_hidden: item.content_hidden,
            reason: item.content_hidden_reason,
            [key]: !item[key],
        });
    };

    const handleReview = async (review: ReviewRow, status: string) => {
        const result = await Swal.fire({
            title: 'Update review',
            input: 'textarea',
            inputLabel: 'Alasan',
            inputPlaceholder: 'Tulis alasan...',
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;

        router.post(`/admin/wisata/reviews/${review.id}`, {
            status,
            reason: result.value,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Konten & Review Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Moderasi Konten Destinasi</h1>
                    <div className="mt-6 grid gap-4">
                        {destinations.data.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-900">{item.destination_name ?? '-'}</p>
                                        <p className="text-xs text-slate-500">{item.description ?? '-'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={item.content_hidden ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>
                                            {item.content_hidden ? 'Hidden' : 'Visible'}
                                        </Badge>
                                        <Button size="sm" variant="outline" onClick={() => handleContent(item)}>
                                            {item.content_hidden ? 'Tampilkan' : 'Sembunyikan'}
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    {([
                                        { key: 'photo_gate_hidden', path: item.photo_gate_path, label: 'Gerbang' },
                                        { key: 'photo_area_hidden', path: item.photo_area_path, label: 'Area' },
                                        { key: 'photo_ticket_hidden', path: item.photo_ticket_path, label: 'Loket' },
                                    ] as const).map((photo) => (
                                        <div key={photo.key} className="rounded-xl border border-slate-100 p-2">
                                            {photo.path ? (
                                                <img src={imageUrl(photo.path) ?? ''} alt={photo.label} className="h-24 w-full rounded-lg object-cover" />
                                            ) : (
                                                <div className="h-24 rounded-lg bg-slate-50 text-xs text-slate-400 flex items-center justify-center">Tidak ada foto</div>
                                            )}
                                            <div className="mt-2 flex items-center justify-between text-xs">
                                                <span>{photo.label}</span>
                                                <Button size="sm" variant="outline" onClick={() => handlePhoto(item, photo.key)}>
                                                    {item[photo.key] ? 'Tampilkan' : 'Sembunyikan'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Review & Rating</h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Destinasi</th>
                                    <th className="px-4 py-3 text-left">Rating</th>
                                    <th className="px-4 py-3 text-left">Komentar</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.data.map((review) => (
                                    <tr key={review.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{review.destination ?? '-'}</td>
                                        <td className="px-4 py-3">{review.rating}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{review.comment ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={review.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}>
                                                {review.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleReview(review, 'flagged')}>
                                                    Flag
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleReview(review, 'removed')}>
                                                    Take Down
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleReview(review, 'active')}>
                                                    Pulihkan
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {reviews.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada review.
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
