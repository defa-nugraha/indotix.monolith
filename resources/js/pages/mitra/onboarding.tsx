import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import CommissionInfoCard, {
    type CommissionInfo,
} from '@/components/commission-info-card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Swal from 'sweetalert2';
import { CheckCircle2, XCircle } from 'lucide-react';

type CityOption = { id: string; label: string };

type Onboarding = {
    id: number;
    current_step: number;
    hotel_name: string | null;
    property_type: string | null;
    city_code: string | null;
    address_short: string | null;
    estimated_room_count: number | null;
    responsible_name: string | null;
    responsible_nik: string | null;
    responsible_role: string | null;
    ktp_path: string | null;
    selfie_ktp_path: string | null;
    legal_doc_type: string | null;
    legal_doc_number: string | null;
    legal_doc_path: string | null;
    photo_front_path: string | null;
    photo_lobby_path: string | null;
    photo_room_path: string | null;
    address_full: string | null;
    maps_pin_url: string | null;
    reception_phone: string | null;
    operational_hours: string | null;
    reservation_pic: string | null;
    verification_status: 'draft' | 'pending' | 'verified' | 'rejected';
    verification_reason: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    tax_npwp: string | null;
    tax_type: string | null;
    payout_status: 'draft' | 'pending' | 'verified' | 'rejected';
    payout_reason: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Dokumen Pendaftaran', href: '/mitra/onboarding' },
];

const stepTitles = [
    'Data Hotel Ringkas',
    'Verifikasi Hotel',
    'Setup Finansial',
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
        <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}
        >
            {label}
        </span>
    );
}

export default function MitraOnboarding({
    onboarding,
    cities,
    status,
    commissionInfo,
}: {
    onboarding: Onboarding;
    cities: CityOption[];
    status?: string;
    commissionInfo?: CommissionInfo | null;
}) {
    const { auth } = usePage<SharedData>().props;
    const [activeStep, setActiveStep] = useState(onboarding.current_step || 1);

    const step1Form = useForm({
        hotel_name: onboarding.hotel_name ?? '',
        property_type: onboarding.property_type ?? '',
        city_code: onboarding.city_code ?? '',
        address_short: onboarding.address_short ?? '',
        estimated_room_count: onboarding.estimated_room_count?.toString() ?? '',
    });

    const step2Form = useForm({
        responsible_name: onboarding.responsible_name ?? '',
        responsible_nik: onboarding.responsible_nik ?? '',
        responsible_role: onboarding.responsible_role ?? '',
        legal_doc_type: onboarding.legal_doc_type ?? '',
        legal_doc_number: onboarding.legal_doc_number ?? '',
        address_full: onboarding.address_full ?? '',
        maps_pin_url: onboarding.maps_pin_url ?? '',
        reception_phone: onboarding.reception_phone ?? '',
        operational_hours: onboarding.operational_hours ?? '',
        reservation_pic: onboarding.reservation_pic ?? '',
        ktp_file: null as File | null,
        selfie_ktp_file: null as File | null,
        legal_doc_file: null as File | null,
        photo_front_file: null as File | null,
        photo_lobby_file: null as File | null,
        photo_room_file: null as File | null,
    });

    const [filePreviews, setFilePreviews] = useState<{
        ktp?: string;
        selfie?: string;
        legal?: string;
        front?: string;
        lobby?: string;
        room?: string;
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

    const getPublicUrl = (path?: string | null) =>
        path ? `/storage/${path}` : null;

    const handleFileChange = (
        key: keyof typeof filePreviews,
        file: File | null,
        fieldName: keyof typeof step2Form.data,
    ) => {
        step2Form.setData(fieldName as never, file as never);
        if (!file) {
            setFilePreviews((prev) => ({ ...prev, [key]: undefined }));
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        setFilePreviews((prev) => ({ ...prev, [key]: previewUrl }));
    };

    const showSuccess = (title: string, text: string) => {
        Swal.fire({
            icon: 'success',
            title,
            text,
            confirmButtonText: 'OK',
        });
    };

    const showError = (title: string, text: string) => {
        Swal.fire({
            icon: 'error',
            title,
            text,
            confirmButtonText: 'OK',
        });
    };

    const submitVerification = () => {
        step1Form.patch('/mitra/onboarding/step-1', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () =>
                step2Form.post('/mitra/onboarding/step-2', {
                    preserveScroll: true,
                    forceFormData: true,
                    onSuccess: () =>
                        step2Form.post(
                            '/mitra/onboarding/submit-verification',
                            {
                                preserveScroll: true,
                                onSuccess: () =>
                                    showSuccess(
                                        'Terkirim',
                                        'Dokumen verifikasi dikirim untuk review.',
                                    ),
                                onError: (errors) =>
                                    showError(
                                        'Gagal mengirim',
                                        getFirstError(errors),
                                    ),
                            },
                        ),
                    onError: (errors) => {
                        showError('Gagal menyimpan', getFirstError(errors));
                    },
                }),
        });
    };

    const getFirstError = (errors: Record<string, string>): string => {
        const firstKey = Object.keys(errors)[0];
        return firstKey
            ? errors[firstKey]
            : 'Terjadi kesalahan. Silakan coba lagi.';
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
        const isPdf =
            fileName?.toLowerCase().endsWith('.pdf') ||
            previewUrl?.toLowerCase().includes('.pdf');

        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
                <input aria-label="Onboarding input"
                    id={id}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(event) =>
                        onChange(event.target.files?.[0] ?? null)
                    }
                />
                <label
                    htmlFor={id}
                    className="flex cursor-pointer flex-col items-center"
                >
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
                            <p className="text-sm font-semibold text-slate-900">
                                {label}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                {helper}
                            </p>
                            <span className="mt-4 inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
                                Pilih File
                            </span>
                        </>
                    )}
                </label>
                {!hasPreview && fileName && (
                    <p className="mt-2 text-xs font-medium text-slate-600">
                        File dipilih: {fileName}
                    </p>
                )}
            </div>
        );
    };

    const step3Form = useForm({
        bank_name: onboarding.bank_name ?? '',
        bank_account_number: onboarding.bank_account_number ?? '',
        bank_account_name: onboarding.bank_account_name ?? '',
        tax_npwp: onboarding.tax_npwp ?? '',
        tax_type: onboarding.tax_type ?? '',
    });

    const isFilled = (value?: string | number | null) => {
        if (typeof value === 'number') {
            return value > 0;
        }
        return Boolean(value && String(value).trim().length > 0);
    };

    const hasFile = (file?: File | null, path?: string | null) =>
        Boolean(file || path);

    const isHotelVerificationReady = useMemo(() => {
        const hotelName = step1Form.data.hotel_name || onboarding.hotel_name;
        const propertyType =
            step1Form.data.property_type || onboarding.property_type;
        const cityCode = step1Form.data.city_code || onboarding.city_code;
        const addressShort =
            step1Form.data.address_short || onboarding.address_short;
        const responsibleName =
            step2Form.data.responsible_name || onboarding.responsible_name;
        const responsibleNik =
            step2Form.data.responsible_nik || onboarding.responsible_nik;
        const responsibleRole =
            step2Form.data.responsible_role || onboarding.responsible_role;
        const addressFull =
            step2Form.data.address_full || onboarding.address_full;
        const mapsPin = step2Form.data.maps_pin_url || onboarding.maps_pin_url;
        const receptionPhone =
            step2Form.data.reception_phone || onboarding.reception_phone;
        const operationalHours =
            step2Form.data.operational_hours || onboarding.operational_hours;
        const reservationPic =
            step2Form.data.reservation_pic || onboarding.reservation_pic;

        return (
            isFilled(hotelName) &&
            isFilled(propertyType) &&
            isFilled(cityCode) &&
            isFilled(addressShort) &&
            isFilled(responsibleName) &&
            isFilled(responsibleNik) &&
            isFilled(responsibleRole) &&
            isFilled(addressFull) &&
            isFilled(mapsPin) &&
            isFilled(receptionPhone) &&
            isFilled(operationalHours) &&
            isFilled(reservationPic) &&
            hasFile(step2Form.data.ktp_file, onboarding.ktp_path) &&
            hasFile(
                step2Form.data.selfie_ktp_file,
                onboarding.selfie_ktp_path,
            ) &&
            hasFile(
                step2Form.data.photo_front_file,
                onboarding.photo_front_path,
            ) &&
            hasFile(
                step2Form.data.photo_lobby_file,
                onboarding.photo_lobby_path,
            ) &&
            hasFile(step2Form.data.photo_room_file, onboarding.photo_room_path)
        );
    }, [onboarding, step1Form.data, step2Form.data]);

    const hotelChecklist = useMemo(() => {
        const hotelName = step1Form.data.hotel_name || onboarding.hotel_name;
        const propertyType =
            step1Form.data.property_type || onboarding.property_type;
        const cityCode = step1Form.data.city_code || onboarding.city_code;
        const addressShort =
            step1Form.data.address_short || onboarding.address_short;
        const responsibleName =
            step2Form.data.responsible_name || onboarding.responsible_name;
        const responsibleNik =
            step2Form.data.responsible_nik || onboarding.responsible_nik;
        const responsibleRole =
            step2Form.data.responsible_role || onboarding.responsible_role;
        const addressFull =
            step2Form.data.address_full || onboarding.address_full;
        const mapsPin = step2Form.data.maps_pin_url || onboarding.maps_pin_url;
        const receptionPhone =
            step2Form.data.reception_phone || onboarding.reception_phone;
        const operationalHours =
            step2Form.data.operational_hours || onboarding.operational_hours;
        const reservationPic =
            step2Form.data.reservation_pic || onboarding.reservation_pic;

        return [
            { label: 'Nama hotel/properti', ok: isFilled(hotelName) },
            { label: 'Jenis properti', ok: isFilled(propertyType) },
            { label: 'Kota/Kabupaten', ok: isFilled(cityCode) },
            { label: 'Alamat singkat', ok: isFilled(addressShort) },
            { label: 'Nama penanggung jawab', ok: isFilled(responsibleName) },
            { label: 'NIK penanggung jawab', ok: isFilled(responsibleNik) },
            {
                label: 'Jabatan penanggung jawab',
                ok: isFilled(responsibleRole),
            },
            { label: 'Alamat lengkap', ok: isFilled(addressFull) },
            { label: 'Titik Google Maps', ok: isFilled(mapsPin) },
            { label: 'Nomor resepsionis', ok: isFilled(receptionPhone) },
            { label: 'Jam operasional', ok: isFilled(operationalHours) },
            { label: 'PIC reservasi', ok: isFilled(reservationPic) },
            {
                label: 'Upload KTP',
                ok: hasFile(step2Form.data.ktp_file, onboarding.ktp_path),
            },
            {
                label: 'Upload selfie + KTP',
                ok: hasFile(
                    step2Form.data.selfie_ktp_file,
                    onboarding.selfie_ktp_path,
                ),
            },
            {
                label: 'Foto tampak depan',
                ok: hasFile(
                    step2Form.data.photo_front_file,
                    onboarding.photo_front_path,
                ),
            },
            {
                label: 'Foto resepsionis/pintu masuk',
                ok: hasFile(
                    step2Form.data.photo_lobby_file,
                    onboarding.photo_lobby_path,
                ),
            },
            {
                label: 'Foto salah satu kamar',
                ok: hasFile(
                    step2Form.data.photo_room_file,
                    onboarding.photo_room_path,
                ),
            },
        ];
    }, [onboarding, step1Form.data, step2Form.data]);

    const step1AutoSave = useMemo(
        () => ({
            hotel_name: step1Form.data.hotel_name,
            property_type: step1Form.data.property_type,
            city_code: step1Form.data.city_code,
            address_short: step1Form.data.address_short,
            estimated_room_count: step1Form.data.estimated_room_count,
        }),
        [step1Form.data],
    );

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            if (activeStep === 1) {
                step1Form.patch('/mitra/onboarding/step-1', {
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        }, 900);

        return () => window.clearTimeout(timeout);
    }, [step1AutoSave, activeStep]);

    const step3AutoSave = useMemo(
        () => ({
            bank_name: step3Form.data.bank_name,
            bank_account_number: step3Form.data.bank_account_number,
            bank_account_name: step3Form.data.bank_account_name,
            tax_npwp: step3Form.data.tax_npwp,
            tax_type: step3Form.data.tax_type,
        }),
        [step3Form.data],
    );

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            if (activeStep === 3) {
                step3Form.patch('/mitra/onboarding/step-3', {
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        }, 900);

        return () => window.clearTimeout(timeout);
    }, [step3AutoSave, activeStep]);

    const isVerificationPending = onboarding.verification_status === 'pending';
    const isVerificationVerified =
        onboarding.verification_status === 'verified';
    const isPayoutPending = onboarding.payout_status === 'pending';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dokumen Pendaftaran Mitra">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-x-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <div className="pointer-events-none absolute top-12 -left-32 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
                <div className="pointer-events-none absolute top-0 right-[-10%] h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Dokumen Pendaftaran
                            </p>
                            <h1 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-slate-900">
                                Halo, {auth?.user?.name}
                            </h1>
                            <p className="text-sm text-slate-600">
                                Lengkapi tahapan agar hotel dapat tampil dan
                                menerima booking.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <StepBadge
                                status={onboarding.verification_status}
                                label={`Verifikasi: ${onboarding.verification_status}`}
                            />
                            <StepBadge
                                status={onboarding.payout_status}
                                label={`Payout: ${onboarding.payout_status}`}
                            />
                        </div>
                    </div>

                    {status === 'onboarding-saved' && (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            Draft tersimpan otomatis.
                        </div>
                    )}
                    {status === 'verification-submitted' && (
                        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            Dokumen verifikasi sudah dikirim. Menunggu review
                            admin.
                        </div>
                    )}
                    {status === 'payout-submitted' && (
                        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            Data rekening dikirim. Menunggu validasi.
                        </div>
                    )}
                    {onboarding.verification_status === 'rejected' &&
                        onboarding.verification_reason && (
                            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                Verifikasi ditolak:{' '}
                                {onboarding.verification_reason}
                            </div>
                        )}
                    {onboarding.payout_status === 'rejected' &&
                        onboarding.payout_reason && (
                            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                Payout ditolak: {onboarding.payout_reason}
                            </div>
                        )}
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-3">
                        {stepTitles.map((title, index) => {
                            const step = index + 1;
                            const isActive = activeStep === step;
                            return (
                                <button
                                    key={title}
                                    type="button"
                                    onClick={() => setActiveStep(step)}
                                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                                        isActive
                                            ? 'border-sky-200 bg-sky-50'
                                            : 'border-slate-100 bg-white hover:border-sky-100'
                                    }`}
                                >
                                    <p className="text-xs font-semibold text-slate-400 uppercase">
                                        Tahap {step}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {title}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {activeStep === 1 && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Data Hotel (Ringkas)
                        </h2>
                        <p className="text-sm text-slate-500">
                            Isi ringkas agar akun Anda bisa mulai ditinjau.
                        </p>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="hotel_name">
                                    Nama hotel/properti
                                </Label>
                                <Input
                                    id="hotel_name"
                                    value={step1Form.data.hotel_name}
                                    onChange={(event) =>
                                        step1Form.setData(
                                            'hotel_name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Contoh: Hotel Indotix"
                                />
                                <InputError
                                    message={step1Form.errors.hotel_name}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Jenis properti</Label>
                                <Select
                                    value={step1Form.data.property_type}
                                    onValueChange={(value) =>
                                        step1Form.setData(
                                            'property_type',
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jenis properti" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hotel">
                                            Hotel
                                        </SelectItem>
                                        <SelectItem value="guest_house">
                                            Guest House
                                        </SelectItem>
                                        <SelectItem value="homestay">
                                            Homestay
                                        </SelectItem>
                                        <SelectItem value="kost_harian">
                                            Kost Harian
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={step1Form.errors.property_type}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Kota</Label>
                                <Select
                                    value={step1Form.data.city_code}
                                    onValueChange={(value) =>
                                        step1Form.setData('city_code', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kota" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.map((city) => (
                                            <SelectItem
                                                key={city.id}
                                                value={String(city.id)}
                                            >
                                                {city.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={step1Form.errors.city_code}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address_short">
                                    Alamat singkat
                                </Label>
                                <Input
                                    id="address_short"
                                    value={step1Form.data.address_short}
                                    onChange={(event) =>
                                        step1Form.setData(
                                            'address_short',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Contoh: Jl. Merdeka No. 10"
                                />
                                <InputError
                                    message={step1Form.errors.address_short}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="estimated_room_count">
                                    Jumlah kamar (perkiraan)
                                </Label>
                                <Input
                                    id="estimated_room_count"
                                    type="number"
                                    min={0}
                                    value={step1Form.data.estimated_room_count}
                                    onChange={(event) =>
                                        step1Form.setData(
                                            'estimated_room_count',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Contoh: 24"
                                />
                                <InputError
                                    message={
                                        step1Form.errors.estimated_room_count
                                    }
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button
                                type="button"
                                onClick={() =>
                                    step1Form.patch(
                                        '/mitra/onboarding/step-1',
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setActiveStep(2);
                                                showSuccess(
                                                    'Berhasil',
                                                    'Data tahap 1 tersimpan.',
                                                );
                                            },
                                            onError: (errors) => {
                                                showError(
                                                    'Gagal menyimpan',
                                                    getFirstError(errors),
                                                );
                                            },
                                        },
                                    )
                                }
                            >
                                Simpan draft
                            </Button>
                        </div>
                    </section>
                )}

                {activeStep === 2 && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Verifikasi Hotel
                        </h2>
                        <p className="text-sm text-slate-500">
                            Lengkapi dokumen agar hotel bisa live.
                        </p>
                        <div className="mt-4">
                            <CommissionInfoCard info={commissionInfo} />
                        </div>

                        <form
                            onSubmit={(event) => event.preventDefault()}
                            className="mt-6 grid gap-6"
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Nama sesuai KTP</Label>
                                    <Input
                                        value={step2Form.data.responsible_name}
                                        onChange={(event) =>
                                            step2Form.setData(
                                                'responsible_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            step2Form.errors.responsible_name
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>NIK</Label>
                                    <Input
                                        value={step2Form.data.responsible_nik}
                                        onChange={(event) =>
                                            step2Form.setData(
                                                'responsible_nik',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            step2Form.errors.responsible_nik
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Jabatan</Label>
                                    <Select
                                        value={step2Form.data.responsible_role}
                                        onValueChange={(value) =>
                                            step2Form.setData(
                                                'responsible_role',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih jabatan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="owner">
                                                Owner
                                            </SelectItem>
                                            <SelectItem value="manager">
                                                Manager
                                            </SelectItem>
                                            <SelectItem value="admin">
                                                Admin
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={
                                            step2Form.errors.responsible_role
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Upload KTP</Label>
                                    <FilePicker
                                        id="ktp_file"
                                        label="Select File here"
                                        helper="Files Supported: PDF, JPG, PNG"
                                        accept="image/*,.pdf"
                                        fileName={step2Form.data.ktp_file?.name}
                                        previewUrl={
                                            filePreviews.ktp ??
                                            getPublicUrl(onboarding.ktp_path)
                                        }
                                        onChange={(file) =>
                                            handleFileChange(
                                                'ktp',
                                                file,
                                                'ktp_file',
                                            )
                                        }
                                    />
                                    <InputError
                                        message={step2Form.errors.ktp_file}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Selfie + KTP (wajib)</Label>
                                    <FilePicker
                                        id="selfie_ktp_file"
                                        label="Select File here"
                                        helper="Files Supported: JPG, PNG"
                                        accept="image/*"
                                        fileName={
                                            step2Form.data.selfie_ktp_file?.name
                                        }
                                        previewUrl={
                                            filePreviews.selfie ??
                                            getPublicUrl(
                                                onboarding.selfie_ktp_path,
                                            )
                                        }
                                        onChange={(file) =>
                                            handleFileChange(
                                                'selfie',
                                                file,
                                                'selfie_ktp_file',
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            step2Form.errors.selfie_ktp_file
                                        }
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                    Legalitas Usaha (pilih salah satu)
                                </p>
                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Jenis dokumen</Label>
                                        <Select
                                            value={
                                                step2Form.data.legal_doc_type
                                            }
                                            onValueChange={(value) =>
                                                step2Form.setData(
                                                    'legal_doc_type',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih dokumen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="nib">
                                                    NIB
                                                </SelectItem>
                                                <SelectItem value="siup">
                                                    SIUP
                                                </SelectItem>
                                                <SelectItem value="tdp">
                                                    TDP
                                                </SelectItem>
                                                <SelectItem value="surat_izin_daerah">
                                                    Surat izin daerah
                                                </SelectItem>
                                                <SelectItem value="surat_rt_rw">
                                                    Surat RT/RW
                                                </SelectItem>
                                                <SelectItem value="akta_pendirian">
                                                    Akta pendirian
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                step2Form.errors.legal_doc_type
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Nomor dokumen</Label>
                                        <Input
                                            value={
                                                step2Form.data.legal_doc_number
                                            }
                                            onChange={(event) =>
                                                step2Form.setData(
                                                    'legal_doc_number',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                step2Form.errors
                                                    .legal_doc_number
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Upload dokumen</Label>
                                        <FilePicker
                                            id="legal_doc_file"
                                            label="Select File here"
                                            helper="Files Supported: PDF, JPG, PNG"
                                            accept="image/*,.pdf"
                                            fileName={
                                                step2Form.data.legal_doc_file
                                                    ?.name
                                            }
                                            previewUrl={
                                                filePreviews.legal ??
                                                getPublicUrl(
                                                    onboarding.legal_doc_path,
                                                )
                                            }
                                            onChange={(file) =>
                                                handleFileChange(
                                                    'legal',
                                                    file,
                                                    'legal_doc_file',
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                step2Form.errors.legal_doc_file
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                    Bukti Properti Nyata
                                </p>
                                <div className="mt-4 grid gap-4 md:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label>Foto tampak depan</Label>
                                        <FilePicker
                                            id="photo_front_file"
                                            label="Select File here"
                                            helper="Files Supported: JPG, PNG"
                                            accept="image/*"
                                            fileName={
                                                step2Form.data.photo_front_file
                                                    ?.name
                                            }
                                            previewUrl={
                                                filePreviews.front ??
                                                getPublicUrl(
                                                    onboarding.photo_front_path,
                                                )
                                            }
                                            onChange={(file) =>
                                                handleFileChange(
                                                    'front',
                                                    file,
                                                    'photo_front_file',
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                step2Form.errors
                                                    .photo_front_file
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Foto resepsionis/pintu</Label>
                                        <FilePicker
                                            id="photo_lobby_file"
                                            label="Select File here"
                                            helper="Files Supported: JPG, PNG"
                                            accept="image/*"
                                            fileName={
                                                step2Form.data.photo_lobby_file
                                                    ?.name
                                            }
                                            previewUrl={
                                                filePreviews.lobby ??
                                                getPublicUrl(
                                                    onboarding.photo_lobby_path,
                                                )
                                            }
                                            onChange={(file) =>
                                                handleFileChange(
                                                    'lobby',
                                                    file,
                                                    'photo_lobby_file',
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                step2Form.errors
                                                    .photo_lobby_file
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Foto salah satu kamar</Label>
                                        <FilePicker
                                            id="photo_room_file"
                                            label="Select File here"
                                            helper="Files Supported: JPG, PNG"
                                            accept="image/*"
                                            fileName={
                                                step2Form.data.photo_room_file
                                                    ?.name
                                            }
                                            previewUrl={
                                                filePreviews.room ??
                                                getPublicUrl(
                                                    onboarding.photo_room_path,
                                                )
                                            }
                                            onChange={(file) =>
                                                handleFileChange(
                                                    'room',
                                                    file,
                                                    'photo_room_file',
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                step2Form.errors.photo_room_file
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2 md:col-span-2">
                                    <Label>Alamat lengkap</Label>
                                    <Input
                                        value={step2Form.data.address_full}
                                        onChange={(event) =>
                                            step2Form.setData(
                                                'address_full',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Alamat lengkap sesuai lokasi"
                                    />
                                    <InputError
                                        message={step2Form.errors.address_full}
                                    />
                                </div>
                                <div className="grid gap-2 md:col-span-2">
                                    <Label>Pin Google Maps</Label>
                                    <Input
                                        value={step2Form.data.maps_pin_url}
                                        onChange={(event) =>
                                            step2Form.setData(
                                                'maps_pin_url',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Tempel link Google Maps"
                                    />
                                    <InputError
                                        message={step2Form.errors.maps_pin_url}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Nomor resepsionis</Label>
                                    <Input
                                        value={step2Form.data.reception_phone}
                                        onChange={(event) =>
                                            step2Form.setData(
                                                'reception_phone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            step2Form.errors.reception_phone
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Jam operasional</Label>
                                    <Input
                                        value={step2Form.data.operational_hours}
                                        onChange={(event) =>
                                            step2Form.setData(
                                                'operational_hours',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Contoh: 08:00 - 22:00"
                                    />
                                    <InputError
                                        message={
                                            step2Form.errors.operational_hours
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>PIC reservasi</Label>
                                    <Input
                                        value={step2Form.data.reservation_pic}
                                        onChange={(event) =>
                                            step2Form.setData(
                                                'reservation_pic',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            step2Form.errors.reservation_pic
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        step2Form.post(
                                            '/mitra/onboarding/step-2',
                                            {
                                                preserveScroll: true,
                                                forceFormData: true,
                                                onSuccess: () => {
                                                    setActiveStep(3);
                                                    showSuccess(
                                                        'Berhasil',
                                                        'Dokumen berhasil disimpan.',
                                                    );
                                                },
                                                onError: (errors) => {
                                                    showError(
                                                        'Gagal menyimpan',
                                                        getFirstError(errors),
                                                    );
                                                },
                                            },
                                        )
                                    }
                                >
                                    Simpan dokumen
                                </Button>
                                {onboarding.verification_status === 'draft' &&
                                    isHotelVerificationReady && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="border-sky-200 text-slate-700 hover:bg-sky-50"
                                            onClick={submitVerification}
                                        >
                                            Kirim untuk review
                                        </Button>
                                    )}
                            </div>
                            {onboarding.verification_status === 'draft' &&
                                !isHotelVerificationReady && (
                                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                        <p className="text-xs font-semibold text-slate-400 uppercase">
                                            Checklist kelengkapan
                                        </p>
                                        <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                                            {hotelChecklist.map((item) => (
                                                <div
                                                    key={item.label}
                                                    className="flex items-center gap-2"
                                                >
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
                        </form>
                    </section>
                )}

                {activeStep === 3 && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Setup Finansial
                        </h2>
                        <p className="text-sm text-slate-500">
                            Data rekening agar payout berjalan lancar.
                        </p>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Nama bank</Label>
                                <Input
                                    value={step3Form.data.bank_name}
                                    onChange={(event) =>
                                        step3Form.setData(
                                            'bank_name',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={step3Form.errors.bank_name}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Nomor rekening</Label>
                                <Input
                                    value={step3Form.data.bank_account_number}
                                    onChange={(event) =>
                                        step3Form.setData(
                                            'bank_account_number',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={
                                        step3Form.errors.bank_account_number
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Nama pemilik rekening</Label>
                                <Input
                                    value={step3Form.data.bank_account_name}
                                    onChange={(event) =>
                                        step3Form.setData(
                                            'bank_account_name',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={step3Form.errors.bank_account_name}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>NPWP (opsional)</Label>
                                <Input
                                    value={step3Form.data.tax_npwp}
                                    onChange={(event) =>
                                        step3Form.setData(
                                            'tax_npwp',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={step3Form.errors.tax_npwp}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tipe pajak (opsional)</Label>
                                <Select
                                    value={step3Form.data.tax_type}
                                    onValueChange={(value) =>
                                        step3Form.setData('tax_type', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih tipe pajak" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pribadi">
                                            Pribadi
                                        </SelectItem>
                                        <SelectItem value="badan">
                                            Badan
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={step3Form.errors.tax_type}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button
                                type="button"
                                onClick={() =>
                                    step3Form.patch(
                                        '/mitra/onboarding/step-3',
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setActiveStep(3);
                                                showSuccess(
                                                    'Berhasil',
                                                    'Data rekening tersimpan.',
                                                );
                                            },
                                            onError: (errors) => {
                                                showError(
                                                    'Gagal menyimpan',
                                                    getFirstError(errors),
                                                );
                                            },
                                        },
                                    )
                                }
                            >
                                Simpan draft
                            </Button>
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
