import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

type ScanRow = {
    id: number;
    scanned_at: string;
    officer_name: string | null;
    location: string | null;
    is_anomaly: boolean;
    booking?: {
        booking_code?: string | null;
        event_title?: string | null;
        ticket_name?: string | null;
    };
};

type Props = {
    organizer: { id: number; name?: string | null };
    scans: {
        data: ScanRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { date?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Validasi QR', href: '/mitra/events/scans' },
];

export default function MitraEventScansIndex({ scans, filters }: Props) {
    const form = useForm({
        booking_code: '',
        officer_name: '',
        location: '',
    });
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const lastScannedRef = useRef<string | null>(null);

    const submitFilters = (formEl: HTMLFormElement) => {
        const data = new FormData(formEl);
        router.get('/mitra/events/scans', Object.fromEntries(data.entries()), {
            preserveState: true,
        });
    };

    const normalizeBookingCode = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return trimmed;
        const parts = trimmed
            .split('|')
            .map((item) => item.trim())
            .filter(Boolean);
        return parts.length > 1 ? parts[parts.length - 1] : trimmed;
    };

    const submitScan = (rawValue: string) => {
        const bookingCode = normalizeBookingCode(rawValue);
        if (!bookingCode) return;
        if (lastScannedRef.current === bookingCode) return;
        lastScannedRef.current = bookingCode;
        form.setData('booking_code', bookingCode);
        form.post('/mitra/events/scans', {
            preserveScroll: true,
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Terscan',
                    text: 'Tiket berhasil diverifikasi.',
                }).then(() => {
                    if (navigator.vibrate) {
                        navigator.vibrate(120);
                    }
                    playBeep(740, 140);
                    lastScannedRef.current = null;
                }),
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat memvalidasi tiket.',
                }).then(() => {
                    if (navigator.vibrate) {
                        navigator.vibrate([80, 80, 80]);
                    }
                    playBeep(320, 200);
                    lastScannedRef.current = null;
                }),
        });
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

    useEffect(() => {
        if (!isScanning) return;
        if (!videoRef.current) return;
        setCameraError(null);
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

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
            .catch(() => {
                setCameraError(
                    'Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.',
                );
                setIsScanning(false);
            });

        return () => {
            (
                readerRef.current as unknown as { reset?: () => void } | null
            )?.reset?.();
            readerRef.current = null;
        };
    }, [isScanning]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Validasi QR Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div>
                        <p className="text-xs font-semibold text-sky-600 uppercase">
                            Validasi QR
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                            Scan Tiket Event
                        </h1>
                        <p className="text-sm text-slate-500">
                            Validasi tiket masuk menggunakan QR.
                        </p>
                    </div>
                    <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        Scan QR dengan Kamera
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Arahkan kamera ke QR tiket event.
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
                                            (
                                                readerRef.current as unknown as {
                                                    reset?: () => void;
                                                } | null
                                            )?.reset?.();
                                            readerRef.current = null;
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
                                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">
                                        Lokasi
                                    </label>
                                    <input
                                        value={form.data.location}
                                        onChange={(event) =>
                                            form.setData(
                                                'location',
                                                event.target.value,
                                            )
                                        }
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
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Riwayat Scan
                        </h2>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                submitFilters(event.currentTarget);
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
                        </form>
                    </div>
                    <div className="mt-4 grid gap-3">
                        {scans.data.map((scan) => (
                            <div
                                key={scan.id}
                                className="rounded-2xl border border-slate-100 p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {scan.booking?.booking_code ?? '-'}{' '}
                                            • {scan.booking?.event_title ?? '-'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {scan.scanned_at}
                                        </p>
                                    </div>
                                    <Badge
                                        className={
                                            scan.is_anomaly
                                                ? 'bg-rose-50 text-rose-700'
                                                : 'bg-emerald-50 text-emerald-700'
                                        }
                                    >
                                        {scan.is_anomaly ? 'Anomali' : 'Valid'}
                                    </Badge>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    Petugas: {scan.officer_name ?? '-'} •
                                    Lokasi: {scan.location ?? '-'}
                                </p>
                            </div>
                        ))}
                        {scans.data.length === 0 && (
                            <div className="text-sm text-slate-500">
                                Belum ada scan.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
