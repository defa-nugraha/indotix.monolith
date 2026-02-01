import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Swal from 'sweetalert2';
import { CheckCircle2, XCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Dokumen Pendaftaran Wisata', href: '/mitra/wisata/onboarding' },
];

const stepTitles = ['Akun Mitra', 'Data Destinasi Wisata', 'Legalitas & Keuangan'];

type Option = { id: string; label: string };

type Onboarding = {
    id: number;
    current_step: number;
    responsible_name: string | null;
    responsible_phone: string | null;
    responsible_role: string | null;
    destination_name: string | null;
    destination_type: string | null;
    description: string | null;
    highlights: string | null;
    province_code: string | null;
    city_code: string | null;
    address_full: string | null;
    maps_pin_url: string | null;
    open_days: string[] | null;
    open_time: string | null;
    close_time: string | null;
    holiday_notes: string | null;
    facilities: string[] | null;
    photo_gate_path: string | null;
    photo_area_path: string | null;
    photo_ticket_path: string | null;
    contact_phone: string | null;
    contact_hours: string | null;
    ktp_path: string | null;
    selfie_ktp_path: string | null;
    legal_doc_type: string | null;
    legal_doc_number: string | null;
    legal_doc_path: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    verification_status: 'draft' | 'pending' | 'verified' | 'rejected';
    verification_reason: string | null;
    payout_status: 'draft' | 'pending' | 'verified' | 'rejected';
    payout_reason: string | null;
};

const destinationTypes = [
    { id: 'alam', label: 'Alam' },
    { id: 'edukasi', label: 'Edukasi' },
    { id: 'budaya', label: 'Budaya' },
    { id: 'wahana', label: 'Wahana' },
    { id: 'event', label: 'Event / Atraksi' },
];

const roleOptions = [
    { id: 'owner', label: 'Pemilik' },
    { id: 'manager', label: 'Pengelola' },
    { id: 'pokdarwis', label: 'Ketua Pokdarwis' },
    { id: 'staff', label: 'Staff Operasional' },
];

const facilityOptions = [
    { id: 'parkir', label: 'Parkir' },
    { id: 'toilet', label: 'Toilet' },
    { id: 'mushola', label: 'Mushola' },
    { id: 'warung', label: 'Warung' },
    { id: 'pemandu', label: 'Pemandu' },
    { id: 'asuransi', label: 'Asuransi' },
];

const dayOptions = [
    { id: 'mon', label: 'Senin' },
    { id: 'tue', label: 'Selasa' },
    { id: 'wed', label: 'Rabu' },
    { id: 'thu', label: 'Kamis' },
    { id: 'fri', label: 'Jumat' },
    { id: 'sat', label: 'Sabtu' },
    { id: 'sun', label: 'Minggu' },
];

function StepBadge({ status, label }: { status: string; label: string }) {
    const style =
        status === 'verified'
            ? 'bg-emerald-50 text-emerald-700'
            : status === 'pending'
            ? 'bg-amber-50 text-amber-700'
            : status === 'rejected'
            ? 'bg-red-50 text-red-700'
            : 'bg-sky-50 text-sky-700';
    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
            {label}
        </span>
    );
}

export default function MitraWisataOnboarding({
    onboarding,
    provinces,
    cities,
    status,
}: {
    onboarding: Onboarding;
    provinces: Option[];
    cities: Option[];
    status?: string;
}) {
    const [activeStep, setActiveStep] = useState(onboarding.current_step || 1);

    const step1Form = useForm({
        responsible_name: onboarding.responsible_name ?? '',
        responsible_phone: onboarding.responsible_phone ?? '',
        responsible_role: onboarding.responsible_role ?? '',
    });

    const step2Form = useForm({
        destination_name: onboarding.destination_name ?? '',
        destination_type: onboarding.destination_type ?? '',
        description: onboarding.description ?? '',
        highlights: onboarding.highlights ?? '',
        province_code: onboarding.province_code ?? '',
        city_code: onboarding.city_code ?? '',
        address_full: onboarding.address_full ?? '',
        maps_pin_url: onboarding.maps_pin_url ?? '',
        open_days: onboarding.open_days ?? ([] as string[]),
        open_time: onboarding.open_time ?? '',
        close_time: onboarding.close_time ?? '',
        holiday_notes: onboarding.holiday_notes ?? '',
        facilities: onboarding.facilities ?? ([] as string[]),
        contact_phone: onboarding.contact_phone ?? '',
        contact_hours: onboarding.contact_hours ?? '',
        photo_gate_file: null as File | null,
        photo_area_file: null as File | null,
        photo_ticket_file: null as File | null,
    });

    const step3Form = useForm({
        legal_doc_type: onboarding.legal_doc_type ?? '',
        legal_doc_number: onboarding.legal_doc_number ?? '',
        bank_name: onboarding.bank_name ?? '',
        bank_account_number: onboarding.bank_account_number ?? '',
        bank_account_name: onboarding.bank_account_name ?? '',
        ktp_file: null as File | null,
        selfie_ktp_file: null as File | null,
        legal_doc_file: null as File | null,
    });

    const provinceItems = useMemo(
        () =>
            provinces.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                    {item.label}
                </SelectItem>
            )),
        [provinces]
    );

    const cityItems = useMemo(
        () =>
            cities.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                    {item.label}
                </SelectItem>
            )),
        [cities]
    );

    const isFilled = (value?: string | number | null) => {
        if (typeof value === 'number') {
            return value > 0;
        }
        return Boolean(value && String(value).trim().length > 0);
    };

    const hasFile = (file?: File | null, path?: string | null) => Boolean(file || path);

    const [filePreviews, setFilePreviews] = useState<{
        gate?: string;
        area?: string;
        ticket?: string;
        ktp?: string;
        selfie?: string;
        legal?: string;
    }>({});

    useEffect(() => {
        return () => {
            Object.values(filePreviews).forEach((url) => {
                if (url?.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [filePreviews]);

    const getPublicUrl = (path?: string | null) => (path ? `/storage/${path}` : null);

    const handleFileChange = (
        key: keyof typeof filePreviews,
        file: File | null,
        fieldName: keyof typeof step2Form.data | keyof typeof step3Form.data
    ) => {
        if (fieldName in step2Form.data) {
            step2Form.setData(fieldName as keyof typeof step2Form.data, file as never);
        } else {
            step3Form.setData(fieldName as keyof typeof step3Form.data, file as never);
        }
        if (!file) {
            setFilePreviews((prev) => ({ ...prev, [key]: undefined }));
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        setFilePreviews((prev) => ({ ...prev, [key]: previewUrl }));
    };

    const showSuccess = (title: string, text: string) => {
        Swal.fire({ icon: 'success', title, text, confirmButtonText: 'OK' });
    };

    const showError = (title: string, text: string) => {
        Swal.fire({ icon: 'error', title, text, confirmButtonText: 'OK' });
    };

    const getFirstError = (errors: Record<string, string>): string => {
        const firstKey = Object.keys(errors)[0];
        return firstKey ? errors[firstKey] : 'Terjadi kesalahan. Silakan coba lagi.';
    };

    const submitVerification = () => {
        step1Form.post('/mitra/wisata/onboarding/step-1', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () =>
                step2Form.post('/mitra/wisata/onboarding/step-2', {
                    preserveScroll: true,
                    forceFormData: true,
                    onSuccess: () =>
                        step3Form.post('/mitra/wisata/onboarding/step-3', {
                            preserveScroll: true,
                            forceFormData: true,
                            onSuccess: () =>
                                router.post('/mitra/wisata/onboarding/submit-verification', {}, {
                                    onSuccess: () => {
                                        showSuccess('Terkirim', 'Dokumen verifikasi dikirim untuk review.');
                                        router.reload({ only: ['onboarding'] });
                                    },
                                    onError: (errors) =>
                                        showError('Gagal mengirim', getFirstError(errors)),
                                }),
                            onError: (errors) =>
                                showError('Gagal menyimpan', getFirstError(errors)),
                        }),
                    onError: (errors) =>
                        showError('Gagal menyimpan', getFirstError(errors)),
                }),
            onError: (errors) => showError('Gagal menyimpan', getFirstError(errors)),
        });
    };

    const FilePicker = ({
        id,
        label,
        helper,
        accept,
        fileName,
        previewUrl,
        onChange,
    }: {
        id: string;
        label: string;
        helper: string;
        accept: string;
        fileName?: string;
        previewUrl?: string | null;
        onChange: (file: File | null) => void;
    }) => {
        const hasPreview = Boolean(previewUrl);
        const isPdf = fileName?.toLowerCase().endsWith('.pdf') || previewUrl?.toLowerCase().includes('.pdf');

        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
                <input
                    id={id}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(event) => onChange(event.target.files?.[0] ?? null)}
                />
                <label htmlFor={id} className="flex cursor-pointer flex-col items-center">
                    {hasPreview ? (
                        <>
                            {isPdf ? (
                                <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700">
                                    {fileName ?? 'Dokumen PDF'}
                                </div>
                            ) : (
                                <img
                                    src={previewUrl ?? ''}
                                    alt={label}
                                    className="h-24 w-full max-w-[200px] rounded-lg object-cover"
                                />
                            )}
                            <p className="mt-2 text-xs font-medium text-slate-600">
                                Klik untuk ganti file
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-semibold text-slate-900">{label}</p>
                            <p className="mt-1 text-xs text-slate-500">{helper}</p>
                            <span className="mt-4 inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
                                Pilih File
                            </span>
                        </>
                    )}
                </label>
                {!hasPreview && fileName && (
                    <p className="mt-2 text-xs font-medium text-slate-600">File dipilih: {fileName}</p>
                )}
            </div>
        );
    };

    const isWisataVerificationReady = useMemo(() => {
        return (
            isFilled(onboarding.responsible_name) &&
            isFilled(onboarding.responsible_phone) &&
            isFilled(onboarding.responsible_role) &&
            isFilled(onboarding.destination_name) &&
            isFilled(onboarding.destination_type) &&
            isFilled(onboarding.description) &&
            isFilled(onboarding.province_code) &&
            isFilled(onboarding.city_code) &&
            isFilled(onboarding.address_full) &&
            isFilled(onboarding.maps_pin_url) &&
            Boolean(onboarding.open_days && onboarding.open_days.length > 0) &&
            isFilled(onboarding.open_time) &&
            isFilled(onboarding.close_time) &&
            isFilled(onboarding.photo_gate_path) &&
            isFilled(onboarding.photo_area_path) &&
            isFilled(onboarding.photo_ticket_path) &&
            isFilled(onboarding.ktp_path) &&
            isFilled(onboarding.legal_doc_type) &&
            isFilled(onboarding.legal_doc_number) &&
            isFilled(onboarding.legal_doc_path)
        );
    }, [onboarding]);

    const wisataChecklist = useMemo(() => {
        return [
            { label: 'Nama penanggung jawab', ok: isFilled(onboarding.responsible_name) },
            { label: 'Nomor HP penanggung jawab', ok: isFilled(onboarding.responsible_phone) },
            { label: 'Jabatan penanggung jawab', ok: isFilled(onboarding.responsible_role) },
            { label: 'Nama destinasi', ok: isFilled(onboarding.destination_name) },
            { label: 'Jenis wisata', ok: isFilled(onboarding.destination_type) },
            { label: 'Deskripsi singkat', ok: isFilled(onboarding.description) },
            { label: 'Provinsi', ok: isFilled(onboarding.province_code) },
            { label: 'Kota/Kabupaten', ok: isFilled(onboarding.city_code) },
            { label: 'Alamat lengkap', ok: isFilled(onboarding.address_full) },
            { label: 'Titik Google Maps', ok: isFilled(onboarding.maps_pin_url) },
            { label: 'Hari buka', ok: Boolean(onboarding.open_days && onboarding.open_days.length > 0) },
            { label: 'Jam buka', ok: isFilled(onboarding.open_time) },
            { label: 'Jam tutup', ok: isFilled(onboarding.close_time) },
            { label: 'Foto gerbang', ok: isFilled(onboarding.photo_gate_path) },
            { label: 'Foto area utama', ok: isFilled(onboarding.photo_area_path) },
            { label: 'Foto loket/validasi', ok: isFilled(onboarding.photo_ticket_path) },
            { label: 'Upload KTP', ok: isFilled(onboarding.ktp_path) },
            { label: 'Jenis dokumen legalitas', ok: isFilled(onboarding.legal_doc_type) },
            { label: 'Nomor dokumen legalitas', ok: isFilled(onboarding.legal_doc_number) },
            { label: 'Upload dokumen legalitas', ok: isFilled(onboarding.legal_doc_path) },
        ];
    }, [onboarding]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pendaftaran Mitra Wisata" />
            <div className="relative flex flex-1 flex-col gap-6 overflow-x-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Dokumen Mitra Wisata</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Pendaftaran Mitra Wisata</h1>
                            <p className="text-sm text-slate-500">Lengkapi data agar destinasi bisa live dan menerima booking.</p>
                        </div>
                        <StepBadge status={onboarding.verification_status} label={onboarding.verification_status} />
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap gap-3">
                        {stepTitles.map((title, index) => (
                            <button
                                key={title}
                                type="button"
                                onClick={() => setActiveStep(index + 1)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                    activeStep === index + 1
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {title}
                            </button>
                        ))}
                    </div>
                </section>

                {activeStep === 1 && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Data Akun Penanggung Jawab</h2>
                        <form
                            className="mt-6 grid gap-4 md:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                step1Form.post('/mitra/wisata/onboarding/step-1', {
                                    preserveScroll: true,
                                    preserveState: false,
                                    onSuccess: () => {
                                        showSuccess('Tersimpan', 'Data akun mitra disimpan.');
                                        router.reload({ only: ['onboarding'] });
                                    },
                                    onError: (errors) => showError('Gagal', getFirstError(errors)),
                                });
                            }}
                        >
                            <div className="grid gap-2">
                                <Label>Nama Lengkap Penanggung Jawab</Label>
                                <Input
                                    value={step1Form.data.responsible_name}
                                    onChange={(event) => step1Form.setData('responsible_name', event.target.value)}
                                    placeholder="Nama lengkap"
                                />
                                <InputError message={step1Form.errors.responsible_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Nomor HP</Label>
                                <Input
                                    value={step1Form.data.responsible_phone}
                                    onChange={(event) => step1Form.setData('responsible_phone', event.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                />
                                <InputError message={step1Form.errors.responsible_phone} />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Jabatan Penanggung Jawab</Label>
                                <Select
                                    value={step1Form.data.responsible_role}
                                    onValueChange={(value) => step1Form.setData('responsible_role', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jabatan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={step1Form.errors.responsible_role} />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">Simpan</Button>
                            </div>
                        </form>
                    </section>
                )}

                {activeStep === 2 && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Data Destinasi Wisata</h2>
                        <form
                            className="mt-6 grid gap-4 md:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                step2Form.post('/mitra/wisata/onboarding/step-2', {
                                    forceFormData: true,
                                    preserveScroll: true,
                                    preserveState: false,
                                    onSuccess: () => {
                                        showSuccess('Tersimpan', 'Data destinasi berhasil disimpan.');
                                        router.reload({ only: ['onboarding'] });
                                    },
                                    onError: (errors) => showError('Gagal', getFirstError(errors)),
                                });
                            }}
                        >
                            <div className="grid gap-2">
                                <Label>Nama Destinasi Wisata</Label>
                                <Input
                                    value={step2Form.data.destination_name}
                                    onChange={(event) => step2Form.setData('destination_name', event.target.value)}
                                    placeholder="Nama destinasi"
                                />
                                <InputError message={step2Form.errors.destination_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Jenis Wisata</Label>
                                <Select
                                    value={step2Form.data.destination_type}
                                    onValueChange={(value) => step2Form.setData('destination_type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {destinationTypes.map((item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={step2Form.errors.destination_type} />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Deskripsi Singkat</Label>
                                <textarea
                                    className="min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                    value={step2Form.data.description}
                                    onChange={(event) => step2Form.setData('description', event.target.value)}
                                    placeholder="Ceritakan tentang destinasi wisata"
                                />
                                <InputError message={step2Form.errors.description} />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Highlight / Daya Tarik Utama</Label>
                                <textarea
                                    className="min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                    value={step2Form.data.highlights}
                                    onChange={(event) => step2Form.setData('highlights', event.target.value)}
                                    placeholder="Contoh: spot foto, sunset, wahana air"
                                />
                                <InputError message={step2Form.errors.highlights} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Provinsi</Label>
                                <Select
                                    value={step2Form.data.province_code}
                                    onValueChange={(value) => step2Form.setData('province_code', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih provinsi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provinceItems}
                                    </SelectContent>
                                </Select>
                                <InputError message={step2Form.errors.province_code} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Kota/Kabupaten</Label>
                                <Select
                                    value={step2Form.data.city_code}
                                    onValueChange={(value) => step2Form.setData('city_code', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kota" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cityItems}
                                    </SelectContent>
                                </Select>
                                <InputError message={step2Form.errors.city_code} />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Alamat Lengkap</Label>
                                <Input
                                    value={step2Form.data.address_full}
                                    onChange={(event) => step2Form.setData('address_full', event.target.value)}
                                    placeholder="Alamat lengkap"
                                />
                                <InputError message={step2Form.errors.address_full} />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Titik Google Maps</Label>
                                <Input
                                    value={step2Form.data.maps_pin_url}
                                    onChange={(event) => step2Form.setData('maps_pin_url', event.target.value)}
                                    placeholder="Link Google Maps"
                                />
                                <InputError message={step2Form.errors.maps_pin_url} />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label>Hari Buka</Label>
                                <div className="flex flex-wrap gap-3">
                                    {dayOptions.map((day) => (
                                        <label key={day.id} className="inline-flex items-center gap-2 text-sm text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={step2Form.data.open_days.includes(day.id)}
                                                onChange={(event) => {
                                                    const checked = event.target.checked;
                                                    step2Form.setData(
                                                        'open_days',
                                                        checked
                                                            ? [...step2Form.data.open_days, day.id]
                                                            : step2Form.data.open_days.filter((item) => item !== day.id)
                                                    );
                                                }}
                                            />
                                            {day.label}
                                        </label>
                                    ))}
                                </div>
                                <InputError message={step2Form.errors.open_days} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Jam Buka</Label>
                                <Input
                                    value={step2Form.data.open_time}
                                    onChange={(event) => step2Form.setData('open_time', event.target.value)}
                                    placeholder="08:00"
                                />
                                <InputError message={step2Form.errors.open_time} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Jam Tutup</Label>
                                <Input
                                    value={step2Form.data.close_time}
                                    onChange={(event) => step2Form.setData('close_time', event.target.value)}
                                    placeholder="17:00"
                                />
                                <InputError message={step2Form.errors.close_time} />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Catatan Hari Libur Khusus</Label>
                                <Input
                                    value={step2Form.data.holiday_notes}
                                    onChange={(event) => step2Form.setData('holiday_notes', event.target.value)}
                                    placeholder="Contoh: tutup saat Idul Fitri"
                                />
                                <InputError message={step2Form.errors.holiday_notes} />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label>Fasilitas Wisata</Label>
                                <div className="flex flex-wrap gap-3">
                                    {facilityOptions.map((facility) => (
                                        <label key={facility.id} className="inline-flex items-center gap-2 text-sm text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={step2Form.data.facilities.includes(facility.id)}
                                                onChange={(event) => {
                                                    const checked = event.target.checked;
                                                    step2Form.setData(
                                                        'facilities',
                                                        checked
                                                            ? [...step2Form.data.facilities, facility.id]
                                                            : step2Form.data.facilities.filter((item) => item !== facility.id)
                                                    );
                                                }}
                                            />
                                            {facility.label}
                                        </label>
                                    ))}
                                </div>
                                <InputError message={step2Form.errors.facilities} />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label>Kontak Operasional</Label>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Input
                                        value={step2Form.data.contact_phone}
                                        onChange={(event) => step2Form.setData('contact_phone', event.target.value)}
                                        placeholder="Nomor petugas loket"
                                    />
                                    <Input
                                        value={step2Form.data.contact_hours}
                                        onChange={(event) => step2Form.setData('contact_hours', event.target.value)}
                                        placeholder="Jam bisa dihubungi"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3 md:col-span-2">
                                <FilePicker
                                    id="photo_gate_file"
                                    label="Foto Gerbang/Pintu Masuk"
                                    helper="Wajib, jpg/png"
                                    accept="image/*"
                                    fileName={step2Form.data.photo_gate_file?.name}
                                    previewUrl={filePreviews.gate ?? getPublicUrl(onboarding.photo_gate_path)}
                                    onChange={(file) => handleFileChange('gate', file, 'photo_gate_file')}
                                />
                                <FilePicker
                                    id="photo_area_file"
                                    label="Foto Area Utama"
                                    helper="Wajib, jpg/png"
                                    accept="image/*"
                                    fileName={step2Form.data.photo_area_file?.name}
                                    previewUrl={filePreviews.area ?? getPublicUrl(onboarding.photo_area_path)}
                                    onChange={(file) => handleFileChange('area', file, 'photo_area_file')}
                                />
                                <FilePicker
                                    id="photo_ticket_file"
                                    label="Foto Loket/Validasi"
                                    helper="Wajib, jpg/png"
                                    accept="image/*"
                                    fileName={step2Form.data.photo_ticket_file?.name}
                                    previewUrl={filePreviews.ticket ?? getPublicUrl(onboarding.photo_ticket_path)}
                                    onChange={(file) => handleFileChange('ticket', file, 'photo_ticket_file')}
                                />
                            </div>

                            <div className="md:col-span-2 flex justify-end">
                                <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">Simpan</Button>
                            </div>
                        </form>
                    </section>
                )}

                {activeStep === 3 && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Legalitas & Keuangan</h2>
                        <form
                            className="mt-6 grid gap-4 md:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                step3Form.post('/mitra/wisata/onboarding/step-3', {
                                    forceFormData: true,
                                    preserveScroll: true,
                                    preserveState: false,
                                    onSuccess: () => {
                                        showSuccess('Tersimpan', 'Legalitas & rekening tersimpan.');
                                        router.reload({ only: ['onboarding'] });
                                    },
                                    onError: (errors) => showError('Gagal', getFirstError(errors)),
                                });
                            }}
                        >
                            <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                                <FilePicker
                                    id="ktp_file"
                                    label="KTP Penanggung Jawab"
                                    helper="Wajib, jpg/png/pdf"
                                    accept="image/*,application/pdf"
                                    fileName={step3Form.data.ktp_file?.name}
                                    previewUrl={filePreviews.ktp ?? getPublicUrl(onboarding.ktp_path)}
                                    onChange={(file) => handleFileChange('ktp', file, 'ktp_file')}
                                />
                                <FilePicker
                                    id="selfie_ktp_file"
                                    label="Selfie + KTP"
                                    helper="Disarankan, jpg/png"
                                    accept="image/*"
                                    fileName={step3Form.data.selfie_ktp_file?.name}
                                    previewUrl={filePreviews.selfie ?? getPublicUrl(onboarding.selfie_ktp_path)}
                                    onChange={(file) => handleFileChange('selfie', file, 'selfie_ktp_file')}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Jenis Dokumen Legalitas</Label>
                                <Select
                                    value={step3Form.data.legal_doc_type}
                                    onValueChange={(value) => step3Form.setData('legal_doc_type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih dokumen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nib">NIB</SelectItem>
                                        <SelectItem value="sk_desa">SK Desa / BUMDes</SelectItem>
                                        <SelectItem value="surat_pokdarwis">Surat Pokdarwis</SelectItem>
                                        <SelectItem value="izin_wisata">Surat Izin Pengelolaan Wisata</SelectItem>
                                        <SelectItem value="dokumen_kawasan">Dokumen Pengelola Kawasan</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={step3Form.errors.legal_doc_type} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Nomor Dokumen</Label>
                                <Input
                                    value={step3Form.data.legal_doc_number}
                                    onChange={(event) => step3Form.setData('legal_doc_number', event.target.value)}
                                    placeholder="Nomor dokumen"
                                />
                                <InputError message={step3Form.errors.legal_doc_number} />
                            </div>
                            <div className="md:col-span-2">
                                <FilePicker
                                    id="legal_doc_file"
                                    label="Upload Dokumen Legalitas"
                                    helper="Wajib, jpg/png/pdf"
                                    accept="image/*,application/pdf"
                                    fileName={step3Form.data.legal_doc_file?.name}
                                    previewUrl={filePreviews.legal ?? getPublicUrl(onboarding.legal_doc_path)}
                                    onChange={(file) => handleFileChange('legal', file, 'legal_doc_file')}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Nama Bank</Label>
                                <Input
                                    value={step3Form.data.bank_name}
                                    onChange={(event) => step3Form.setData('bank_name', event.target.value)}
                                    placeholder="Contoh: BCA"
                                />
                                <InputError message={step3Form.errors.bank_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Nomor Rekening</Label>
                                <Input
                                    value={step3Form.data.bank_account_number}
                                    onChange={(event) => step3Form.setData('bank_account_number', event.target.value)}
                                    placeholder="Nomor rekening"
                                />
                                <InputError message={step3Form.errors.bank_account_number} />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Nama Pemilik Rekening</Label>
                                <Input
                                    value={step3Form.data.bank_account_name}
                                    onChange={(event) => step3Form.setData('bank_account_name', event.target.value)}
                                    placeholder="Nama pemilik rekening"
                                />
                                <InputError message={step3Form.errors.bank_account_name} />
                            </div>

                            <div className="md:col-span-2 flex justify-end">
                                <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">Simpan</Button>
                            </div>
                        </form>
                    </section>
                )}

                {onboarding.verification_status === 'draft' && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Kirim untuk Verifikasi</h3>
                                <p className="text-sm text-slate-500">
                                    Setelah semua data lengkap, kirim agar admin dapat memverifikasi.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                {isWisataVerificationReady && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            submitVerification();
                                        }}
                                        className="border-sky-200 text-sky-700 hover:bg-sky-50"
                                    >
                                        Kirim Verifikasi
                                    </Button>
                                )}
                            </div>
                        </div>
                        {!isWisataVerificationReady && (
                            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Checklist kelengkapan
                                </p>
                                <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                                    {wisataChecklist.map((item) => (
                                        <div key={item.label} className="flex items-center gap-2">
                                            {item.ok ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-rose-500" />
                                            )}
                                            <span>{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {status === 'verification-submitted' && (
                            <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                Data verifikasi berhasil dikirim.
                            </div>
                        )}
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
