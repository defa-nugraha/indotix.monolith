import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Mobile App', href: '/admin/mobile/home' },
    { title: 'Tambah Hero', href: '/admin/mobile/home/heroes/create' },
];
export default function MobileHeroCreate() {
    const form = useForm({
        eyebrow: 'Ayo berangkat',
        title: '',
        highlight_title: '',
        description: '',
        cta_label: 'Mulai Jelajah',
        cta_url: '/wisata',
        media_type: 'image',
        media: null as File | null,
        poster: null as File | null,
        sort_order: 0,
        starts_at: '',
        ends_at: '',
        is_active: true,
    });
    return (
        <HeroForm
            title="Tambah Hero Media"
            form={form}
            action="/admin/mobile/home/heroes"
        />
    );
}
function HeroForm({
    title,
    form,
    action,
}: {
    title: string;
    form: any;
    action: string;
}) {
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(action, { forceFormData: true });
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <main className="min-h-full bg-[#f6fbff] p-6 font-['Plus_Jakarta_Sans'] text-slate-900">
                <form
                    onSubmit={submit}
                    className="grid max-w-3xl gap-4 rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                >
                    <h1 className="text-2xl font-semibold">{title}</h1>
                    <p className="text-sm text-muted-foreground">
                        Asset ini hanya digunakan pada aplikasi Mobile Indotix.
                        Media akan di-crop menggunakan cover pada Hero
                        responsive.
                    </p>
                    <TextField form={form} name="eyebrow" label="Eyebrow" />
                    <TextField
                        form={form}
                        name="title"
                        label="Headline"
                        required
                    />
                    <TextField
                        form={form}
                        name="highlight_title"
                        label="Highlight"
                    />
                    <TextField
                        form={form}
                        name="description"
                        label="Description"
                    />
                    <TextField form={form} name="cta_label" label="CTA Label" />
                    <TextField form={form} name="cta_url" label="CTA URL" />
                    <div className="grid gap-2">
                        <Label>Media Type</Label>
                        <select
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            value={form.data.media_type}
                            onChange={(e) =>
                                form.setData('media_type', e.target.value)
                            }
                        >
                            <option value="image">Image</option>
                            <option value="gif">GIF</option>
                            <option value="video">Video</option>
                        </select>
                        <InputError message={form.errors.media_type} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Media Upload</Label>
                        <Input
                            required
                            type="file"
                            accept={
                                form.data.media_type === 'video'
                                    ? 'video/mp4,video/webm'
                                    : form.data.media_type === 'gif'
                                      ? 'image/gif'
                                      : 'image/jpeg,image/png,image/webp'
                            }
                            onChange={(e) =>
                                form.setData(
                                    'media',
                                    e.target.files?.[0] ?? null,
                                )
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Video portrait MP4/WebM, rekomendasi 1080 x 1920 dan
                            5–15 detik. GIF/Image gunakan komposisi portrait
                            mobile.
                        </p>
                        <InputError message={form.errors.media} />
                    </div>
                    {form.data.media_type === 'video' && (
                        <div className="grid gap-2">
                            <Label>Poster / Fallback</Label>
                            <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) =>
                                    form.setData(
                                        'poster',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            <InputError message={form.errors.poster} />
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                        <TextField
                            form={form}
                            name="sort_order"
                            label="Urutan"
                            type="number"
                        />
                        <TextField
                            form={form}
                            name="starts_at"
                            label="Mulai"
                            type="datetime-local"
                        />
                        <TextField
                            form={form}
                            name="ends_at"
                            label="Selesai"
                            type="datetime-local"
                        />
                    </div>
                    <label className="flex gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(e) =>
                                form.setData('is_active', e.target.checked)
                            }
                        />{' '}
                        Aktif
                    </label>
                    <Button
                        type="submit"
                        className="bg-sky-600 text-white hover:bg-sky-700"
                        disabled={form.processing}
                    >
                        Simpan Hero
                    </Button>
                </form>
            </main>
        </AppLayout>
    );
}
function TextField({
    form,
    name,
    label,
    type = 'text',
    required = false,
}: {
    form: any;
    name: string;
    label: string;
    type?: string;
    required?: boolean;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <Input
                required={required}
                type={type}
                value={form.data[name]}
                onChange={(e) =>
                    form.setData(
                        name,
                        type === 'number'
                            ? Number(e.target.value)
                            : e.target.value,
                    )
                }
            />
            <InputError message={form.errors[name]} />
        </div>
    );
}
