import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    BadgePercent,
    Backpack,
    BaggageClaim,
    Bell,
    Bike,
    Binoculars,
    BookOpen,
    Bus,
    CableCar,
    Camera,
    Car,
    Check,
    ChevronDown,
    Clapperboard,
    Compass,
    Droplets,
    FerrisWheel,
    Gift,
    GraduationCap,
    Home as HomeIcon,
    Image as ImageIcon,
    Landmark,
    LayoutGrid,
    Link2,
    MapPin,
    Mountain,
    Navigation,
    Plane,
    RefreshCcw,
    Sailboat,
    ShieldCheck,
    Ship,
    ShipWheel,
    Sparkles,
    Sprout,
    Sun,
    Sunrise,
    Sunset,
    Tent,
    TentTree,
    Ticket,
    Train,
    TreePalm,
    TreePine,
    Trees,
    Umbrella,
    Utensils,
    Volleyball,
    Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/home' },
    { title: 'Halaman Home', href: '/admin/public/home' },
];

type HomeContentValues = Record<string, string>;
type HomeContentFormData = Record<string, string | File | null>;

type Props = {
    content: {
        values: HomeContentValues;
        defaults: HomeContentValues;
        icon_options: Record<string, string>;
        image_upload_fields: Record<string, string>;
        video_upload_fields: Record<string, string>;
    };
};

type Field = {
    key: string;
    label: string;
    type?: 'text' | 'icon' | 'url' | 'image' | 'video';
    placeholder?: string;
    hint?: string;
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
        title: 'Kategori wisata',
        description:
            'Mengatur menu kategori wisata yang muncul di bawah banner halaman home.',
        fields: [...categoryFields],
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
                label: 'Video utama',
                type: 'video',
                hint: 'Format MP4, WebM, atau OGG. Maksimal 100 MB.',
            },
            {
                key: 'special_promo_video_poster_url',
                label: 'Poster video',
                type: 'image',
                hint: 'Format JPG, PNG, atau WebP. Maksimal 5 MB.',
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
                        label: `Gambar promo ${number}`,
                        type: 'image' as const,
                        hint: 'Format JPG, PNG, atau WebP. Maksimal 5 MB.',
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
        title: 'Keunggulan publik',
        description:
            'Mengatur section Kenapa pesan di Indotix yang tampil di halaman destinasi, promo, jelajah, dan tentang.',
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

const adminHomeIconMap = {
    BadgePercent,
    Gift,
    Navigation,
    BookOpen,
    ShieldCheck,
    Ticket,
    Bell,
    RefreshCcw,
    MapPin,
    Sparkles,
    Mountain,
    Landmark,
    GraduationCap,
    Utensils,
    HomeIcon,
    Waves,
    Trees,
    Droplets,
    Compass,
    Backpack,
    BaggageClaim,
    Bike,
    Binoculars,
    Bus,
    CableCar,
    Camera,
    Car,
    FerrisWheel,
    Plane,
    Sailboat,
    Ship,
    ShipWheel,
    Sprout,
    Sun,
    Sunrise,
    Sunset,
    Tent,
    TentTree,
    Train,
    TreePalm,
    TreePine,
    Umbrella,
    Volleyball,
} satisfies Record<string, LucideIcon>;

const resolveAdminHomeIcon = (value: string | undefined | null) =>
    adminHomeIconMap[value as keyof typeof adminHomeIconMap] ?? Sparkles;

export default function HomeContentEdit({ content }: Props) {
    const imageUploadDefaults = Object.fromEntries(
        Object.values(content.image_upload_fields).map((fileKey) => [
            fileKey,
            null,
        ]),
    ) as Record<string, null>;
    const videoUploadDefaults = Object.fromEntries(
        Object.values(content.video_upload_fields).map((fileKey) => [
            fileKey,
            null,
        ]),
    ) as Record<string, null>;
    const form = useForm<HomeContentFormData>({
        _method: 'put',
        ...content.values,
        ...imageUploadDefaults,
        ...videoUploadDefaults,
    });
    const [activeIconField, setActiveIconField] = useState<string | null>(null);
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    const [fileInputVersion, setFileInputVersion] = useState(0);
    const iconOptions = useMemo(
        () => Object.entries(content.icon_options),
        [content.icon_options],
    );
    const fieldsByKey = useMemo(
        () =>
            new Map(
                sections
                    .flatMap((section) => section.fields)
                    .map((field) => [field.key, field]),
            ),
        [],
    );
    const activeSection = sections[activeSectionIndex] ?? sections[0];
    const activeIconFieldLabel =
        fieldsByKey.get(activeIconField ?? '')?.label ?? 'Icon';

    const fieldValue = (key: string) => {
        const value = form.data[key];

        return typeof value === 'string' ? value : '';
    };

    const resetToDefault = (key: string) => {
        form.setData(key, content.defaults[key] ?? '');

        const fileKey = content.image_upload_fields[key];
        const videoFileKey = content.video_upload_fields[key];
        if (fileKey || videoFileKey) {
            form.setData(fileKey ?? videoFileKey, null);
            setFileInputVersion((version) => version + 1);
        }
    };

    const renderField = (
        field: Field,
        className = 'grid gap-2',
        previewClassName = 'h-32 w-full rounded-xl object-cover md:max-w-lg',
    ) => {
        const imageFileKey = content.image_upload_fields[field.key];
        const videoFileKey = content.video_upload_fields[field.key];
        const uploadFileKey = imageFileKey ?? videoFileKey;
        const selectedFile =
            uploadFileKey && form.data[uploadFileKey] instanceof File
                ? (form.data[uploadFileKey] as File)
                : null;
        const uploadError = uploadFileKey ? form.errors[uploadFileKey] : undefined;
        const isImageUpload = field.type === 'image' && imageFileKey;
        const isVideoUpload = field.type === 'video' && videoFileKey;
        const inputId = isImageUpload
            ? imageFileKey
            : isVideoUpload
              ? videoFileKey
              : field.key;

        return (
            <div key={field.key} className={className}>
                <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={inputId}>{field.label}</Label>
                    <button
                        type="button"
                        onClick={() => resetToDefault(field.key)}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                    >
                        Reset
                    </button>
                </div>

                {field.type === 'icon' ? (
                    <button
                        type="button"
                        id={field.key}
                        onClick={() => setActiveIconField(field.key)}
                        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm shadow-xs transition hover:border-sky-300 hover:bg-sky-50/60 focus-visible:ring-[3px] focus-visible:ring-sky-500/20 focus-visible:outline-none"
                    >
                        <span className="flex min-w-0 items-center gap-3">
                            {(() => {
                                const value = fieldValue(field.key);
                                const Icon = resolveAdminHomeIcon(value);
                                const label =
                                    content.icon_options[value] ?? 'Pilih icon';

                                return (
                                    <>
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <span className="truncate font-medium text-slate-800">
                                            {label}
                                        </span>
                                    </>
                                );
                            })()}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                ) : isImageUpload ? (
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                        {fieldValue(field.key) ? (
                            <img
                                src={fieldValue(field.key)}
                                alt={field.label}
                                className={previewClassName}
                            />
                        ) : (
                            <div className="flex h-32 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                                Belum ada gambar
                            </div>
                        )}

                        <Input
                            key={`${imageFileKey}-${fileInputVersion}`}
                            id={imageFileKey}
                            aria-label={field.label}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) =>
                                form.setData(
                                    imageFileKey,
                                    event.target.files?.[0] ?? null,
                                )
                            }
                            disabled={form.processing}
                        />
                        <div className="space-y-1 text-xs text-slate-500">
                            {field.hint && <p>{field.hint}</p>}
                            {selectedFile && (
                                <p className="font-medium text-sky-700">
                                    File dipilih: {selectedFile.name}
                                </p>
                            )}
                        </div>
                    </div>
                ) : isVideoUpload ? (
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                        {fieldValue(field.key) ? (
                            <video
                                src={fieldValue(field.key)}
                                className="aspect-video w-full rounded-xl bg-slate-950 object-cover"
                                controls
                                preload="metadata"
                            />
                        ) : (
                            <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                                Belum ada video
                            </div>
                        )}

                        <Input
                            key={`${videoFileKey}-${fileInputVersion}`}
                            id={videoFileKey}
                            aria-label={field.label}
                            type="file"
                            accept="video/mp4,video/webm,video/ogg"
                            onChange={(event) =>
                                form.setData(
                                    videoFileKey,
                                    event.target.files?.[0] ?? null,
                                )
                            }
                            disabled={form.processing}
                        />
                        <div className="space-y-1 text-xs text-slate-500">
                            {field.hint && <p>{field.hint}</p>}
                            {selectedFile && (
                                <p className="font-medium text-sky-700">
                                    File dipilih: {selectedFile.name}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <Input
                        id={field.key}
                        aria-label={field.label}
                        type="text"
                        placeholder={field.placeholder}
                        value={fieldValue(field.key)}
                        onChange={(event) =>
                            form.setData(field.key, event.target.value)
                        }
                        disabled={form.processing}
                    />
                )}

                <InputError message={uploadError ?? form.errors[field.key]} />
            </div>
        );
    };

    const renderFieldByKey = (
        key: string,
        className?: string,
        previewClassName?: string,
    ) => {
        const field = fieldsByKey.get(key);

        return field ? renderField(field, className, previewClassName) : null;
    };

    const renderPromoSpecialSection = () => (
        <div className="space-y-6">
            <div className="rounded-3xl border border-sky-100 bg-sky-50/60 p-5">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                            <Clapperboard className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-sky-700 uppercase">
                                Langkah 1
                            </p>
                            <h3 className="text-base font-semibold text-slate-950">
                                Atur video utama
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-slate-600">
                                Video utama tampil paling besar di section Promo
                                Spesial. Isi judul singkat, upload video, lalu
                                tambahkan poster agar tampil rapi sebelum video
                                diputar.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
                    <div className="space-y-4">
                        {renderFieldByKey('special_promo_title')}
                        <div className="grid gap-4 md:grid-cols-2">
                            {renderFieldByKey('special_promo_video_title')}
                            {renderFieldByKey('special_promo_video_subtitle')}
                        </div>
                        {renderFieldByKey('special_promo_video_url')}
                    </div>
                    {renderFieldByKey(
                        'special_promo_video_poster_url',
                        'grid gap-2',
                        'aspect-video w-full rounded-xl object-cover',
                    )}
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                            <LayoutGrid className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                Langkah 2
                            </p>
                            <h3 className="text-base font-semibold text-slate-950">
                                Atur empat kartu promo
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-slate-600">
                                Setiap kartu berisi gambar, judul, label kecil,
                                dan link tujuan. Gunakan link internal seperti
                                /promo/nama-promo bila promo tersedia di
                                Indotix.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    {Array.from({ length: 4 }, (_, index) => {
                        const number = index + 1;

                        return (
                            <section
                                key={number}
                                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                            >
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Kartu promo {number}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Posisi {number} di kolase promo.
                                        </p>
                                    </div>
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-700 shadow-xs">
                                        <ImageIcon className="h-4 w-4" />
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {renderFieldByKey(
                                        `special_promo_card_${number}_image_url`,
                                        'grid gap-2',
                                        'h-44 w-full rounded-xl object-cover',
                                    )}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {renderFieldByKey(
                                            `special_promo_card_${number}_title`,
                                        )}
                                        {renderFieldByKey(
                                            `special_promo_card_${number}_subtitle`,
                                        )}
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                            <Link2 className="h-4 w-4 text-sky-600" />
                                            Link tujuan
                                        </div>
                                        {renderFieldByKey(
                                            `special_promo_card_${number}_link_url`,
                                        )}
                                    </div>
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );

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
                            ulang. Promo Spesial dikelola dari tab halaman ini,
                            sementara banner, partner, produk wisata, dan
                            artikel tetap dikelola dari menu masing-masing.
                        </p>
                    </div>
                </section>

                <form
                    className="space-y-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/admin/public/home', {
                            preserveScroll: true,
                            forceFormData: true,
                            onSuccess: () =>
                                Swal.fire({
                                    title: 'Berhasil',
                                    text: 'Konten halaman home diperbarui.',
                                    icon: 'success',
                                }),
                            onError: () =>
                                Swal.fire({
                                    title: 'Gagal',
                                    text: 'Periksa kembali field konten home dan format gambar yang dipilih.',
                                    icon: 'error',
                                }),
                        });
                    }}
                >
                    <section className="overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 shadow-sm">
                        <div
                            className="flex gap-2 overflow-x-auto border-b border-slate-100 p-3"
                            role="tablist"
                            aria-label="Section konten halaman home"
                        >
                            {sections.map((section, index) => {
                                const active = index === activeSectionIndex;

                                return (
                                    <button
                                        key={section.title}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() =>
                                            setActiveSectionIndex(index)
                                        }
                                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                                            active
                                                ? 'bg-sky-600 text-white shadow-sm'
                                                : 'bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                                        }`}
                                    >
                                        {section.title}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-6">
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {activeSection.title}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {activeSection.description}
                                </p>
                            </div>

                            {activeSection.title === 'Promo Spesial Untukmu' ? (
                                renderPromoSpecialSection()
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {activeSection.fields.map((field) =>
                                        renderField(field),
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

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

                <Dialog
                    open={Boolean(activeIconField)}
                    onOpenChange={(open) => {
                        if (!open) {
                            setActiveIconField(null);
                        }
                    }}
                >
                    <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Pilih icon kategori</DialogTitle>
                            <DialogDescription>
                                Pilih icon yang paling sesuai untuk{' '}
                                {activeIconFieldLabel.toLowerCase()}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid max-h-[62vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                            {iconOptions.map(([value, label]) => {
                                const Icon = resolveAdminHomeIcon(value);
                                const selected =
                                    activeIconField !== null &&
                                    form.data[activeIconField] === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => {
                                            if (activeIconField) {
                                                form.setData(
                                                    activeIconField,
                                                    value,
                                                );
                                            }
                                            setActiveIconField(null);
                                        }}
                                        className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ${
                                            selected
                                                ? 'border-sky-400 bg-sky-50 text-sky-800 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/60'
                                        }`}
                                    >
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                                    selected
                                                        ? 'bg-sky-600 text-white'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-semibold">
                                                    {label}
                                                </span>
                                                <span className="block truncate text-xs text-slate-500">
                                                    {value}
                                                </span>
                                            </span>
                                        </span>
                                        {selected && (
                                            <Check className="h-4 w-4 shrink-0 text-sky-600" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
