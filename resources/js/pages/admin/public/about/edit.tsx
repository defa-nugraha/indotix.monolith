import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import CkeditorField from '@/components/ckeditor-field';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/about' },
    { title: 'Tentang Kami', href: '/admin/public/about' },
];

type AboutPage = {
    id: number;
    title: string;
    content: string;
    is_active: boolean;
};

export default function AboutEdit({ about }: { about: AboutPage }) {
    const form = useForm({
        title: about.title ?? 'Tentang Indotix',
        content: about.content ?? '',
        is_active: about.is_active ?? true,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tentang Kami">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Tentang Kami</h1>
                    <p className="mt-2 text-sm text-slate-600">Kelola konten Tentang Kami yang tampil di halaman publik.</p>
                    <form
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put('/admin/public/about', {
                                onSuccess: () =>
                                    Swal.fire({
                                        title: 'Berhasil',
                                        text: 'Konten Tentang Kami diperbarui.',
                                        icon: 'success',
                                    }),
                                onError: () =>
                                    Swal.fire({
                                        title: 'Gagal',
                                        text: 'Konten Tentang Kami gagal diperbarui.',
                                        icon: 'error',
                                    }),
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label required>Judul</Label>
                            <Input required value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} />
                            <InputError message={form.errors.title} />
                        </div>
                        <div className="grid gap-2">
                            <Label required>Konten</Label>
                            <CkeditorField
                                value={form.data.content}
                                onChange={(value) => form.setData('content', value)}
                                minHeightClassName="min-h-[320px]"
                            />
                            <InputError message={form.errors.content} />
                        </div>
                        <div className="flex gap-2">
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(event) => form.setData('is_active', event.target.checked)}
                                />
                                Aktif
                            </label>
                        </div>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">Simpan</Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
