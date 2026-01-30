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
    { title: 'Konten Publik', href: '/admin/public/promo-videos' },
    { title: 'Promo Video', href: '/admin/public/promo-videos' },
    { title: 'Tambah', href: '/admin/public/promo-videos/create' },
];

export default function PromoVideoCreate() {
    const form = useForm({
        title: '',
        description: '',
        cta_label: '',
        cta_url: '',
        is_active: true,
        video: null as File | null,
        secondary_video: null as File | null,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Promo Video">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Tambah Promo Video</h1>
                    <form
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/admin/public/promo-videos', {
                                forceFormData: true,
                                onSuccess: () =>
                                    Swal.fire({ title: 'Berhasil', text: 'Promo video ditambahkan.', icon: 'success' }),
                                onError: () =>
                                    Swal.fire({ title: 'Gagal', text: 'Promo video gagal ditambahkan.', icon: 'error' }),
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label>Judul</Label>
                            <Input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} />
                            <InputError message={form.errors.title} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Deskripsi</Label>
                            <Input value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} />
                            <InputError message={form.errors.description} />
                        </div>
                        <div className="grid gap-2">
                            <Label>CTA Label</Label>
                            <Input value={form.data.cta_label} onChange={(event) => form.setData('cta_label', event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>CTA URL</Label>
                            <Input value={form.data.cta_url} onChange={(event) => form.setData('cta_url', event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Video Utama (besar)</Label>
                            <Input type="file" accept="video/*" onChange={(event) => form.setData('video', event.target.files?.[0] ?? null)} />
                            <InputError message={form.errors.video} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Video Bawah (kecil)</Label>
                            <Input type="file" accept="video/*" onChange={(event) => form.setData('secondary_video', event.target.files?.[0] ?? null)} />
                            <InputError message={form.errors.secondary_video} />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} />
                            Aktif
                        </label>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">Simpan</Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
