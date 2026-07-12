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
        visit_date?: string | null;
        ticket_name?: string | null;
    };
};

type Props = {
    destination: { id: number; destination_name: string | null };
    scans: {
        data: ScanRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { date?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Validasi QR', href: '/mitra/wisata/scans' },
];

export default function MitraWisataScansIndex({
    destination,
    scans,
    filters,
}: Props) {
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
        router.get('/mitra/wisata/scans', Object.fromEntries(data.entries()), {
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
        form.post('/mitra/wisata/scans', {
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
            .catch((error) => {
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
            <Head title="Validasi QR Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div>
                        <p className="text-xs font-semibold text-sky-600 uppercase">
                            Validasi QR
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                            Scan Tiket {destination.destination_name ?? ''}
                        </h1>
                        <p className="text-sm text-slate-500">
                            Input kode booking untuk validasi tiket masuk.
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
                                        Arahkan kamera ke QR pada tiket wisata.
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
                                    <label className="grid gap-1 text-xs font-medium text-slate-600">
                                        <span>Kode booking</span>
                                        <input
                                            value={form.data.booking_code}
                                            onChange={(event) =>
                                                form.setData(
                                                    'booking_code',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Kode booking"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        />
                                    </label>
                                    <InputError
                                        message={form.errors.booking_code}
                                    />
                                </div>
                                <label className="grid gap-1 text-xs font-medium text-slate-600">
                                    <span>Nama petugas</span>
                                    <input
                                        value={form.data.officer_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'officer_name',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Nama petugas"
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </label>
                                <label className="grid gap-1 text-xs font-medium text-slate-600">
                                    <span>Lokasi</span>
                                    <input
                                        value={form.data.location}
                                        onChange={(event) =>
                                            form.setData(
                                                'location',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Lokasi (opsional)"
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </label>
                                <Button
                                    type="submit"
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                >
                                    Simpan Scan
                                </Button>
                            </form>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form
                        className="mb-4 flex flex-wrap items-center gap-3"
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
                        <Button
                            type="submit"
                            variant="outline"
                            className="border-sky-200 text-sky-700 hover:bg-sky-50"
                        >
                            Filter
                        </Button>
                    </form>
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Waktu Scan
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Kode Booking
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Tiket
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Petugas
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
                                        <td className="px-4 py-3">
                                            {scan.scanned_at}
                                        </td>
                                        <td className="px-4 py-3">
                                            {scan.booking?.booking_code ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {scan.booking?.ticket_name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {scan.officer_name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={
                                                    scan.is_anomaly
                                                        ? 'bg-rose-50 text-rose-600'
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
                                            colSpan={5}
                                            className="px-4 py-8 text-center text-sm text-slate-500"
                                        >
                                            Belum ada data scan.
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
