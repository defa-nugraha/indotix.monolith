import { Head, router, useForm } from '@inertiajs/react';
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
    Globe,
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
    Smartphone,
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
    Award,
    Users,
    Volleyball,
    Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/home' },
    { title: 'Halaman Home', href: '/admin/public/home' },
];

type HomeContentValues = Record<string, string>;
type HomeContentFormData = Record<string, string | File | null>;
type VoucherOption = {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_transaction: number;
    quota_total: number;
    quota_used: number;
    remaining_quota?: number | null;
    starts_at?: string | null;
    ends_at?: string | null;
    is_active: boolean;
    select_url: string;
};
type PartOfLogo = {
    id: number;
    link_url?: string | null;
    name: string | null;
    image_path: string;
    image_url: string | null;
    sort_order: number;
    is_active: boolean;
};

type Props = {
    content: {
        values: HomeContentValues;
        defaults: HomeContentValues;
        icon_options: Record<string, string>;
        image_upload_fields: Record<string, string>;
        video_upload_fields: Record<string, string>;
    };
    partOfLogos?: PartOfLogo[];
    voucherOptions?: VoucherOption[];
};

type Field = {
    key: string;
    label: string;
    type?: 'text' | 'icon' | 'url' | 'image' | 'video' | 'media';
    placeholder?: string;
    hint?: string;
};

const isVideoMediaUrl = (url: string) =>
    /^data:video\//i.test(url) || /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(url);

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
        title: 'Banner Mobile Apps',
        description:
            'Mengatur banner khusus yang tampil di halaman home aplikasi mobile.',
        fields: [
            {
                key: 'mobile_top_banner_title',
                label: 'Judul banner atas',
                hint: 'Maksimal 255 karakter. Gunakan kalimat singkat agar layout mobile tetap rapi.',
            },
            {
                key: 'mobile_top_banner_subtitle',
                label: 'Deskripsi banner atas',
                hint: 'Maksimal 255 karakter.',
            },
            {
                key: 'mobile_top_banner_cta_label',
                label: 'Teks tombol banner atas',
            },
            {
                key: 'mobile_top_banner_media_url',
                label: 'Media banner atas',
                type: 'media',
                hint: 'Format JPG, PNG, WebP, GIF, MP4, WebM, atau OGG. Maksimal 100 MB.',
            },
            {
                key: 'mobile_top_banner_link_url',
                label: 'Link tujuan banner atas',
                type: 'url',
                placeholder: '/wisata',
            },
            {
                key: 'mobile_promo_banner_title',
                label: 'Judul banner promo',
                hint: 'Maksimal 255 karakter.',
            },
            {
                key: 'mobile_promo_banner_subtitle',
                label: 'Teks kecil banner promo',
            },
            {
                key: 'mobile_promo_banner_highlight',
                label: 'Teks highlight promo',
                placeholder: '30%',
            },
            {
                key: 'mobile_promo_banner_cta_label',
                label: 'Teks tombol banner promo',
            },
            {
                key: 'mobile_promo_banner_media_url',
                label: 'Media banner promo',
                type: 'media',
                hint: 'Format JPG, PNG, WebP, GIF, MP4, WebM, atau OGG. Maksimal 100 MB.',
            },
            {
                key: 'mobile_promo_banner_link_url',
                label: 'Link tujuan banner promo',
                type: 'url',
                placeholder: '/promo',
            },
        ],
    },
    {
        title: 'Kategori wisata',
        description:
            'Mengatur menu kategori wisata yang muncul di bawah banner halaman home.',
        fields: [...categoryFields],
    },
    {
        title: 'Promo Spesial Untukmu',
        description:
            'Mengatur video utama dan tiga gambar promo yang tampil di section Promo Spesial pada halaman depan.',
        fields: [
            { key: 'special_promo_title', label: 'Judul section' },
            {
                key: 'special_promo_video_title',
                label: 'Judul video (opsional)',
            },
            {
                key: 'special_promo_video_subtitle',
                label: 'Label kecil video (opsional)',
            },
            {
                key: 'special_promo_video_url',
                label: 'Video utama',
                type: 'video',
                hint: 'Format MP4, WebM, atau OGG. Maksimal 100 MB.',
            },
            {
                key: 'special_promo_video_poster_url',
                label: 'Poster / preview video',
                type: 'media',
                hint: 'Format JPG, PNG, WebP, GIF, MP4, WebM, atau OGG. Maksimal 100 MB.',
            },
            {
                key: 'special_promo_video_2_title',
                label: 'Judul video kedua (opsional)',
            },
            {
                key: 'special_promo_video_2_subtitle',
                label: 'Label kecil video kedua (opsional)',
            },
            {
                key: 'special_promo_video_2_url',
                label: 'Video kedua',
                type: 'video',
                hint: 'Format MP4, WebM, atau OGG. Maksimal 100 MB.',
            },
            {
                key: 'special_promo_video_2_poster_url',
                label: 'Poster / preview video kedua',
                type: 'media',
                hint: 'Format JPG, PNG, WebP, GIF, MP4, WebM, atau OGG. Maksimal 100 MB.',
            },
            ...Array.from({ length: 3 }, (_, index) => {
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
                        label: `Voucher tujuan gambar promo ${number}`,
                        type: 'url' as const,
                        placeholder: 'Pilih voucher yang akan digunakan',
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
    {
        title: 'Part of',
        description:
            'Mengatur section Part of yang tampil setelah Partner Kami di halaman beranda. Logo diatur khusus dari tab ini dan berjalan otomatis secara infinity loop.',
        fields: [
            { key: 'part_of_eyebrow', label: 'Label kecil' },
            { key: 'part_of_title', label: 'Judul section' },
            { key: 'part_of_description', label: 'Deskripsi section' },
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
    Smartphone,
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
    Users,
    Globe,
    Award,
} satisfies Record<string, LucideIcon>;

const resolveAdminHomeIcon = (value: string | undefined | null) =>
    adminHomeIconMap[value as keyof typeof adminHomeIconMap] ?? Sparkles;

export default function HomeContentEdit({
    content,
    partOfLogos = [],
    voucherOptions = [],
}: Props) {
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
    const [activeVoucherField, setActiveVoucherField] = useState<string | null>(
        null,
    );
    const [logoModalOpen, setLogoModalOpen] = useState(false);
    const [editingLogo, setEditingLogo] = useState<PartOfLogo | null>(null);
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    const [fileInputVersion, setFileInputVersion] = useState(0);
    const partOfLogoForm = useForm({
        name: '',
        link_url: '',
        sort_order: 0,
        is_active: true,
        image: null as File | null,
    });
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
    const activeVoucherFieldLabel =
        fieldsByKey.get(activeVoucherField ?? '')?.label ?? 'Voucher tujuan';

    const fieldValue = (key: string) => {
        const value = form.data[key];

        return typeof value === 'string' ? value : '';
    };

    const formatVoucherDiscount = (voucher: VoucherOption) =>
        voucher.discount_type === 'percentage'
            ? `${voucher.discount_value}%`
            : `Rp ${voucher.discount_value.toLocaleString('id-ID')}`;

    const selectedVoucherForField = (fieldKey: string) => {
        const value = fieldValue(fieldKey);

        return (
            voucherOptions.find((voucher) => voucher.select_url === value) ??
            voucherOptions.find((voucher) =>
                value.endsWith(`/promo/voucher/${voucher.code}`),
            ) ??
            null
        );
    };

    const isVoucherOptionDisabled = (voucher: VoucherOption) => {
        const today = new Date().toISOString().slice(0, 10);

        return (
            !voucher.is_active ||
            voucher.remaining_quota === 0 ||
            Boolean(voucher.starts_at && voucher.starts_at > today) ||
            Boolean(voucher.ends_at && voucher.ends_at < today)
        );
    };

    const openCreatePartOfLogo = () => {
        setEditingLogo(null);
        partOfLogoForm.clearErrors();
        partOfLogoForm.setData({
            name: '',
            link_url: '',
            sort_order: 0,
            is_active: true,
            image: null,
        });
        setLogoModalOpen(true);
    };

    const openEditPartOfLogo = (logo: PartOfLogo) => {
        setEditingLogo(logo);
        partOfLogoForm.clearErrors();
        partOfLogoForm.setData({
            name: logo.name ?? '',
            link_url: logo.link_url ?? '',
            sort_order: logo.sort_order ?? 0,
            is_active: logo.is_active,
            image: null,
        });
        setLogoModalOpen(true);
    };

    const submitPartOfLogo = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setLogoModalOpen(false);
                setEditingLogo(null);
                partOfLogoForm.reset();
                Swal.fire({
                    title: 'Berhasil',
                    text: editingLogo
                        ? 'Logo Part of diperbarui.'
                        : 'Logo Part of ditambahkan.',
                    icon: 'success',
                });
            },
            onError: () =>
                Swal.fire({
                    title: 'Gagal',
                    text: 'Periksa nama, link, urutan, dan file logo yang dipilih.',
                    icon: 'error',
                }),
        };

        if (editingLogo) {
            partOfLogoForm.transform((data) => ({ ...data, _method: 'put' }));
            partOfLogoForm.post(
                `/admin/public/home/part-of-logos/${editingLogo.id}`,
                options,
            );
            return;
        }

        partOfLogoForm.transform((data) => data);
        partOfLogoForm.post('/admin/public/home/part-of-logos', options);
    };

    const deletePartOfLogo = async (logo: PartOfLogo) => {
        const result = await Swal.fire({
            title: 'Hapus logo Part of?',
            text: logo.name
                ? `Logo ${logo.name} akan dihapus permanen.`
                : 'Logo akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });

        if (!result.isConfirmed) {
            return;
        }

        router.delete(`/admin/public/home/part-of-logos/${logo.id}`, {
            preserveScroll: true,
            onSuccess: () =>
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Logo Part of dihapus.',
                    icon: 'success',
                }),
            onError: () =>
                Swal.fire({
                    title: 'Gagal',
                    text: 'Logo Part of gagal dihapus.',
                    icon: 'error',
                }),
        });
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
        const isMediaUpload = field.type === 'media' && imageFileKey;
        const isVideoUpload = field.type === 'video' && videoFileKey;
        const inputId = isImageUpload
            ? imageFileKey
            : isMediaUpload
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
                ) : isImageUpload || isMediaUpload ? (
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                        {isMediaUpload && isVideoMediaUrl(fieldValue(field.key)) ? (
                            <video
                                src={fieldValue(field.key)}
                                className={previewClassName}
                                controls
                                preload="metadata"
                            />
                        ) : fieldValue(field.key) ? (
                            <img
                                src={fieldValue(field.key)}
                                alt={field.label}
                                className={previewClassName}
                            />
                        ) : (
                            <div className="flex h-32 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                                {isMediaUpload
                                    ? 'Belum ada preview'
                                    : 'Belum ada gambar'}
                            </div>
                        )}

                        <Input
                            key={`${imageFileKey}-${fileInputVersion}`}
                            id={imageFileKey}
                            aria-label={field.label}
                            type="file"
                            accept={
                                isMediaUpload
                                    ? 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg'
                                    : 'image/jpeg,image/png,image/webp'
                            }
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

    const renderVoucherLinkPicker = (key: string) => {
        const field = fieldsByKey.get(key);
        const selectedVoucher = selectedVoucherForField(key);
        const value = fieldValue(key);

        return (
            <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={key}>{field?.label ?? 'Voucher tujuan'}</Label>
                    <button
                        type="button"
                        onClick={() => resetToDefault(key)}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                    >
                        Reset
                    </button>
                </div>

                <button
                    id={key}
                    type="button"
                    onClick={() => setActiveVoucherField(key)}
                    disabled={form.processing}
                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-xs transition hover:border-sky-300 hover:bg-sky-50/60 focus-visible:ring-[3px] focus-visible:ring-sky-500/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-800">
                            {selectedVoucher
                                ? selectedVoucher.code
                                : 'Pilih voucher'}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                            {selectedVoucher
                                ? `${formatVoucherDiscount(selectedVoucher)} diskon · ${selectedVoucher.remaining_quota === null || selectedVoucher.remaining_quota === undefined ? 'Kuota tidak dibatasi' : `${selectedVoucher.remaining_quota} tersisa`}`
                                : 'User akan diarahkan ke halaman wisata dan kode voucher otomatis dibawa ke checkout.'}
                        </span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                </button>

                {value && !selectedVoucher && (
                    <p className="text-xs text-amber-600">
                        Link saat ini belum terhubung ke voucher aktif.
                    </p>
                )}
                <InputError message={form.errors[key]} />
            </div>
        );
    };

    const renderMobileBannerSection = () => (
        <div className="space-y-6">
            <section className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5">
                <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                        <Smartphone className="h-5 w-5" />
                    </span>
                    <div>
                        <h3 className="text-base font-semibold text-slate-950">
                            Banner khusus aplikasi mobile
                        </h3>
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                            Banner ini hanya dipakai oleh mobile apps. Banner
                            atas tampil setelah kolom pencarian, sedangkan
                            banner promo tampil setelah kategori wisata. Media
                            dapat berupa foto, GIF, atau video pendek.
                        </p>
                    </div>
                </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-2">
                <section className="rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="mb-5 flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                            <ImageIcon className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-sky-700 uppercase">
                                Banner 1
                            </p>
                            <h3 className="text-base font-semibold text-slate-950">
                                Banner atas aplikasi
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                                Gunakan gambar/video yang kuat sebagai hero
                                utama di halaman home mobile.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {renderFieldByKey(
                            'mobile_top_banner_media_url',
                            'grid gap-2',
                            'aspect-[16/9] w-full rounded-2xl object-cover',
                        )}
                        <div className="grid gap-4 md:grid-cols-2">
                            {renderFieldByKey('mobile_top_banner_title')}
                            {renderFieldByKey('mobile_top_banner_cta_label')}
                        </div>
                        {renderFieldByKey('mobile_top_banner_subtitle')}
                        {renderFieldByKey('mobile_top_banner_link_url')}
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="mb-5 flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-sm">
                            <BadgePercent className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-cyan-700 uppercase">
                                Banner 2
                            </p>
                            <h3 className="text-base font-semibold text-slate-950">
                                Banner promo setelah kategori
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                                Dipakai untuk highlight promo cepat seperti
                                diskon akhir pekan atau campaign wisata.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {renderFieldByKey(
                            'mobile_promo_banner_media_url',
                            'grid gap-2',
                            'aspect-[16/7] w-full rounded-2xl object-cover',
                        )}
                        <div className="grid gap-4 md:grid-cols-2">
                            {renderFieldByKey('mobile_promo_banner_title')}
                            {renderFieldByKey('mobile_promo_banner_highlight')}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {renderFieldByKey('mobile_promo_banner_subtitle')}
                            {renderFieldByKey('mobile_promo_banner_cta_label')}
                        </div>
                        {renderFieldByKey('mobile_promo_banner_link_url')}
                    </div>
                </section>
            </div>
        </div>
    );

    const renderPromoSpecialSection = () => {
        const promoCards = [
            {
                number: 1,
                title: 'Gambar kanan atas kiri',
                description: 'Tampil di kolase kanan, baris atas sebelah kiri.',
                fieldPreviewClassName: 'h-52 w-full rounded-xl object-cover',
            },
            {
                number: 2,
                title: 'Gambar kanan atas kanan',
                description: 'Tampil di kolase kanan, baris atas sebelah kanan.',
                fieldPreviewClassName: 'h-52 w-full rounded-xl object-cover',
            },
            {
                number: 3,
                title: 'Gambar kanan bawah',
                description:
                    'Tampil melebar di bawah dua gambar pertama.',
                fieldPreviewClassName: 'h-48 w-full rounded-xl object-cover',
            },
        ];

        return (
            <div className="space-y-6">
                <section
                    className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5"
                    data-coach="public-home-special-promo"
                >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                                <BadgePercent className="h-5 w-5" />
                            </span>
                            <div>
                                <h3 className="text-base font-semibold text-slate-950">
                                    Alur edit Promo Spesial
                                </h3>
                                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                                    Isi judul section, upload video, lalu atur
                                    tiga gambar promo sesuai posisinya. Voucher
                                    tujuan dipilih dari modal agar kode promo
                                    otomatis terbawa ke checkout user.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3 lg:min-w-[420px]">
                            {['Judul section', 'Media video', 'Gambar + voucher'].map(
                                (label, index) => (
                                    <div
                                        key={label}
                                        className="rounded-2xl border border-sky-100 bg-white px-3 py-2 shadow-xs"
                                    >
                                        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                                            {index + 1}
                                        </span>
                                        {label}
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                </section>

                <div className="space-y-6">
                        <section className="rounded-3xl border border-slate-200 bg-white p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                    <LayoutGrid className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                        Langkah 1
                                    </p>
                                    <h3 className="text-base font-semibold text-slate-950">
                                        Judul section di halaman depan
                                    </h3>
                                </div>
                            </div>
                            {renderFieldByKey('special_promo_title')}
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-5">
                            <div className="mb-5 flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                                    <Clapperboard className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-sky-700 uppercase">
                                        Langkah 2
                                    </p>
                                    <h3 className="text-base font-semibold text-slate-950">
                                        Media video promo
                                    </h3>
                                    <p className="mt-1 max-w-2xl text-sm text-slate-600">
                                        Upload video utama dan poster/preview.
                                        Teks video bersifat opsional karena
                                        tampilan homepage memakai media tanpa
                                        overlay teks.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-5 xl:grid-cols-2">
                                <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-slate-900">
                                            Video pertama
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Tampil di kartu video bagian atas
                                            pada halaman beranda.
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        {renderFieldByKey(
                                            'special_promo_video_url',
                                        )}
                                        {renderFieldByKey(
                                            'special_promo_video_poster_url',
                                            'grid gap-2',
                                            'aspect-video w-full rounded-xl object-cover',
                                        )}
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {renderFieldByKey(
                                                'special_promo_video_title',
                                            )}
                                            {renderFieldByKey(
                                                'special_promo_video_subtitle',
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-slate-900">
                                            Video kedua
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Tampil di kartu video bagian bawah.
                                            Gunakan file berbeda agar video tidak
                                            sama dengan video pertama.
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        {renderFieldByKey(
                                            'special_promo_video_2_url',
                                        )}
                                        {renderFieldByKey(
                                            'special_promo_video_2_poster_url',
                                            'grid gap-2',
                                            'aspect-video w-full rounded-xl object-cover',
                                        )}
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {renderFieldByKey(
                                                'special_promo_video_2_title',
                                            )}
                                            {renderFieldByKey(
                                                'special_promo_video_2_subtitle',
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="mt-5 rounded-2xl border border-dashed border-sky-200 bg-sky-50/70 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-sky-950">
                                        Susunan di halaman beranda
                                    </p>
                                    <p className="mt-1 text-xs text-sky-700">
                                        Kolom kiri berisi dua video berurutan.
                                        Kolom kanan berisi dua gambar promo di
                                        atas dan satu gambar landscape di bawah.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-5">
                            <div className="mb-5 flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                                    <ImageIcon className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                        Langkah 3
                                    </p>
                                    <h3 className="text-base font-semibold text-slate-950">
                                        Tiga gambar promo dan voucher tujuan
                                    </h3>
                                    <p className="mt-1 max-w-2xl text-sm text-slate-600">
                                        Setiap gambar dapat diarahkan ke voucher.
                                        Saat user membuka promo tersebut, voucher
                                        akan otomatis disiapkan untuk checkout.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {promoCards.map((card) => (
                                    <section
                                        key={card.number}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                                    >
                                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {card.title}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {card.description}
                                                </p>
                                            </div>
                                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 shadow-xs">
                                                <ImageIcon className="h-3.5 w-3.5" />
                                                Promo {card.number}
                                            </span>
                                        </div>

                                        <div className="grid gap-5 xl:grid-cols-[minmax(240px,0.85fr)_minmax(0,1fr)]">
                                            {renderFieldByKey(
                                                `special_promo_card_${card.number}_image_url`,
                                                'grid gap-2',
                                                card.fieldPreviewClassName,
                                            )}
                                            <div className="space-y-4">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    {renderFieldByKey(
                                                        `special_promo_card_${card.number}_title`,
                                                    )}
                                                    {renderFieldByKey(
                                                        `special_promo_card_${card.number}_subtitle`,
                                                    )}
                                                </div>
                                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                        <Link2 className="h-4 w-4 text-sky-600" />
                                                        Voucher tujuan gambar ini
                                                    </div>
                                                    {renderVoucherLinkPicker(
                                                        `special_promo_card_${card.number}_link_url`,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                ))}
                            </div>
                        </section>
                </div>
            </div>
        );
    };

    const renderPartOfSection = () => (
        <div className="space-y-6">
            <section className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                            <Globe className="h-5 w-5" />
                        </span>
                        <div>
                            <h3 className="text-base font-semibold text-slate-950">
                                Konten Part of
                            </h3>
                            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                                Atur judul, deskripsi, dan logo yang berjalan
                                khusus untuk section Part of. Logo di sini
                                terpisah dari Partner Kami.
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={openCreatePartOfLogo}
                        className="bg-sky-600 text-white hover:bg-sky-700"
                    >
                        Tambah Logo
                    </Button>
                </div>
            </section>

            <section
                className="rounded-3xl border border-slate-200 bg-white p-5"
                data-coach="public-home-part-of-logos"
            >
                <div className="mb-5 flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                        <LayoutGrid className="h-5 w-5" />
                    </span>
                    <div>
                        <h3 className="text-base font-semibold text-slate-950">
                            Teks section
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Field ini disimpan bersama konten home utama.
                        </p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {activeSection.fields.map((field) => renderField(field))}
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-slate-950">
                            Logo Part of
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Tambahkan logo sebanyak yang dibutuhkan. Logo aktif
                            akan dibagi otomatis menjadi dua baris berjalan di
                            beranda.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={openCreatePartOfLogo}
                        variant="outline"
                        className="border-sky-200 text-sky-700 hover:bg-sky-50"
                    >
                        Tambah Logo
                    </Button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Logo
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Urutan
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {partOfLogos.map((logo) => (
                                    <tr key={logo.id}>
                                        <td className="px-4 py-3">
                                            <div className="flex h-14 w-24 items-center justify-center rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
                                                {logo.image_url ? (
                                                    <img
                                                        src={logo.image_url}
                                                        alt={
                                                            logo.name ??
                                                            'Logo Part of'
                                                        }
                                                        className="max-h-10 w-auto max-w-full object-contain"
                                                    />
                                                ) : (
                                                    <ImageIcon className="h-6 w-6 text-slate-300" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="max-w-xs truncate font-semibold text-slate-950">
                                                {logo.name || 'Tanpa nama'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {logo.sort_order}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    logo.is_active
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {logo.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="border-sky-200 text-slate-700 hover:bg-sky-50"
                                                    onClick={() =>
                                                        openEditPartOfLogo(logo)
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() =>
                                                        deletePartOfLogo(logo)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {partOfLogos.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-10 text-center"
                                        >
                                            <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
                                            <p className="mt-3 text-sm font-semibold text-slate-700">
                                                Belum ada logo Part of.
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Klik Tambah Logo untuk
                                                menampilkan section Part of di
                                                halaman beranda.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
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
                    <section
                        className="overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 shadow-sm"
                        data-coach="public-home-active-section"
                    >
                        <div
                            className="flex gap-2 overflow-x-auto border-b border-slate-100 p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            role="tablist"
                            aria-label="Section konten halaman home"
                            data-coach="public-home-tabs"
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

                            {activeSection.title === 'Banner Mobile Apps' ? (
                                renderMobileBannerSection()
                            ) : activeSection.title === 'Promo Spesial Untukmu' ? (
                                renderPromoSpecialSection()
                            ) : activeSection.title === 'Part of' ? (
                                renderPartOfSection()
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {activeSection.fields.map((field) =>
                                        renderField(field),
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    <div
                        className="sticky bottom-4 z-10 flex justify-end rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-lg backdrop-blur"
                        data-coach="public-home-save"
                    >
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
                    open={logoModalOpen}
                    onOpenChange={(open) => {
                        setLogoModalOpen(open);
                        if (!open) {
                            setEditingLogo(null);
                            partOfLogoForm.clearErrors();
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingLogo
                                    ? 'Edit logo Part of'
                                    : 'Tambah logo Part of'}
                            </DialogTitle>
                            <DialogDescription>
                                Logo ini khusus untuk section Part of di
                                halaman beranda dan tidak tercampur dengan
                                Partner Kami.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            className="space-y-4"
                            onSubmit={submitPartOfLogo}
                        >
                            {editingLogo?.image_url && (
                                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <img
                                        src={editingLogo.image_url}
                                        alt={
                                            editingLogo.name ??
                                            'Logo Part of saat ini'
                                        }
                                        className="max-h-20 w-auto max-w-full object-contain"
                                    />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="part-of-logo-name">
                                    Nama logo
                                </Label>
                                <Input
                                    id="part-of-logo-name"
                                    value={partOfLogoForm.data.name}
                                    maxLength={80}
                                    onChange={(event) =>
                                        partOfLogoForm.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                    disabled={partOfLogoForm.processing}
                                />
                                <InputError
                                    message={partOfLogoForm.errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="part-of-logo-link">Link tujuan (opsional)</Label>
                                <Input
                                    id="part-of-logo-link"
                                    type="url"
                                    placeholder="https://example.com"
                                    maxLength={2048}
                                    value={partOfLogoForm.data.link_url}
                                    onChange={(event) => partOfLogoForm.setData('link_url', event.target.value)}
                                    disabled={partOfLogoForm.processing}
                                />
                                <InputError message={partOfLogoForm.errors.link_url} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="part-of-logo-sort-order">
                                    Urutan
                                </Label>
                                <Input
                                    id="part-of-logo-sort-order"
                                    type="number"
                                    min={0}
                                    value={partOfLogoForm.data.sort_order}
                                    onChange={(event) =>
                                        partOfLogoForm.setData(
                                            'sort_order',
                                            Number(event.target.value),
                                        )
                                    }
                                    disabled={partOfLogoForm.processing}
                                />
                                <InputError
                                    message={partOfLogoForm.errors.sort_order}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="part-of-logo-image"
                                    required={!editingLogo}
                                >
                                    {editingLogo
                                        ? 'Ganti logo'
                                        : 'Logo'}
                                </Label>
                                <Input
                                    id="part-of-logo-image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    required={!editingLogo}
                                    onChange={(event) =>
                                        partOfLogoForm.setData(
                                            'image',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                    disabled={partOfLogoForm.processing}
                                />
                                <p className="text-xs text-slate-500">
                                    Format JPG, PNG, atau WebP. Logo aktif akan
                                    tampil dalam marquee Part of.
                                </p>
                                <InputError
                                    message={partOfLogoForm.errors.image}
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={partOfLogoForm.data.is_active}
                                    onChange={(event) =>
                                        partOfLogoForm.setData(
                                            'is_active',
                                            event.target.checked,
                                        )
                                    }
                                    disabled={partOfLogoForm.processing}
                                />
                                Aktif
                            </label>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setLogoModalOpen(false)}
                                    disabled={partOfLogoForm.processing}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                    disabled={partOfLogoForm.processing}
                                >
                                    {partOfLogoForm.processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Logo'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

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

                <Dialog
                    open={Boolean(activeVoucherField)}
                    onOpenChange={(open) => {
                        if (!open) {
                            setActiveVoucherField(null);
                        }
                    }}
                >
                    <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Pilih voucher promo</DialogTitle>
                            <DialogDescription>
                                Pilih voucher untuk {activeVoucherFieldLabel.toLowerCase()}.
                                Saat gambar promo diklik, user diarahkan ke
                                daftar wisata dan voucher ini otomatis dibawa ke
                                checkout.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
                            {voucherOptions.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                                    Belum ada voucher wisata. Buat voucher dari
                                    menu Wisata - Voucher terlebih dahulu.
                                </div>
                            )}

                            {voucherOptions.map((voucher) => {
                                const selected =
                                    activeVoucherField !== null &&
                                    selectedVoucherForField(activeVoucherField)
                                        ?.id === voucher.id;
                                const disabled =
                                    isVoucherOptionDisabled(voucher);

                                return (
                                    <button
                                        key={voucher.id}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => {
                                            if (activeVoucherField) {
                                                form.setData(
                                                    activeVoucherField,
                                                    voucher.select_url,
                                                );
                                            }
                                            setActiveVoucherField(null);
                                        }}
                                        className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
                                            selected
                                                ? 'border-sky-400 bg-sky-50 text-sky-900 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/60'
                                        } ${
                                            disabled
                                                ? 'cursor-not-allowed opacity-50'
                                                : ''
                                        }`}
                                    >
                                        <span className="min-w-0">
                                            <span className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-slate-950">
                                                    {voucher.code}
                                                </span>
                                                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                                                    {formatVoucherDiscount(
                                                        voucher,
                                                    )}
                                                </span>
                                            </span>
                                            <span className="mt-1 block text-xs text-slate-500">
                                                Min. transaksi{' '}
                                                {voucher.min_transaction > 0
                                                    ? `Rp ${voucher.min_transaction.toLocaleString('id-ID')}`
                                                    : 'tidak dibatasi'}{' '}
                                                · Kuota{' '}
                                                {voucher.remaining_quota ===
                                                    null ||
                                                voucher.remaining_quota ===
                                                    undefined
                                                    ? 'tidak dibatasi'
                                                    : `${voucher.remaining_quota} tersisa`}
                                            </span>
                                            {(voucher.starts_at ||
                                                voucher.ends_at) && (
                                                <span className="mt-1 block text-xs text-slate-400">
                                                    Berlaku{' '}
                                                    {voucher.starts_at ?? '-'} -{' '}
                                                    {voucher.ends_at ?? '-'}
                                                </span>
                                            )}
                                        </span>
                                        {selected && (
                                            <Check className="h-5 w-5 shrink-0 text-sky-600" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {activeVoucherField && fieldValue(activeVoucherField) && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    const fieldKey = activeVoucherField;
                                    if (!fieldKey) {
                                        return;
                                    }

                                    form.setData(fieldKey, '');
                                    setActiveVoucherField(null);
                                }}
                            >
                                Kosongkan voucher tujuan
                            </Button>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
