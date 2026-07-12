import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

type ScanRow = {
    id: number;
    scanned_at: string;
    officer_name?: string | null;
    device?: string | null;
    is_anomaly: boolean;
    booking?: {
        academy_class?: { title?: string | null };
        booking_code?: string | null;
    };
    ticket?: { name?: string | null };
};

type Props = {
    scans: { data: ScanRow[] };
    classes: Array<{ id: number; title: string }>;
    filters: { class_id?: number | null; date?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Eljohn Academy', href: '/admin/academy/classes' },
    { title: 'Monitoring QR', href: '/admin/academy/scans' },
];

export default function AcademyScansIndex({ scans, classes, filters }: Props) {
    const form = useForm({
        booking_code: '',
        officer_name: '',
        device: '',
    });
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const scanControlsRef = useRef<{ stop: () => void } | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const lastScannedRef = useRef<string | null>(null);

    const normalizeBookingCode = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return trimmed;
        const parts = trimmed
            .split('|')
            .map((item) => item.trim())
            .filter(Boolean);
        return parts.length > 1 ? parts[parts.length - 1] : trimmed;
    };

    const playBeep = (frequency: number, duration = 120) => {
        try {
            const AudioContext =
                window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            gain.gain.value = 0.08;
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                ctx.close().catch(() => {});
            }, duration);
        } catch {
            // ignore audio errors
        }
    };

    const submitScan = (rawValue: string) => {
        const bookingCode = normalizeBookingCode(rawValue);
        if (!bookingCode) return;
        if (lastScannedRef.current === bookingCode) return;

        lastScannedRef.current = bookingCode;
        form.setData('booking_code', bookingCode);
        form.clearErrors();
        router.post(
            '/admin/academy/scans',
            { ...form.data, booking_code: bookingCode },
            {
                preserveScroll: true,
                onSuccess: () =>
                    Swal.fire({
                        icon: 'success',
                        title: 'Terscan',
                        text: 'Kehadiran peserta academy berhasil divalidasi.',
                    }).then(() => {
                        if (navigator.vibrate) {
                            navigator.vibrate(120);
                        }
                        playBeep(740, 140);
                        lastScannedRef.current = null;
                        form.setData('booking_code', '');
                    }),
                onError: (errors) => {
                    if (typeof errors.booking_code === 'string') {
                        form.setError('booking_code', errors.booking_code);
                    }
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: 'Tidak dapat memvalidasi QR academy.',
                    }).then(() => {
                        if (navigator.vibrate) {
                            navigator.vibrate([80, 80, 80]);
                        }
                        playBeep(320, 200);
                        lastScannedRef.current = null;
                    });
                },
            },
        );
    };

    useEffect(() => {
        if (!isScanning) return;
        if (!videoRef.current) return;
        setCameraError(null);
        const reader = new BrowserMultiFormatReader();

        reader
            .decodeFromConstraints(
                { video: { facingMode: 'environment' } },
                videoRef.current,
                (result) => {
                    if (result?.getText()) {
                        submitScan(result.getText());
                    }
                },
            )
            .then((controls) => {
                scanControlsRef.current = controls;
            })
            .catch(() => {
                setCameraError(
                    'Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.',
                );
                setIsScanning(false);
            });

        return () => {
            scanControlsRef.current?.stop();
            scanControlsRef.current = null;
        };
    }, [isScanning]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monitoring QR Academy" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Academy
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                Monitoring QR
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Scan QR peserta academy untuk mencatat kehadiran
                                dan mendeteksi scan berulang.
                            </p>
                        </div>
                        <form
                            className="flex flex-wrap gap-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const data = new FormData(event.currentTarget);
                                router.get(
                                    '/admin/academy/scans',
                                    Object.fromEntries(data.entries()),
                                );
                            }}
                        >
                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                <span>Tanggal</span>
                                <input
                                    type="date"
                                    name="date"
                                    defaultValue={filters.date ?? ''}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                <span>Kelas</span>
                                <select
                                    name="class_id"
                                    defaultValue={filters.class_id ?? ''}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="">Semua Kelas</option>
                                    {classes.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white">
                                Filter
                            </button>
                        </form>
                    </div>
                </section>
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div>
                        <p className="text-xs font-semibold text-sky-600 uppercase">
                            Scan Kehadiran
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900">
                            Validasi QR Peserta Academy
                        </h2>
                        <p className="text-sm text-slate-500">
                            Arahkan kamera ke QR tiket academy atau masukkan
                            kode booking secara manual.
                        </p>
                    </div>
                    <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        Scan QR dengan Kamera
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Gunakan kamera perangkat untuk membaca
                                        QR peserta.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant={
                                        isScanning ? 'destructive' : 'default'
                                    }
                                    className={
                                        isScanning
                                            ? ''
                                            : 'bg-sky-600 text-white hover:bg-sky-700'
                                    }
                                    onClick={() => {
                                        if (isScanning) {
                                            scanControlsRef.current?.stop();
                                            scanControlsRef.current = null;
                                            setIsScanning(false);
                                            return;
                                        }
                                        setIsScanning(true);
                                    }}
                                >
                                    {isScanning ? 'Stop Scan' : 'Mulai Scan'}
                                </Button>
                            </div>
                            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/80">
                                <video
                                    ref={videoRef}
                                    className="h-64 w-full object-cover"
                                    muted
                                />
                            </div>
                            {cameraError && (
                                <p className="mt-3 text-xs font-semibold text-rose-600">
                                    {cameraError}
                                </p>
                            )}
                        </div>
                        <div>
                            <form
                                className="grid gap-3"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    submitScan(form.data.booking_code);
                                }}
                            >
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">
                                        Kode Booking
                                    </label>
                                    <input
                                        value={form.data.booking_code}
                                        onChange={(event) =>
                                            form.setData(
                                                'booking_code',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Contoh: ACD-..."
                                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                    <InputError
                                        message={form.errors.booking_code}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">
                                        Petugas
                                    </label>
                                    <input
                                        value={form.data.officer_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'officer_name',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Nama petugas"
                                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">
                                        Perangkat/Lokasi
                                    </label>
                                    <input
                                        value={form.data.device}
                                        onChange={(event) =>
                                            form.setData(
                                                'device',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Lobby / Scanner 1"
                                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                >
                                    Validasi Manual
                                </Button>
                            </form>
                        </div>
                    </div>
                </section>
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Kode
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Kelas
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Tiket
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Waktu
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Petugas
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Perangkat
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {scans.data.map((scan) => (
                                    <tr
                                        key={scan.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {scan.booking?.booking_code ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {scan.booking?.academy_class
                                                ?.title ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {scan.ticket?.name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {scan.scanned_at}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {scan.officer_name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {scan.device ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={
                                                    scan.is_anomaly
                                                        ? 'bg-rose-50 text-rose-700'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                }
                                            >
                                                {scan.is_anomaly
                                                    ? 'Anomali'
                                                    : 'Valid'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {scans.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-sm text-slate-500"
                                        >
                                            Belum ada scan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
