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

const maxVideoBytes = 100 * 1024 * 1024;
const maxVideoSizeLabel = '100 MB';

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

    const validateVideoFile = (
        file: File | null,
        field: 'video' | 'secondary_video',
        expected: { width: number; height: number },
        input?: HTMLInputElement | null,
    ) => {
        if (!file) {
            form.setData(field, null);
            form.clearErrors(field);
            return;
        }

        if (file.size > maxVideoBytes) {
            form.setError(field, `Ukuran video maksimal ${maxVideoSizeLabel}.`);
            form.setData(field, null);
            if (input) {
                input.value = '';
            }
            Swal.fire({
                icon: 'error',
                title: 'Video terlalu besar',
                text: `Ukuran video maksimal ${maxVideoSizeLabel}.`,
            });
            return;
        }

        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            if (video.videoWidth !== expected.width || video.videoHeight !== expected.height) {
                form.setError(field, `Ukuran video harus ${expected.width} x ${expected.height} px.`);
                form.setData(field, null);
                if (input) {
                    input.value = '';
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Ukuran video tidak sesuai',
                    text: `Video harus ${expected.width} x ${expected.height} px.`,
                });
                return;
            }
            form.clearErrors(field);
            form.setData(field, file);
        };
        video.onerror = () => {
            URL.revokeObjectURL(url);
            form.setError(field, 'Video tidak dapat dibaca.');
            form.setData(field, null);
            if (input) {
                input.value = '';
            }
        };
        video.src = url;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Promo Video">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-sans text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Tambah Promo Video</h1>
                    <form
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/admin/public/promo-videos', {
                                forceFormData: true,
                                onSuccess: () =>
                                    Swal.fire({
                                        title: 'Berhasil',
                                        text: 'Promo video ditambahkan. Jika ukuran file besar, kompresi berjalan di background.',
                                        icon: 'success',
                                    }),
                                onError: () =>
                                    Swal.fire({ title: 'Gagal', text: 'Promo video gagal ditambahkan.', icon: 'error' }),
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label required>Judul</Label>
                            <Input required value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} />
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
                            <Label required>Video Utama (besar)</Label>
                            <Input
                                required
                                type="file"
                                accept="video/*"
                                onChange={(event) =>
                                    validateVideoFile(event.target.files?.[0] ?? null, 'video', { width: 1280, height: 720 }, event.currentTarget)
                                }
                            />
                            <p className="text-xs text-slate-500">Ukuran rekomendasi: 1280 × 720 px (16:9), maksimal {maxVideoSizeLabel}.</p>
                            <InputError message={form.errors.video} />
                        </div>
                        <div className="grid gap-2">
                            <Label required>Video Bawah</Label>
                            <Input
                                required
                                type="file"
                                accept="video/*"
                                onChange={(event) =>
                                    validateVideoFile(event.target.files?.[0] ?? null, 'secondary_video', { width: 1280, height: 720 }, event.currentTarget)
                                }
                            />
                            <p className="text-xs text-slate-500">Ukuran rekomendasi: 1280 × 720 px (16:9), maksimal {maxVideoSizeLabel}.</p>
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
