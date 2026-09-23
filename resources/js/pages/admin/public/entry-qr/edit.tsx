import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import {
    CircleCheck,
    Globe2,
    Image as ImageIcon,
    QrCode,
    ScanLine,
    Ticket,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/home' },
    { title: 'QR Masuk Mitra', href: '/admin/public/entry-qr' },
];

type TemplateValues = {
    scan_label: string;
    lead_text: string;
    main_title: string;
    main_description: string;
    website_label: string;
    footer_step_one: string;
    footer_step_two: string;
    footer_step_three: string;
    customer_service: string;
    top_logo_1: string | null;
    top_logo_2: string | null;
    top_logo_3: string | null;
    qr_logo: string | null;
    background_image: string | null;
    playstore_image: string | null;
};

type TemplatePayload = {
    values: TemplateValues;
    text_limits: Record<string, number>;
};

type PreviewPayload = {
    qr_image: string;
    template: TemplateValues & {
        top_logo_urls: string[];
        qr_logo_url: string | null;
        background_image_url: string | null;
        playstore_image_url: string | null;
    };
};

type ImageKey =
    | 'top_logo_1'
    | 'top_logo_2'
    | 'top_logo_3'
    | 'qr_logo'
    | 'background_image'
    | 'playstore_image';

type TextKey = keyof Pick<
    TemplateValues,
    | 'scan_label'
    | 'lead_text'
    | 'main_title'
    | 'main_description'
    | 'website_label'
    | 'footer_step_one'
    | 'footer_step_two'
    | 'footer_step_three'
    | 'customer_service'
>;

type FormData = Record<TextKey, string> &
    Record<ImageKey, File | null> &
    Record<`remove_${ImageKey}`, boolean> & {
        _method: 'put';
    };

const imageFields: Array<{
    key: ImageKey;
    label: string;
    help: string;
}> = [
    {
        key: 'top_logo_1',
        label: 'Logo kiri atas 1',
        help: 'Logo utama di area kiri atas.',
    },
    {
        key: 'top_logo_2',
        label: 'Logo kiri atas 2',
        help: 'Opsional. Ditampilkan sejajar dengan logo utama.',
    },
    {
        key: 'top_logo_3',
        label: 'Logo kiri atas 3',
        help: 'Opsional. Maksimal total 3 logo di kiri atas.',
    },
    {
        key: 'qr_logo',
        label: 'Logo tengah QR',
        help: 'Gunakan logo sederhana. Ukuran tampil dibatasi agar QR tetap mudah discan.',
    },
    {
        key: 'background_image',
        label: 'Background pegunungan',
        help: 'Background area atas poster QR.',
    },
    {
        key: 'playstore_image',
        label: 'Logo Google Play',
        help: 'Gambar promosi download aplikasi.',
    },
];

const textFields: Array<{
    key: TextKey;
    label: string;
    multiline?: boolean;
}> = [
    { key: 'scan_label', label: 'Label tombol kanan atas' },
    { key: 'lead_text', label: 'Instruksi scan', multiline: true },
    { key: 'main_title', label: 'Judul utama bawah QR' },
    { key: 'main_description', label: 'Deskripsi bawah QR', multiline: true },
    { key: 'website_label', label: 'Teks website' },
    { key: 'footer_step_one', label: 'Langkah footer 1' },
    { key: 'footer_step_two', label: 'Langkah footer 2' },
    { key: 'footer_step_three', label: 'Langkah footer 3' },
    { key: 'customer_service', label: 'Customer Service' },
];

export default function EntryQrTemplateEdit({
    template,
    preview,
}: {
    template: TemplatePayload;
    preview: PreviewPayload;
}) {
    const [activeTab, setActiveTab] = useState<'settings' | 'preview'>(
        'settings',
    );
    const form = useForm<FormData>({
        _method: 'put',
        scan_label: template.values.scan_label ?? '',
        lead_text: template.values.lead_text ?? '',
        main_title: template.values.main_title ?? '',
        main_description: template.values.main_description ?? '',
        website_label: template.values.website_label ?? '',
        footer_step_one: template.values.footer_step_one ?? '',
        footer_step_two: template.values.footer_step_two ?? '',
        footer_step_three: template.values.footer_step_three ?? '',
        customer_service: template.values.customer_service ?? '',
        top_logo_1: null,
        top_logo_2: null,
        top_logo_3: null,
        qr_logo: null,
        background_image: null,
        playstore_image: null,
        remove_top_logo_1: false,
        remove_top_logo_2: false,
        remove_top_logo_3: false,
        remove_qr_logo: false,
        remove_background_image: false,
        remove_playstore_image: false,
    });

    const setText = (key: TextKey, value: string) => {
        const max = template.text_limits[key] ?? 255;
        form.setData(key, value.slice(0, max));
    };

    const previewImage = (key: ImageKey) => template.values[key];
    const previewTemplate = preview.template;
    const previewLogos = previewTemplate.top_logo_urls.length
        ? previewTemplate.top_logo_urls.slice(0, 3)
        : ['/logo.png'];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="QR Masuk Mitra" />

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <p className="text-xs font-semibold text-sky-600 uppercase">
                        Konten Publik
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                        Kelola QR Masuk Mitra
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                        Atur logo dan teks pada poster QR yang dicetak mitra
                        wisata. Batas karakter diterapkan agar layout QR tidak
                        berubah saat nama wisata panjang.
                    </p>
                </section>

                <div className="flex flex-wrap gap-2 rounded-2xl border border-sky-100 bg-white/90 p-2 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setActiveTab('settings')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'settings' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'}`}
                    >
                        <ImageIcon className="h-4 w-4" />
                        Pengaturan Template
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'preview' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'}`}
                        data-coach="entry-qr-preview-tab"
                    >
                        <QrCode className="h-4 w-4" />
                        Preview QR
                    </button>
                </div>

                {activeTab === 'settings' ? (
                    <form
                        className="space-y-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/admin/public/entry-qr', {
                                forceFormData: true,
                                preserveScroll: true,
                                onSuccess: () =>
                                    Swal.fire({
                                        title: 'Berhasil',
                                        text: 'Konten QR masuk mitra diperbarui.',
                                        icon: 'success',
                                    }),
                                onError: () =>
                                    Swal.fire({
                                        title: 'Gagal',
                                        text: 'Periksa kembali teks dan file gambar yang dipilih.',
                                        icon: 'error',
                                    }),
                            });
                        }}
                    >
                        <div className="space-y-6">
                            <section
                                className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                                data-coach="entry-qr-text"
                            >
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Teks QR
                                </h2>
                                <div className="mt-5 grid gap-4">
                                    {textFields.map((field) => {
                                        const max =
                                            template.text_limits[field.key] ??
                                            255;
                                        const value =
                                            form.data[field.key] ?? '';
                                        const inputId = `entry-qr-${field.key}`;

                                        return (
                                            <div
                                                key={field.key}
                                                className="grid gap-2"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <Label
                                                        htmlFor={inputId}
                                                        required
                                                    >
                                                        {field.label}
                                                    </Label>
                                                    <span className="text-xs text-slate-500">
                                                        {value.length}/{max}
                                                    </span>
                                                </div>
                                                {field.multiline ? (
                                                    <textarea
                                                        id={inputId}
                                                        aria-label={field.label}
                                                        required
                                                        value={value}
                                                        maxLength={max}
                                                        rows={3}
                                                        onChange={(event) =>
                                                            setText(
                                                                field.key,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm transition outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                                    />
                                                ) : (
                                                    <Input
                                                        id={inputId}
                                                        aria-label={field.label}
                                                        required
                                                        value={value}
                                                        maxLength={max}
                                                        onChange={(event) =>
                                                            setText(
                                                                field.key,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                )}
                                                <InputError
                                                    message={
                                                        form.errors[
                                                            field.key as keyof typeof form.errors
                                                        ]
                                                    }
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <section
                                className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                                data-coach="entry-qr-images"
                            >
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Logo dan Gambar
                                </h2>
                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                    {imageFields.map((field) => {
                                        const inputId = `entry-qr-${field.key}`;

                                        return (
                                            <div
                                                key={field.key}
                                                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                                            >
                                                <Label htmlFor={inputId}>
                                                    {field.label}
                                                </Label>
                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    {field.help}
                                                </p>
                                                {previewImage(field.key) && (
                                                    <div className="mt-3 flex h-20 items-center justify-center rounded-xl border border-slate-100 bg-white p-3">
                                                        <img
                                                            src={
                                                                previewImage(
                                                                    field.key,
                                                                ) as string
                                                            }
                                                            alt={field.label}
                                                            className="max-h-full max-w-full object-contain"
                                                        />
                                                    </div>
                                                )}
                                                <Input
                                                    id={inputId}
                                                    aria-label={field.label}
                                                    type="file"
                                                    accept="image/*"
                                                    className="mt-3"
                                                    onChange={(event) =>
                                                        form.setData(
                                                            field.key,
                                                            event.target
                                                                .files?.[0] ??
                                                                null,
                                                        )
                                                    }
                                                />
                                                <label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            form.data[
                                                                `remove_${field.key}`
                                                            ]
                                                        }
                                                        onChange={(event) =>
                                                            form.setData(
                                                                `remove_${field.key}`,
                                                                event.target
                                                                    .checked,
                                                            )
                                                        }
                                                    />
                                                    Hapus gambar saat ini
                                                </label>
                                                <InputError
                                                    message={
                                                        form.errors[
                                                            field.key as keyof typeof form.errors
                                                        ]
                                                    }
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                            <div
                                className="flex justify-end rounded-3xl border border-sky-100/80 bg-white/90 p-4 shadow-sm"
                                data-coach="entry-qr-save"
                            >
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                >
                                    {form.processing
                                        ? 'Menyimpan...'
                                        : 'Simpan QR'}
                                </Button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <section
                        className="grid gap-6 rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)]"
                        data-coach="entry-qr-preview"
                    >
                        <div className="relative mx-auto aspect-[1086/1536] w-full max-w-[390px] overflow-hidden rounded-[26px] border-[6px] border-[#116fd4] bg-white shadow-[0_28px_70px_-42px_rgba(15,23,42,0.5)]">
                            <div className="absolute inset-x-0 top-0 h-[40%] overflow-hidden bg-gradient-to-br from-[#0b55c7] via-[#0487df] to-[#23d4e4]">
                                {previewTemplate.background_image_url && (
                                    <img
                                        src={
                                            previewTemplate.background_image_url
                                        }
                                        alt=""
                                        aria-hidden="true"
                                        className="absolute inset-x-0 top-[4%] h-full w-full object-cover"
                                    />
                                )}
                                <div className="absolute top-0 left-0 flex h-[16%] w-[34%] items-center justify-center gap-2 rounded-br-[56px] bg-white px-4 shadow-sm">
                                    {previewLogos.map((logoUrl, index) => (
                                        <img
                                            key={`${logoUrl}-${index}`}
                                            src={logoUrl}
                                            alt={
                                                index === 0
                                                    ? 'Logo QR masuk'
                                                    : ''
                                            }
                                            className={`h-[60%] w-auto object-contain ${previewLogos.length > 1 ? 'max-w-[30%]' : 'max-w-full'}`}
                                        />
                                    ))}
                                </div>
                                <div className="absolute top-[3.7%] right-[4%] inline-flex items-center gap-2 rounded-full border border-white/70 bg-[#145ccf]/88 px-4 py-2.5 text-sm font-bold text-white">
                                    <ScanLine className="h-5 w-5" />
                                    <span>{previewTemplate.scan_label}</span>
                                </div>
                                <div className="absolute top-[20.2%] left-[6%] max-w-[78%] text-white">
                                    <h2 className="text-[29px] leading-[1.04] font-black tracking-wide uppercase">
                                        NAMA DESTINASI WISATA
                                    </h2>
                                    <div className="mt-4 h-1.5 w-14 rounded-full bg-cyan-200" />
                                    <p className="mt-4 max-w-[300px] text-[14px] leading-snug font-medium">
                                        {previewTemplate.lead_text}
                                    </p>
                                </div>
                            </div>
                            <div className="absolute inset-x-0 top-[35.5%] bottom-0 rounded-t-[46px] bg-white px-[7%] text-center">
                                <div className="absolute top-[3.6%] left-1/2 w-[36%] max-w-[145px] -translate-x-1/2">
                                    <div className="relative rounded-[20px] bg-white p-3 shadow-[0_18px_36px_-18px_rgba(15,23,42,0.55)] ring-1 ring-slate-100">
                                        <img
                                            src={preview.qr_image}
                                            alt="Contoh QR masuk wisata"
                                            className="mx-auto aspect-square w-full"
                                        />
                                        {previewTemplate.qr_logo_url && (
                                            <span className="absolute top-1/2 left-1/2 flex h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-white p-0.5 shadow-sm ring-1 ring-slate-100">
                                                <img
                                                    src={
                                                        previewTemplate.qr_logo_url
                                                    }
                                                    alt=""
                                                    aria-hidden="true"
                                                    className="h-full w-full object-contain"
                                                />
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-7 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-[14px] bg-sky-600 text-white">
                                        <CircleCheck className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="absolute inset-x-[7%] bottom-[32%] text-center">
                                    <div className="text-[11px] leading-tight font-black tracking-wide text-[#123a75] uppercase">
                                        {previewTemplate.main_title}
                                    </div>
                                    <p className="mx-auto mt-2.5 max-w-[300px] text-[9.5px] leading-snug text-[#263b67]">
                                        {previewTemplate.main_description}
                                    </p>
                                </div>
                                <div className="absolute inset-x-[8%] bottom-[21%] flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-white/90 px-3 py-2 text-left shadow-sm">
                                    <div className="flex min-w-0 items-center gap-2 text-[#123a75]">
                                        <Globe2 className="h-4 w-4 shrink-0 text-sky-600" />
                                        <span className="truncate text-[10px] font-black">
                                            {previewTemplate.website_label}
                                        </span>
                                    </div>
                                    {previewTemplate.playstore_image_url && (
                                        <img
                                            src={
                                                previewTemplate.playstore_image_url
                                            }
                                            alt="Google Play"
                                            className="h-6 w-auto shrink-0 object-contain"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 flex h-[12.5%] items-center justify-between gap-1 bg-gradient-to-r from-[#0c55be] via-[#078ee4] to-[#2bd8df] px-[6%] text-[9.5px] font-bold text-white">
                                <span className="flex min-w-0 flex-1 items-center justify-center gap-1 truncate">
                                    <QrCode className="h-3.5 w-3.5 shrink-0" />
                                    {previewTemplate.footer_step_one}
                                </span>
                                <span className="h-[48%] w-px bg-white/70" />
                                <span className="flex min-w-0 flex-1 items-center justify-center gap-1 truncate">
                                    <Ticket className="h-3.5 w-3.5 shrink-0" />
                                    {previewTemplate.footer_step_two}
                                </span>
                                <span className="h-[48%] w-px bg-white/70" />
                                <span className="flex min-w-0 flex-1 items-center justify-center gap-1 truncate">
                                    <CircleCheck className="h-3.5 w-3.5 shrink-0" />
                                    {previewTemplate.footer_step_three}
                                </span>
                            </div>
                            <div className="absolute inset-x-0 bottom-[1.5%] text-center text-[12px] font-semibold text-white">
                                {previewTemplate.customer_service}
                            </div>
                        </div>
                        <div className="self-center">
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Preview QR
                            </p>
                            <h2 className="mt-2 text-xl font-semibold text-slate-900">
                                Tampilan poster untuk mitra wisata
                            </h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                                Preview memakai template yang sudah tersimpan.
                                Simpan perubahan pada tab Pengaturan Template,
                                lalu buka kembali tab ini untuk memeriksa teks,
                                logo, dan keterbacaan QR.
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
