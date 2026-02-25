import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/promo-items' },
    { title: 'Promo Terkini', href: '/admin/public/promo-items' },
    { title: 'Edit', href: '#' },
];

type PromoItem = {
    id: number;
    title: string | null;
    link_url: string | null;
    sort_order: number;
    is_active: boolean;
    image_path: string;
};

export default function PromoItemEdit({ promoItem }: { promoItem: PromoItem }) {
    const form = useForm({
        title: promoItem.title ?? '',
        link_url: promoItem.link_url ?? '',
        sort_order: promoItem.sort_order ?? 0,
        is_active: promoItem.is_active ?? true,
        image: null as File | null,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Promo Terkini">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Edit Promo Terkini</h1>
                    <form
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(`/admin/public/promo-items/${promoItem.id}`, {
                                method: 'put',
                                forceFormData: true,
                                onSuccess: () =>
                                    Swal.fire({ title: 'Berhasil', text: 'Promo diperbarui.', icon: 'success' }),
                                onError: () =>
                                    Swal.fire({ title: 'Gagal', text: 'Promo gagal diperbarui.', icon: 'error' }),
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label>Judul</Label>
                            <Input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} />
                            <InputError message={form.errors.title} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Link</Label>
                            <Input value={form.data.link_url} onChange={(event) => form.setData('link_url', event.target.value)} />
                            <InputError message={form.errors.link_url} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Urutan</Label>
                            <Input type="number" value={form.data.sort_order} onChange={(event) => form.setData('sort_order', Number(event.target.value))} />
                            <InputError message={form.errors.sort_order} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Gambar saat ini</Label>
                            <img
                                src={`/storage/${promoItem.image_path}`}
                                alt={promoItem.title ?? 'Promo'}
                                className="h-28 w-full max-w-md rounded-xl object-cover"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Ganti gambar (opsional)</Label>
                            <Input type="file" accept="image/*" onChange={(event) => form.setData('image', event.target.files?.[0] ?? null)} />
                            <p className="text-xs text-slate-500">Ukuran rekomendasi: 1200 × 600 px (rasio 2:1).</p>
                            <InputError message={form.errors.image} />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} />
                            Aktif
                        </label>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">Simpan Perubahan</Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
