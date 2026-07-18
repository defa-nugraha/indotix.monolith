import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/home' },
    { title: 'Halaman Home', href: '/admin/public/home' },
];

type HomeContentValues = Record<string, string>;

type Props = {
    content: {
        values: HomeContentValues;
        defaults: HomeContentValues;
        icon_options: Record<string, string>;
    };
};

type Field = {
    key: string;
    label: string;
    type?: 'text' | 'icon' | 'url';
    placeholder?: string;
};

const categoryFields: Field[] = Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;

    return [
        {
            key: `category_${number}_icon`,
            label: `Icon menu cepat ${number}`,
            type: 'icon' as const,
        },
        {
            key: `category_${number}_label`,
            label: `Label menu cepat ${number}`,
        },
    ];
}).flat();

const sections: { title: string; description: string; fields: Field[] }[] = [
    {
        title: 'Hero dan menu cepat',
        description:
            'Mengatur field pencarian dan menu kategori yang muncul di atas halaman home.',
        fields: [
            { key: 'search_placeholder', label: 'Placeholder pencarian' },
            { key: 'search_button_label', label: 'Teks tombol pencarian' },
            ...categoryFields,
        ],
    },
    {
        title: 'Kupon pengguna baru',
        description:
            'Mengatur judul, deskripsi, dan icon section voucher di home.',
        fields: [
            { key: 'coupon_icon', label: 'Icon section', type: 'icon' },
            { key: 'coupon_title', label: 'Judul section' },
            { key: 'coupon_description', label: 'Deskripsi section' },
        ],
    },
    {
        title: 'Promo Spesial Untukmu',
        description:
            'Mengatur video utama dan empat gambar promo yang tampil di section Promo Spesial pada halaman depan.',
        fields: [
            { key: 'special_promo_title', label: 'Judul section' },
            {
                key: 'special_promo_video_title',
                label: 'Judul video utama',
            },
            {
                key: 'special_promo_video_subtitle',
                label: 'Label kecil video utama',
            },
            {
                key: 'special_promo_video_url',
                label: 'URL video utama',
                type: 'url',
                placeholder: 'https://.../video.mp4 atau URL CDN video',
            },
            {
                key: 'special_promo_video_poster_url',
                label: 'URL poster video',
                type: 'url',
                placeholder: 'https://.../poster.jpg',
            },
            ...Array.from({ length: 4 }, (_, index) => {
                const number = index + 1;

                return [
                    {
                        key: `special_promo_card_${number}_title`,
                        label: `Judul gambar promo ${number}`,
                    },
                    {
                        key: `special_promo_card_${number}_subtitle`,
                        label: `Label kecil gambar promo ${number}`,
                    },
                    {
                        key: `special_promo_card_${number}_image_url`,
                        label: `URL gambar promo ${number}`,
                        type: 'url' as const,
                        placeholder: 'https://.../promo.jpg',
                    },
                    {
                        key: `special_promo_card_${number}_link_url`,
                        label: `Link tujuan gambar promo ${number}`,
                        type: 'url' as const,
                        placeholder: '/promo/nama-promo atau https://...',
                    },
                ];
            }).flat(),
        ],
    },
    {
        title: 'Promo terbaik',
        description:
            'Mengatur section banner promo yang tampil sebelum destinasi wisata.',
        fields: [
            { key: 'promo_icon', label: 'Icon section', type: 'icon' },
            { key: 'promo_title', label: 'Judul section' },
            { key: 'promo_link_label', label: 'Teks tombol lihat semua' },
        ],
    },
    {
        title: 'Destinasi wisata unggulan',
        description: 'Mengatur heading dan CTA section produk wisata utama.',
        fields: [
            { key: 'featured_title', label: 'Judul section' },
            { key: 'featured_description', label: 'Deskripsi section' },
            { key: 'featured_link_label', label: 'Teks tombol lihat semua' },
        ],
    },
    {
        title: 'Rekomendasi terdekat',
        description: 'Mengatur copy untuk section rekomendasi berbasis lokasi.',
        fields: [
            { key: 'nearby_icon', label: 'Icon eyebrow', type: 'icon' },
            { key: 'nearby_eyebrow', label: 'Label kecil' },
            { key: 'nearby_title', label: 'Judul section' },
            { key: 'nearby_description', label: 'Deskripsi section' },
            { key: 'nearby_button_default', label: 'Teks tombol default' },
            {
                key: 'nearby_button_active',
                label: 'Teks tombol setelah lokasi aktif',
            },
            { key: 'nearby_button_loading', label: 'Teks tombol loading' },
        ],
    },
    {
        title: 'Jelajah Indotix',
        description: 'Mengatur heading section artikel dan inspirasi wisata.',
        fields: [
            { key: 'blog_icon', label: 'Icon eyebrow', type: 'icon' },
            { key: 'blog_eyebrow', label: 'Label kecil' },
            { key: 'blog_title', label: 'Judul section' },
            { key: 'blog_description', label: 'Deskripsi section' },
            { key: 'blog_link_label', label: 'Teks tombol lihat semua' },
        ],
    },
    {
        title: 'CTA download dan keunggulan',
        description:
            'Mengatur section sebelum footer, badge, dan kartu manfaat.',
        fields: [
            { key: 'trust_eyebrow', label: 'Label kecil' },
            { key: 'trust_title', label: 'Judul section' },
            {
                key: 'trust_badge_1_icon',
                label: 'Icon badge pertama',
                type: 'icon',
            },
            { key: 'trust_badge_1_text', label: 'Teks badge pertama' },
            {
                key: 'trust_badge_2_icon',
                label: 'Icon badge kedua',
                type: 'icon',
            },
            { key: 'trust_badge_2_text', label: 'Teks badge kedua' },
            { key: 'trust_cta_label', label: 'Teks tombol download' },
            {
                key: 'trust_card_1_icon',
                label: 'Icon kartu pertama',
                type: 'icon',
            },
            { key: 'trust_card_1_title', label: 'Judul kartu pertama' },
            {
                key: 'trust_card_1_description',
                label: 'Deskripsi kartu pertama',
            },
            {
                key: 'trust_card_2_icon',
                label: 'Icon kartu kedua',
                type: 'icon',
            },
            { key: 'trust_card_2_title', label: 'Judul kartu kedua' },
            { key: 'trust_card_2_description', label: 'Deskripsi kartu kedua' },
            {
                key: 'trust_card_3_icon',
                label: 'Icon kartu ketiga',
                type: 'icon',
            },
            { key: 'trust_card_3_title', label: 'Judul kartu ketiga' },
            {
                key: 'trust_card_3_description',
                label: 'Deskripsi kartu ketiga',
            },
        ],
    },
];

export default function HomeContentEdit({ content }: Props) {
    const form = useForm<HomeContentValues>({ ...content.values });
    const iconOptions = Object.entries(content.icon_options);

    const resetToDefault = (key: string) => {
        form.setData(key, content.defaults[key] ?? '');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Halaman Home" />

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-sky-600 uppercase">
                            Konten Publik
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                            Kelola konten halaman home
                        </h1>
                        <p className="max-w-3xl text-sm text-slate-600">
                            Ubah teks dan icon section homepage tanpa deploy
                            ulang. Banner, voucher, promo gambar, produk wisata,
                            dan artikel tetap dikelola dari menu masing-masing.
                        </p>
                    </div>
                </section>

                <form
                    className="space-y-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.put('/admin/public/home', {
                            preserveScroll: true,
                            onSuccess: () =>
                                Swal.fire({
                                    title: 'Berhasil',
                                    text: 'Konten halaman home diperbarui.',
                                    icon: 'success',
                                }),
                            onError: () =>
                                Swal.fire({
                                    title: 'Gagal',
                                    text: 'Periksa kembali field konten home.',
                                    icon: 'error',
                                }),
                        });
                    }}
                >
                    {sections.map((section) => (
                        <section
                            key={section.title}
                            className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                        >
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {section.title}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {section.description}
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {section.fields.map((field) => (
                                    <div key={field.key} className="grid gap-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <Label htmlFor={field.key}>
                                                {field.label}
                                            </Label>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    resetToDefault(field.key)
                                                }
                                                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                                            >
                                                Reset
                                            </button>
                                        </div>

                                        {field.type === 'icon' ? (
                                            <select
                                                id={field.key}
                                                value={
                                                    form.data[field.key] ?? ''
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        field.key,
                                                        event.target.value,
                                                    )
                                                }
                                                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                                            >
                                                {iconOptions.map(
                                                    ([value, label]) => (
                                                        <option
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        ) : (
                                            <Input
                                                id={field.key}
                                                type="text"
                                                placeholder={field.placeholder}
                                                value={
                                                    form.data[field.key] ?? ''
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        field.key,
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        )}

                                        <InputError
                                            message={form.errors[field.key]}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}

                    <div className="sticky bottom-4 z-10 flex justify-end rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-lg backdrop-blur">
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-70"
                        >
                            {form.processing
                                ? 'Menyimpan...'
                                : 'Simpan Konten Home'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
