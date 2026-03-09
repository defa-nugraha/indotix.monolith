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
    { title: 'Tambah', href: '/admin/public/promo-items/create' },
];

export default function PromoItemCreate({
    nextSortOrder = 1,
    orderFull = false,
}: {
    nextSortOrder?: number;
    orderFull?: boolean;
}) {
    const form = useForm({
        title: '',
        link_url: '',
        sort_order: nextSortOrder,
        is_active: true,
        image: null as File | null,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Promo Terkini">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Tambah Promo Terkini</h1>
                    <p className="mt-2 text-sm text-slate-600">Urutan promo hanya 1 - 3.</p>
                    {orderFull && (
                        <p className="mt-1 text-sm text-rose-600">
                            Semua urutan promo sudah terpakai. Hapus promo lama atau ubah urutannya terlebih dahulu.
                        </p>
                    )}
                    <form
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/admin/public/promo-items', {
                                forceFormData: true,
                                onSuccess: () =>
                                    Swal.fire({ title: 'Berhasil', text: 'Promo ditambahkan.', icon: 'success' }),
                                onError: () =>
                                    Swal.fire({ title: 'Gagal', text: 'Promo gagal ditambahkan.', icon: 'error' }),
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
                            <Input
                                type="number"
                                min={1}
                                max={3}
                                value={form.data.sort_order}
                                onChange={(event) => form.setData('sort_order', Number(event.target.value))}
                            />
                            <InputError message={form.errors.sort_order} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Gambar promo</Label>
                            <Input type="file" accept="image/*" onChange={(event) => form.setData('image', event.target.files?.[0] ?? null)} />
                            <p className="text-xs text-slate-500">
                                Ukuran rekomendasi: Urutan 1-2 → 600 × 800 px (rasio 3:4), Urutan 3 → 1200 × 400 px (rasio 3:1).
                            </p>
                            <InputError message={form.errors.image} />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} />
                            Aktif
                        </label>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700" disabled={orderFull}>
                            Simpan
                        </Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
