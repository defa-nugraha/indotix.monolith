import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/promo-videos' },
    { title: 'Promo Video', href: '/admin/public/promo-videos' },
    { title: 'Edit', href: '#' },
];

const maxVideoBytes = 100 * 1024 * 1024;
const maxVideoSizeLabel = '100 MB';
const recommendedVideoSize = { width: 1280, height: 720 };

type ProgressStepStatus = 'pending' | 'active' | 'done' | 'error';

type ProgressStep = {
    key: string;
    title: string;
    description: string;
    status: ProgressStepStatus;
};

const initialProgressSteps: ProgressStep[] = [
    {
        key: 'upload',
        title: 'Mengunggah video',
        description: 'File video dikirim ke server.',
        status: 'pending',
    },
    {
        key: 'validate',
        title: 'Memeriksa data',
        description: 'Server memvalidasi judul, status, format, dan ukuran file.',
        status: 'pending',
    },
    {
        key: 'save',
        title: 'Menyimpan perubahan',
        description: 'Server menyimpan data promo video dan mengganti file jika ada.',
        status: 'pending',
    },
    {
        key: 'compress',
        title: 'Menyiapkan kompresi',
        description: 'Video besar dijadwalkan untuk dikompresi di background.',
        status: 'pending',
    },
];

type PromoVideo = {
    id: number;
    title: string;
    description: string | null;
    cta_label: string | null;
    cta_url: string | null;
    image_path: string | null;
    secondary_video_path: string | null;
    is_active: boolean;
};

export default function PromoVideoEdit({ promoVideo }: { promoVideo: PromoVideo }) {
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [progressSteps, setProgressSteps] = useState<ProgressStep[]>(initialProgressSteps);

    const form = useForm({
        title: promoVideo.title ?? '',
        description: promoVideo.description ?? '',
        cta_label: promoVideo.cta_label ?? '',
        cta_url: promoVideo.cta_url ?? '',
        is_active: promoVideo.is_active ?? true,
        video: null as File | null,
        secondary_video: null as File | null,
        _method: 'put',
    });

    const validateVideoFile = (
        file: File | null,
        field: 'video' | 'secondary_video',
        expected: { width: number; height: number },
        input?: HTMLInputElement | null,
    ) => {
        if (!file) {
            form.setData(field, null);
            form.clearErrors(field);
            return;
        }

        if (file.size > maxVideoBytes) {
            form.setError(field, `Ukuran video maksimal ${maxVideoSizeLabel}.`);
            form.setData(field, null);
            if (input) {
                input.value = '';
            }
            Swal.fire({
                icon: 'error',
                title: 'Video terlalu besar',
                text: `Ukuran video maksimal ${maxVideoSizeLabel}.`,
            });
            return;
        }

        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            if (video.videoWidth !== expected.width || video.videoHeight !== expected.height) {
                form.setError(field, `Ukuran video harus ${expected.width} x ${expected.height} px.`);
                form.setData(field, null);
                if (input) {
                    input.value = '';
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Ukuran video tidak sesuai',
                    text: `Video harus ${expected.width} x ${expected.height} px.`,
                });
                return;
            }
            form.clearErrors(field);
            form.setData(field, file);
        };
        video.onerror = () => {
            URL.revokeObjectURL(url);
            form.setError(field, 'Video tidak dapat dibaca.');
            form.setData(field, null);
            if (input) {
                input.value = '';
            }
        };
        video.src = url;
    };

    const setStepStatus = (keys: string[], status: ProgressStepStatus) => {
        setProgressSteps((steps) => steps.map((step) => (keys.includes(step.key) ? { ...step, status } : step)));
    };

    const resetProgress = () => {
        setShowProgressModal(true);
        setUploadProgress(0);
        setProgressSteps(initialProgressSteps.map((step) => (step.key === 'upload' ? { ...step, status: 'active' } : step)));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Promo Video">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Edit Promo Video</h1>
                    <form
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            let requestFailed = false;
                            resetProgress();
                            form.post(`/admin/public/promo-videos/${promoVideo.id}`, {
                                forceFormData: true,
                                onProgress: (progress) => {
                                    const percent = progress?.percentage ?? 0;
                                    setUploadProgress(Math.round(percent));
                                    if (percent >= 100) {
                                        setStepStatus(['upload'], 'done');
                                        setStepStatus(['validate', 'save'], 'active');
                                    }
                                },
                                onSuccess: () => {
                                    setUploadProgress(100);
                                    setProgressSteps((steps) =>
                                        steps.map((step) => ({
                                            ...step,
                                            status: 'done',
                                        })),
                                    );
                                    return Swal.fire({
                                        title: 'Berhasil',
                                        text: 'Promo video diperbarui. Jika ukuran file besar, kompresi berjalan di background.',
                                        icon: 'success',
                                    });
                                },
                                onError: () => {
                                    requestFailed = true;
                                    setStepStatus(['validate', 'save'], 'error');
                                    Swal.fire({
                                        title: 'Gagal',
                                        text: 'Promo video gagal diperbarui.',
                                        icon: 'error',
                                    });
                                },
                                onFinish: () => {
                                    if (requestFailed) {
                                        return;
                                    }
                                    setTimeout(() => setShowProgressModal(false), 1200);
                                },
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label>Judul</Label>
                            <Input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} />
                            <InputError message={form.errors.title} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Deskripsi</Label>
                            <Input value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} />
                            <InputError message={form.errors.description} />
                        </div>
                        <div className="grid gap-2">
                            <Label>CTA Label</Label>
                            <Input value={form.data.cta_label} onChange={(event) => form.setData('cta_label', event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>CTA URL</Label>
                            <Input value={form.data.cta_url} onChange={(event) => form.setData('cta_url', event.target.value)} />
                        </div>
                        {promoVideo.image_path && (
                            <div className="grid gap-2">
                                <Label>Video utama saat ini</Label>
                                <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-xl border border-sky-100 bg-slate-950">
                                    <video src={`/storage/${promoVideo.image_path}`} className="h-full w-full object-cover" controls />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Preview memakai rasio rekomendasi {recommendedVideoSize.width} × {recommendedVideoSize.height} px (16:9).
                                </p>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label>Ganti video utama (opsional)</Label>
                            <Input
                                type="file"
                                accept="video/*"
                                onChange={(event) =>
                                    validateVideoFile(event.target.files?.[0] ?? null, 'video', recommendedVideoSize, event.currentTarget)
                                }
                            />
                            <p className="text-xs text-slate-500">Ukuran rekomendasi: 1280 × 720 px (16:9), maksimal {maxVideoSizeLabel}.</p>
                            <InputError message={form.errors.video} />
                        </div>
                        {promoVideo.secondary_video_path && (
                            <div className="grid gap-2">
                                <Label>Video bawah saat ini</Label>
                                <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-xl border border-sky-100 bg-slate-950">
                                    <video src={`/storage/${promoVideo.secondary_video_path}`} className="h-full w-full object-cover" controls />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Preview memakai rasio rekomendasi {recommendedVideoSize.width} × {recommendedVideoSize.height} px (16:9).
                                </p>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label>Ganti video bawah (opsional)</Label>
                            <Input
                                type="file"
                                accept="video/*"
                                onChange={(event) =>
                                    validateVideoFile(event.target.files?.[0] ?? null, 'secondary_video', recommendedVideoSize, event.currentTarget)
                                }
                            />
                            <p className="text-xs text-slate-500">Ukuran rekomendasi: 1280 × 720 px (16:9), maksimal {maxVideoSizeLabel}.</p>
                            <InputError message={form.errors.secondary_video} />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} />
                            Aktif
                        </label>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700" disabled={form.processing}>
                            {form.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </form>
                </section>
            </div>

            {showProgressModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-sky-100 bg-white p-6 shadow-2xl">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-sky-600">Menyimpan promo video</p>
                            <h2 className="text-xl font-semibold text-slate-950">Server sedang memproses perubahan</h2>
                            <p className="text-sm text-slate-500">Tunggu sampai proses selesai. Jangan tutup halaman ini.</p>
                        </div>

                        <div className="mt-5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-slate-700">Progress upload</span>
                                <span className="font-semibold text-slate-950">{uploadProgress}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            {progressSteps.map((step) => (
                                <div key={step.key} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <div
                                        className={[
                                            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                            step.status === 'done' ? 'bg-emerald-100 text-emerald-700' : '',
                                            step.status === 'active' ? 'bg-sky-100 text-sky-700' : '',
                                            step.status === 'error' ? 'bg-red-100 text-red-700' : '',
                                            step.status === 'pending' ? 'bg-slate-200 text-slate-500' : '',
                                        ].join(' ')}
                                    >
                                        {step.status === 'done' ? '✓' : step.status === 'error' ? '!' : step.status === 'active' ? '•' : ''}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                                        <p className="text-xs leading-5 text-slate-500">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!form.processing && progressSteps.some((step) => step.status === 'error') && (
                            <div className="mt-5 flex justify-end">
                                <Button type="button" variant="outline" onClick={() => setShowProgressModal(false)}>
                                    Tutup
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
