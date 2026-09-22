import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';

type HeroTextField =
    | 'eyebrow'
    | 'title'
    | 'highlight_title'
    | 'description'
    | 'cta_label'
    | 'cta_url';
type HeroFormData = Record<HeroTextField, string> & {
    media_type: string;
    media: File | null;
    poster: File | null;
    sort_order: number;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Mobile App', href: '/admin/mobile/home' },
    { title: 'Edit Hero', href: '#' },
];
const mobileCtaDestinations = [
    { value: '', label: 'Tanpa tujuan (banner tetap statis)' },
    { value: '/home', label: 'Beranda Mobile' },
    { value: '/wisata', label: 'Jelajah Wisata' },
    { value: '/promo', label: 'Promo Wisata' },
];

const textFields: Array<{ name: HeroTextField; label: string }> = [
    { name: 'eyebrow', label: 'Eyebrow' },
    { name: 'title', label: 'Headline' },
    { name: 'highlight_title', label: 'Highlight' },
    { name: 'description', label: 'Description' },
    { name: 'cta_label', label: 'CTA Label' },
];

export default function MobileHeroEdit({
    hero,
}: {
    hero: Record<string, any>;
}) {
    const form = useForm<HeroFormData>({
        eyebrow: hero.eyebrow ?? '',
        title: hero.title ?? '',
        highlight_title: hero.highlight_title ?? '',
        description: hero.description ?? '',
        cta_label: hero.cta_label ?? '',
        cta_url: hero.cta_url ?? '',
        media_type: hero.media_type ?? 'image',
        media: null,
        poster: null,
        sort_order: hero.sort_order ?? 0,
        starts_at: hero.starts_at ? String(hero.starts_at).slice(0, 16) : '',
        ends_at: hero.ends_at ? String(hero.ends_at).slice(0, 16) : '',
        is_active: hero.is_active !== false,
    });
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(`/admin/mobile/home/heroes/${hero.id}`, {
            method: 'put',
            forceFormData: true,
        });
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Hero Media" />
            <main className="min-h-full bg-[#f6fbff] p-6 font-['Plus_Jakarta_Sans'] text-slate-900">
                <form
                    className="grid max-w-3xl gap-4 rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                    onSubmit={submit}
                >
                    <h1 className="text-2xl font-semibold">Edit Hero Media</h1>
                    <p className="text-sm text-muted-foreground">
                        Perubahan ini hanya memengaruhi aplikasi Mobile Indotix.
                        Kosongkan media untuk mempertahankan file saat ini.
                    </p>
                    {textFields.map(({ name, label }) => (
                        <div className="grid gap-2" key={name}>
                            <Label>{label}</Label>
                            <Input
                                value={form.data[name]}
                                onChange={(event) =>
                                    form.setData(name, event.target.value)
                                }
                            />
                            <InputError message={form.errors[name]} />
                        </div>
                    ))}
                    <div className="grid gap-2">
                        <Label htmlFor="hero-cta-url">Tujuan CTA di Mobile</Label>
                        <select
                            id="hero-cta-url"
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            value={form.data.cta_url}
                            onChange={(event) => form.setData('cta_url', event.target.value)}
                        >
                            {mobileCtaDestinations.map((destination) => (
                                <option key={destination.value} value={destination.value}>
                                    {destination.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                            Jika CTA Label kosong, seluruh Hero akan membuka tujuan ini saat diketuk.
                        </p>
                        <InputError message={form.errors.cta_url} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Media Type</Label>
                        <select
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            value={form.data.media_type}
                            onChange={(event) =>
                                form.setData('media_type', event.target.value)
                            }
                        >
                            <option value="image">Image</option>
                            <option value="gif">GIF</option>
                            <option value="video">Video</option>
                        </select>
                        <InputError message={form.errors.media_type} />
                    </div>
                    <div className="grid gap-2">
                        {hero.media_type === 'video' ? (
                            <video
                                controls
                                src={hero.media_url}
                                poster={hero.poster_url ?? undefined}
                                className="aspect-video w-full rounded-lg object-cover"
                            />
                        ) : (
                            <img
                                src={hero.media_url}
                                alt={hero.title}
                                className="aspect-video w-full rounded-lg object-cover"
                            />
                        )}
                        <Label htmlFor="hero-media">Media Hero</Label>
                        <Input
                            id="hero-media"
                            type="file"
                            accept={
                                form.data.media_type === 'video'
                                    ? 'video/mp4,video/webm'
                                    : form.data.media_type === 'gif'
                                      ? 'image/gif'
                                      : 'image/jpeg,image/png,image/webp'
                            }
                            onChange={(event) =>
                                form.setData(
                                    'media',
                                    event.target.files?.[0] ?? null,
                                )
                            }
                        />
                        <InputError message={form.errors.media} />
                        <p className="text-xs text-muted-foreground">
                            Rekomendasi media Mobile: 1080 x 1200–1220 px. Media
                            menggunakan cover pada area Hero responsif.
                        </p>
                    </div>
                    {form.data.media_type === 'video' && (
                        <div className="grid gap-2">
                            <Label htmlFor="hero-poster">
                                Poster / Fallback
                            </Label>
                            <Input
                                id="hero-poster"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) =>
                                    form.setData(
                                        'poster',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            <InputError message={form.errors.poster} />
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                        <Label htmlFor="hero-sort-order">Urutan</Label>
                        <Input
                            id="hero-sort-order"
                            type="number"
                            value={form.data.sort_order}
                            onChange={(event) =>
                                form.setData(
                                    'sort_order',
                                    Number(event.target.value),
                                )
                            }
                        />
                        <Label htmlFor="hero-starts-at">Mulai tayang</Label>
                        <Input
                            id="hero-starts-at"
                            type="datetime-local"
                            value={form.data.starts_at}
                            onChange={(event) =>
                                form.setData('starts_at', event.target.value)
                            }
                        />
                        <Label htmlFor="hero-ends-at">Selesai tayang</Label>
                        <Input
                            id="hero-ends-at"
                            type="datetime-local"
                            value={form.data.ends_at}
                            onChange={(event) =>
                                form.setData('ends_at', event.target.value)
                            }
                        />
                    </div>
                    <label className="flex gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) =>
                                form.setData('is_active', event.target.checked)
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
