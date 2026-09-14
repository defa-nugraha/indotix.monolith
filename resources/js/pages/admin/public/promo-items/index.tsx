import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { BulkDeleteTable, BulkDeleteRow, BulkDeleteSelectAll } from '@/components/admin/bulk-delete-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/promo-items' },
    { title: 'Promo Spesial', href: '/admin/public/promo-items' },
];

type PromoItem = {
    id: number;
    title: string | null;
    slug: string | null;
    category: string | null;
    category_label: string | null;
    excerpt: string | null;
    image_path: string;
    link_url: string | null;
    voucher_code?: string | null;
    voucher_remaining_count?: number | null;
    sort_order: number;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
};

export default function PromoItemIndex({ items }: { items: PromoItem[] }) {
    const homepageSlotsFull =
        items.filter((item) => item.sort_order >= 1 && item.sort_order <= 3)
            .length >= 3;
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus promo?',
            text: 'Promo akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });

        if (!result.isConfirmed) return;

        router.delete(`/admin/public/promo-items/${id}`, {
            onSuccess: () =>
                Swal.fire({ title: 'Berhasil', text: 'Promo dihapus.', icon: 'success' }),
            onError: () =>
                Swal.fire({ title: 'Gagal', text: 'Promo gagal dihapus.', icon: 'error' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Promo Spesial">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/85 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-sky-600">
                                Promo Spesial
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                Kelola promo spesial
                            </h1>
                            <p className="text-sm text-slate-600">
                                Tambahkan promo yang tampil di halaman promo publik. Slot homepage 1-3 digunakan untuk section Promo Spesial di beranda.
                            </p>
                            <p className="text-xs text-slate-500">
                                Ukuran rekomendasi: slot homepage 1-2 → 600 × 800 px, slot 0 atau 3 → 1200 × 400 px.
                            </p>
                            {homepageSlotsFull && (
                                <p className="text-xs font-semibold text-amber-600">
                                    Semua slot homepage sudah terpakai. Promo baru tetap bisa aktif dengan slot 0.
                                </p>
                            )}
                        </div>
                        <Button asChild className="bg-sky-600 text-white hover:bg-sky-700">
                            <Link href="/admin/public/promo-items/create">Tambah Promo</Link>
                        </Button>
                    </div>
                </section>

                <section className="overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 shadow-sm">
                    <div className="overflow-x-auto">
                        <BulkDeleteTable className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <BulkDeleteSelectAll />
                                    <th className="px-4 py-3 text-left">Preview</th>
                                    <th className="px-4 py-3 text-left">Judul</th>
                                    <th className="px-4 py-3 text-left">Kategori</th>
                                    <th className="px-4 py-3 text-left">Voucher</th>
                                    <th className="px-4 py-3 text-left">Slot</th>
                                    <th className="px-4 py-3 text-left">Periode</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <BulkDeleteRow deleteUrl={`/admin/public/promo-items/${item.id}`} key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <img
                                                src={`/storage/${item.image_path}`}
                                                alt={item.title ?? 'Promo'}
                                                className="h-12 w-20 rounded-lg object-cover"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">
                                                {item.title ?? 'Tanpa judul'}
                                            </div>
                                            {item.excerpt && (
                                                <div className="line-clamp-1 text-xs text-slate-500">{item.excerpt}</div>
                                            )}
                                            {item.slug && (
                                                <Link
                                                    href={`/promo/${item.slug}`}
                                                    className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                                                >
                                                    Lihat detail publik
                                                </Link>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{item.category_label ?? 'Promo'}</td>
                                        <td className="px-4 py-3">
                                            {item.voucher_code ? (
                                                <div className="grid gap-1">
                                                    <span className="font-semibold text-slate-900">{item.voucher_code}</span>
                                                    <span className="text-xs text-slate-500">
                                                        {item.voucher_remaining_count === null || item.voucher_remaining_count === undefined
                                                            ? 'Kuota tidak dibatasi'
                                                            : `${item.voucher_remaining_count} tersisa`}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">Tidak terhubung</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.sort_order > 0 ? `Homepage ${item.sort_order}` : 'Halaman promo'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {item.starts_at ?? '-'} → {item.ends_at ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                                                {item.is_active ? 'active' : 'inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button asChild variant="outline" className="border-sky-200 text-slate-700 hover:bg-sky-50">
                                                    <Link href={`/admin/public/promo-items/${item.id}/edit`}>Edit</Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </BulkDeleteRow>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada promo spesial.
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
