import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import Swal from 'sweetalert2';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/banners' },
    { title: 'Banner', href: '/admin/public/banners' },
    { title: 'Tambah', href: '/admin/public/banners/create' },
];

export default function BannerCreate() {
    const form = useForm({
        title: '',
        link_url: '',
        sort_order: 0,
        is_active: true,
        image: null as File | null,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Banner">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Tambah Banner
                    </h1>
                    <form
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/admin/public/banners', {
                                forceFormData: true,
                                onSuccess: () =>
                                    Swal.fire({
                                        title: 'Berhasil',
                                        text: 'Banner ditambahkan.',
                                        icon: 'success',
                                    }),
                                onError: () =>
                                    Swal.fire({
                                        title: 'Gagal',
                                        text: 'Banner gagal ditambahkan.',
                                        icon: 'error',
                                    }),
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label>Judul</Label>
                            <Input
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                            />
                            <InputError message={form.errors.title} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Link</Label>
                            <Input
                                value={form.data.link_url}
                                onChange={(event) =>
                                    form.setData('link_url', event.target.value)
                                }
                            />
                            <InputError message={form.errors.link_url} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Urutan</Label>
                            <Input
                                type="number"
                                value={form.data.sort_order}
                                onChange={(event) =>
                                    form.setData(
                                        'sort_order',
                                        Number(event.target.value),
                                    )
                                }
                            />
                            <InputError message={form.errors.sort_order} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Banner (gambar)</Label>
                            <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                disabled={form.processing}
                                onChange={(event) =>
                                    form.setData(
                                        'image',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            <p className="text-xs text-slate-500">
                                Gunakan JPG, PNG, atau WebP berukuran tepat 1200
                                × 450 px, maksimal 5 MB.
                            </p>
                            <InputError message={form.errors.image} />
                        </div>
                        <div className="flex gap-2">
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(event) =>
                                        form.setData(
                                            'is_active',
                                            event.target.checked,
                                        )
                                    }
                                />
                                Aktif
                            </label>
                        </div>
                        <p className="text-xs text-slate-500">
                            Banner aktif akan masuk ke carousel halaman depan
                            sesuai urutan yang diatur.
                        </p>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                            Simpan
                        </Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
