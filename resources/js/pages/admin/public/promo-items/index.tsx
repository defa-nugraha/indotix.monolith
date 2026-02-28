import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/promo-items' },
    { title: 'Promo Terkini', href: '/admin/public/promo-items' },
];

type PromoItem = {
    id: number;
    title: string | null;
    image_path: string;
    link_url: string | null;
    sort_order: number;
    is_active: boolean;
};

export default function PromoItemIndex({ items }: { items: PromoItem[] }) {
    const reachedMax = items.filter((item) => item.is_active).length >= 3;
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
            <Head title="Kelola Promo Terkini">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/85 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                                Promo Terkini
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                Kelola promo terkini
                            </h1>
                            <p className="text-sm text-slate-600">
                                Tambahkan promo yang tampil di halaman publik. Maksimal 3 promo.
                            </p>
                            <p className="text-xs text-slate-500">
                                Ukuran rekomendasi: Urutan 1-2 → 600 × 800 px (rasio 3:4), Urutan 3 → 1200 × 400 px (rasio 3:1).
                            </p>
                        </div>
                        {reachedMax ? (
                            <Button disabled className="bg-slate-200 text-slate-500">
                                Maksimal 3 Promo
                            </Button>
                        ) : (
                            <Button asChild className="bg-sky-600 text-white hover:bg-sky-700">
                                <Link href="/admin/public/promo-items/create">Tambah Promo</Link>
                            </Button>
                        )}
                    </div>
                </section>

                <section className="overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Preview</th>
                                    <th className="px-4 py-3 text-left">Judul</th>
                                    <th className="px-4 py-3 text-left">Urutan</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
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
                                            {item.link_url && (
                                                <div className="text-xs text-slate-500">{item.link_url}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{item.sort_order}</td>
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
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada promo terkini.
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
