import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
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
];

export default function EntryQrTemplateEdit({
    template,
}: {
    template: TemplatePayload;
}) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="QR Masuk Mitra" />

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
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
                                    const max = template.text_limits[field.key] ?? 255;
                                    const value = form.data[field.key] ?? '';
                                    const inputId = `entry-qr-${field.key}`;

                                    return (
                                        <div key={field.key} className="grid gap-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <Label htmlFor={inputId} required>{field.label}</Label>
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
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
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
                                                            event.target.value,
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
                                            <Label htmlFor={inputId}>{field.label}</Label>
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
                                                    event.target.files?.[0] ??
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
                                                        event.target.checked,
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
                                {form.processing ? 'Menyimpan...' : 'Simpan QR'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
