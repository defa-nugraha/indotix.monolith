import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Dokumen Pendaftaran Event', href: '/mitra/event/onboarding' },
];

const stepTitles = [
    'Akun Penanggung Jawab',
    'Data EO & Legalitas',
    'Identitas Personal',
    'Rekening Payout',
];

type Onboarding = {
    id: number;
    current_step: number;
    responsible_name: string | null;
    responsible_phone: string | null;
    responsible_role: string | null;
    eo_name: string | null;
    organizer_type: string | null;
    founded_year: number | null;
    eo_description: string | null;
    legal_doc_type: string | null;
    legal_doc_number: string | null;
    legal_doc_path: string | null;
    ktp_path: string | null;
    selfie_ktp_path: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    bank_account_relation: string | null;
    operational_phone: string | null;
    operational_email: string | null;
    operational_hours: string | null;
    verification_status: 'draft' | 'pending' | 'verified' | 'rejected';
    verification_reason: string | null;
};

const roleOptions = [
    { id: 'owner', label: 'Owner' },
    { id: 'project_manager', label: 'Project Manager' },
    { id: 'ketua_panitia', label: 'Ketua Panitia' },
    { id: 'admin_eo', label: 'Admin EO' },
];

const organizerOptions = [
    { id: 'eo_profesional', label: 'EO Profesional' },
    { id: 'komunitas', label: 'Komunitas' },
    { id: 'kampus', label: 'Kampus' },
    { id: 'individu', label: 'Individu' },
];

const legalDocOptions = [
    { id: 'nib_siup_akta', label: 'NIB / SIUP / Akta Usaha' },
    { id: 'surat_eo_komunitas', label: 'Surat Keterangan EO / Komunitas' },
    { id: 'surat_kampus_ukm', label: 'Surat Kampus / UKM' },
    { id: 'surat_pernyataan', label: 'Surat Pernyataan Penyelenggara Event' },
];

const bankRelationOptions = [
    { id: 'pribadi', label: 'Pribadi' },
    { id: 'organisasi', label: 'Organisasi' },
    { id: 'perusahaan', label: 'Perusahaan' },
];

export default function MitraEventOnboarding({
    onboarding,
    status,
    commissionInfo,
}: {
    onboarding: Onboarding;
    status?: string;
    commissionInfo?: CommissionInfo | null;
}) {
    const [activeStep, setActiveStep] = useState(onboarding.current_step || 1);

    const step1Form = useForm({
        responsible_name: onboarding.responsible_name ?? '',
        responsible_phone: onboarding.responsible_phone ?? '',
        responsible_role: onboarding.responsible_role ?? '',
    });

    const step2Form = useForm({
        eo_name: onboarding.eo_name ?? '',
        organizer_type: onboarding.organizer_type ?? '',
        founded_year: onboarding.founded_year
            ? String(onboarding.founded_year)
            : '',
        eo_description: onboarding.eo_description ?? '',
        legal_doc_type: onboarding.legal_doc_type ?? '',
        legal_doc_number: onboarding.legal_doc_number ?? '',
        operational_phone: onboarding.operational_phone ?? '',
        operational_email: onboarding.operational_email ?? '',
        operational_hours: onboarding.operational_hours ?? '',
        legal_doc_file: null as File | null,
    });

    const step3Form = useForm({
        ktp_file: null as File | null,
        selfie_ktp_file: null as File | null,
    });

    const step4Form = useForm({
        bank_name: onboarding.bank_name ?? '',
        bank_account_number: onboarding.bank_account_number ?? '',
        bank_account_name: onboarding.bank_account_name ?? '',
        bank_account_relation: onboarding.bank_account_relation ?? '',
    });

    const [filePreviews, setFilePreviews] = useState<{
        legal?: string;
        ktp?: string;
        selfie?: string;
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
                <input aria-label="Event Onboarding input"
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

    const handleFileChange = (
        key: keyof typeof filePreviews,
        file: File | null,
        fieldName: keyof typeof step2Form.data | keyof typeof step3Form.data,
    ) => {
        if (fieldName in step2Form.data) {
            step2Form.setData(
                fieldName as keyof typeof step2Form.data,
                file as never,
            );
        } else {
            step3Form.setData(
                fieldName as keyof typeof step3Form.data,
                file as never,
            );
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
        return firstKey
            ? errors[firstKey]
            : 'Terjadi kesalahan. Silakan coba lagi.';
    };

    const submitVerification = () => {
        step1Form.post('/mitra/event/onboarding/step-1', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () =>
                step2Form.post('/mitra/event/onboarding/step-2', {
                    preserveScroll: true,
                    forceFormData: true,
                    onSuccess: () =>
                        step3Form.post('/mitra/event/onboarding/step-3', {
                            preserveScroll: true,
                            forceFormData: true,
                            onSuccess: () =>
                                step4Form.post(
                                    '/mitra/event/onboarding/step-4',
                                    {
                                        preserveScroll: true,
                                        onSuccess: () =>
                                            router.post(
                                                '/mitra/event/onboarding/submit-verification',
                                                {},
                                                {
                                                    onSuccess: () => {
                                                        showSuccess(
                                                            'Terkirim',
                                                            'Dokumen verifikasi dikirim untuk review.',
                                                        );
                                                        router.reload({
                                                            only: [
                                                                'onboarding',
                                                            ],
                                                        });
                                                    },
                                                    onError: (errors) =>
                                                        showError(
                                                            'Gagal mengirim',
                                                            getFirstError(
                                                                errors,
                                                            ),
                                                        ),
                                                },
                                            ),
                                        onError: (errors) =>
                                            showError(
                                                'Gagal menyimpan',
                                                getFirstError(errors),
                                            ),
                                    },
                                ),
                            onError: (errors) =>
                                showError(
                                    'Gagal menyimpan',
                                    getFirstError(errors),
                                ),
                        }),
                    onError: (errors) =>
                        showError('Gagal menyimpan', getFirstError(errors)),
                }),
            onError: (errors) =>
                showError('Gagal menyimpan', getFirstError(errors)),
        });
    };

    const isFilled = (value?: string | number | null) => {
        if (typeof value === 'number') {
            return value > 0;
        }
        return Boolean(value && String(value).trim().length > 0);
    };

    const hasFile = (file?: File | null, path?: string | null) =>
        Boolean(file || path);

    const eventChecklist = [
        {
            label: 'Nama penanggung jawab',
            ok:
                isFilled(onboarding.responsible_name) ||
                isFilled(step1Form.data.responsible_name),
        },
        {
            label: 'Nomor HP penanggung jawab',
            ok:
                isFilled(onboarding.responsible_phone) ||
                isFilled(step1Form.data.responsible_phone),
        },
        {
            label: 'Jabatan penanggung jawab',
            ok:
                isFilled(onboarding.responsible_role) ||
                isFilled(step1Form.data.responsible_role),
        },
        {
            label: 'Nama EO/Organisasi',
            ok:
                isFilled(onboarding.eo_name) ||
                isFilled(step2Form.data.eo_name),
        },
        {
            label: 'Jenis penyelenggara',
            ok:
                isFilled(onboarding.organizer_type) ||
                isFilled(step2Form.data.organizer_type),
        },
        {
            label: 'Dokumen legalitas',
            ok: hasFile(
                step2Form.data.legal_doc_file,
                onboarding.legal_doc_path,
            ),
        },
        {
            label: 'Nomor dokumen legal',
            ok:
                isFilled(onboarding.legal_doc_number) ||
                isFilled(step2Form.data.legal_doc_number),
        },
        {
            label: 'Jenis dokumen legal',
            ok:
                isFilled(onboarding.legal_doc_type) ||
                isFilled(step2Form.data.legal_doc_type),
        },
        {
            label: 'KTP penanggung jawab',
            ok: hasFile(step3Form.data.ktp_file, onboarding.ktp_path),
        },
        {
            label: 'Nama bank',
            ok:
                isFilled(onboarding.bank_name) ||
                isFilled(step4Form.data.bank_name),
        },
        {
            label: 'Nomor rekening',
            ok:
                isFilled(onboarding.bank_account_number) ||
                isFilled(step4Form.data.bank_account_number),
        },
        {
            label: 'Nama pemilik rekening',
            ok:
                isFilled(onboarding.bank_account_name) ||
                isFilled(step4Form.data.bank_account_name),
        },
        {
            label: 'Hubungan rekening',
            ok:
                isFilled(onboarding.bank_account_relation) ||
                isFilled(step4Form.data.bank_account_relation),
        },
        {
            label: 'Nomor PIC operasional',
            ok:
                isFilled(onboarding.operational_phone) ||
                isFilled(step2Form.data.operational_phone),
        },
        {
            label: 'Email support EO',
            ok:
                isFilled(onboarding.operational_email) ||
                isFilled(step2Form.data.operational_email),
        },
        {
            label: 'Jam operasional',
            ok:
                isFilled(onboarding.operational_hours) ||
                isFilled(step2Form.data.operational_hours),
        },
    ];

    const isEventVerificationReady = eventChecklist.every((item) => item.ok);

    useEffect(() => {
        if (status === 'onboarding-saved') {
            showSuccess('Tersimpan', 'Data pendaftaran berhasil disimpan.');
        }
    }, [status]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dokumen Pendaftaran Event">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-x-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Pendaftaran Mitra Event
                            </p>
                            <h1 className="font-['Space_Grotesk'] text-2xl font-semibold text-slate-900">
                                Lengkapi data EO sebelum membuat event
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Isi data secara bertahap agar proses verifikasi
                                lebih cepat.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {stepTitles.map((title, index) => (
                                <Button
                                    key={title}
                                    type="button"
                                    variant={
                                        activeStep === index + 1
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className={
                                        activeStep === index + 1
                                            ? 'bg-sky-600 text-white'
                                            : ''
                                    }
                                    onClick={() => setActiveStep(index + 1)}
                                >
                                    {title}
                                </Button>
                            ))}
                        </div>
                    </div>
                </section>

                {activeStep === 1 && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Identitas Penanggung Jawab
                        </h2>
                        <p className="text-sm text-slate-500">
                            Informasi ini untuk memastikan siapa yang
                            bertanggung jawab atas event.
                        </p>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                step1Form.post(
                                    '/mitra/event/onboarding/step-1',
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => setActiveStep(2),
                                        onError: (errors) =>
                                            showError(
                                                'Gagal menyimpan',
                                                getFirstError(errors),
                                            ),
                                    },
                                );
                            }}
                            className="mt-6 grid gap-4 md:grid-cols-2"
                        >
                            <div className="grid gap-2">
                                <Label>Nama lengkap penanggung jawab</Label>
                                <Input
                                    value={step1Form.data.responsible_name}
                                    onChange={(event) =>
                                        step1Form.setData(
                                            'responsible_name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Nama penanggung jawab"
                                />
                                <InputError
                                    message={step1Form.errors.responsible_name}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Nomor HP</Label>
                                <Input
                                    value={step1Form.data.responsible_phone}
                                    onChange={(event) =>
                                        step1Form.setData(
                                            'responsible_phone',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="08xxxxxxxxxx"
                                />
                                <InputError
                                    message={step1Form.errors.responsible_phone}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Jabatan</Label>
                                <Select
                                    value={step1Form.data.responsible_role}
                                    onValueChange={(value) =>
                                        step1Form.setData(
                                            'responsible_role',
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jabatan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((option) => (
                                            <SelectItem
                                                key={option.id}
                                                value={option.id}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={step1Form.errors.responsible_role}
                                />
                            </div>
                            <div className="flex justify-end md:col-span-2">
                                <Button
                                    type="submit"
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                >
                                    Simpan
                                </Button>
                            </div>
                        </form>
                    </section>
                )}

                {activeStep === 2 && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Data EO & Legalitas
                        </h2>
                        <p className="text-sm text-slate-500">
                            Lengkapi informasi organisasi serta dokumen legal
                            minimal 1 bukti.
                        </p>
                        <div className="mt-4">
                            <CommissionInfoCard info={commissionInfo} />
                        </div>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                step2Form.post(
                                    '/mitra/event/onboarding/step-2',
                                    {
                                        preserveScroll: true,
                                        forceFormData: true,
                                        onSuccess: () => setActiveStep(3),
                                        onError: (errors) =>
                                            showError(
                                                'Gagal menyimpan',
                                                getFirstError(errors),
                                            ),
                                    },
                                );
                            }}
                            className="mt-6 grid gap-4 md:grid-cols-2"
                        >
                            <div className="grid gap-2">
                                <Label>Nama EO / Organisasi</Label>
                                <Input
                                    value={step2Form.data.eo_name}
                                    onChange={(event) =>
                                        step2Form.setData(
                                            'eo_name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Nama EO"
                                />
                                <InputError
                                    message={step2Form.errors.eo_name}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Jenis penyelenggara</Label>
                                <Select
                                    value={step2Form.data.organizer_type}
                                    onValueChange={(value) =>
                                        step2Form.setData(
                                            'organizer_type',
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jenis penyelenggara" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizerOptions.map((option) => (
                                            <SelectItem
                                                key={option.id}
                                                value={option.id}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={step2Form.errors.organizer_type}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tahun berdiri (opsional)</Label>
                                <Input
                                    value={step2Form.data.founded_year}
                                    onChange={(event) =>
                                        step2Form.setData(
                                            'founded_year',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="2010"
                                />
                                <InputError
                                    message={step2Form.errors.founded_year}
                                />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Deskripsi singkat EO</Label>
                                <Input
                                    value={step2Form.data.eo_description}
                                    onChange={(event) =>
                                        step2Form.setData(
                                            'eo_description',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Ceritakan EO kamu secara singkat"
                                />
                                <InputError
                                    message={step2Form.errors.eo_description}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Jenis dokumen legal</Label>
                                <Select
                                    value={step2Form.data.legal_doc_type}
                                    onValueChange={(value) =>
                                        step2Form.setData(
                                            'legal_doc_type',
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih dokumen legal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {legalDocOptions.map((option) => (
                                            <SelectItem
                                                key={option.id}
                                                value={option.id}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={step2Form.errors.legal_doc_type}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Nomor dokumen</Label>
                                <Input
                                    value={step2Form.data.legal_doc_number}
                                    onChange={(event) =>
                                        step2Form.setData(
                                            'legal_doc_number',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Nomor dokumen"
                                />
                                <InputError
                                    message={step2Form.errors.legal_doc_number}
                                />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>
                                    Upload dokumen legal (PDF/JPG/PNG)
                                </Label>
                                <FilePicker
                                    id="legal_doc_file"
                                    label="Select File here"
                                    helper="Files Supported: PDF, JPG, PNG"
                                    accept="image/*,.pdf"
                                    fileName={
                                        step2Form.data.legal_doc_file?.name
                                    }
                                    previewUrl={
                                        filePreviews.legal ??
                                        getPublicUrl(onboarding.legal_doc_path)
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
                                    message={step2Form.errors.legal_doc_file}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Nomor PIC operasional</Label>
                                <Input
                                    value={step2Form.data.operational_phone}
                                    onChange={(event) =>
                                        step2Form.setData(
                                            'operational_phone',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="08xxxxxxxxxx"
                                />
                                <InputError
                                    message={step2Form.errors.operational_phone}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Email support EO</Label>
                                <Input
                                    value={step2Form.data.operational_email}
                                    onChange={(event) =>
                                        step2Form.setData(
                                            'operational_email',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="support@email.com"
                                />
                                <InputError
                                    message={step2Form.errors.operational_email}
                                />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Jam bisa dihubungi</Label>
                                <Input
                                    value={step2Form.data.operational_hours}
                                    onChange={(event) =>
                                        step2Form.setData(
                                            'operational_hours',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="09.00 - 21.00 WIB"
                                />
                                <InputError
                                    message={step2Form.errors.operational_hours}
                                />
                            </div>

                            <div className="flex justify-end md:col-span-2">
                                <Button
                                    type="submit"
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                >
                                    Simpan
                                </Button>
                            </div>
                        </form>
                    </section>
                )}

                {activeStep === 3 && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Identitas Personal
                        </h2>
                        <p className="text-sm text-slate-500">
                            Upload KTP penanggung jawab (selfie + KTP opsional
                            tapi disarankan).
                        </p>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                step3Form.post(
                                    '/mitra/event/onboarding/step-3',
                                    {
                                        preserveScroll: true,
                                        forceFormData: true,
                                        onSuccess: () => setActiveStep(4),
                                        onError: (errors) =>
                                            showError(
                                                'Gagal menyimpan',
                                                getFirstError(errors),
                                            ),
                                    },
                                );
                            }}
                            className="mt-6 grid gap-4 md:grid-cols-2"
                        >
                            <div className="grid gap-2">
                                <Label>Upload KTP</Label>
                                <FilePicker
                                    id="ktp_file"
                                    label="Select File here"
                                    helper="Files Supported: PDF, JPG, PNG"
                                    accept="image/*,.pdf"
                                    fileName={step3Form.data.ktp_file?.name}
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
                                    message={step3Form.errors.ktp_file}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Selfie + KTP (opsional)</Label>
                                <FilePicker
                                    id="selfie_ktp_file"
                                    label="Select File here"
                                    helper="Files Supported: JPG, PNG"
                                    accept="image/*"
                                    fileName={
                                        step3Form.data.selfie_ktp_file?.name
                                    }
                                    previewUrl={
                                        filePreviews.selfie ??
                                        getPublicUrl(onboarding.selfie_ktp_path)
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
                                    message={step3Form.errors.selfie_ktp_file}
                                />
                            </div>
                            <div className="flex justify-end md:col-span-2">
                                <Button
                                    type="submit"
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                >
                                    Simpan
                                </Button>
                            </div>
                        </form>
                    </section>
                )}

                {activeStep === 4 && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Data Rekening Payout
                        </h2>
                        <p className="text-sm text-slate-500">
                            Pastikan data rekening jelas untuk settlement dan
                            refund.
                        </p>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                step4Form.post(
                                    '/mitra/event/onboarding/step-4',
                                    {
                                        preserveScroll: true,
                                        onError: (errors) =>
                                            showError(
                                                'Gagal menyimpan',
                                                getFirstError(errors),
                                            ),
                                    },
                                );
                            }}
                            className="mt-6 grid gap-4 md:grid-cols-2"
                        >
                            <div className="grid gap-2">
                                <Label>Nama bank</Label>
                                <Input
                                    value={step4Form.data.bank_name}
                                    onChange={(event) =>
                                        step4Form.setData(
                                            'bank_name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Nama bank"
                                />
                                <InputError
                                    message={step4Form.errors.bank_name}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Nomor rekening</Label>
                                <Input
                                    value={step4Form.data.bank_account_number}
                                    onChange={(event) =>
                                        step4Form.setData(
                                            'bank_account_number',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Nomor rekening"
                                />
                                <InputError
                                    message={
                                        step4Form.errors.bank_account_number
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Nama pemilik rekening</Label>
                                <Input
                                    value={step4Form.data.bank_account_name}
                                    onChange={(event) =>
                                        step4Form.setData(
                                            'bank_account_name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Nama pemilik rekening"
                                />
                                <InputError
                                    message={step4Form.errors.bank_account_name}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Hubungan rekening</Label>
                                <Select
                                    value={step4Form.data.bank_account_relation}
                                    onValueChange={(value) =>
                                        step4Form.setData(
                                            'bank_account_relation',
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih hubungan rekening" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bankRelationOptions.map((option) => (
                                            <SelectItem
                                                key={option.id}
                                                value={option.id}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={
                                        step4Form.errors.bank_account_relation
                                    }
                                />
                            </div>
                            <div className="flex justify-end md:col-span-2">
                                <Button
                                    type="submit"
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                >
                                    Simpan
                                </Button>
                            </div>
                        </form>
                    </section>
                )}

                {onboarding.verification_status === 'draft' && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Kirim untuk Verifikasi
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Setelah semua data lengkap, kirim agar admin
                                    dapat memverifikasi.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                {isEventVerificationReady && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => submitVerification()}
                                        className="border-sky-200 text-sky-700 hover:bg-sky-50"
                                    >
                                        Kirim Verifikasi
                                    </Button>
                                )}
                            </div>
                        </div>
                        {!isEventVerificationReady && (
                            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold text-slate-400 uppercase">
                                    Checklist kelengkapan
                                </p>
                                <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                                    {eventChecklist.map((item) => (
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
