import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import PublicLayout from '@/layouts/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertCircle,
    Camera,
    CheckCircle2,
    Loader2,
    ScanLine,
    Ticket,
} from 'lucide-react';

type TicketRow = {
    item_id: number;
    booking_code: string;
    ticket_name: string;
    visit_date: string | null;
    quantity: number;
    used_quantity: number;
    remaining_quantity: number;
    usable_today: boolean;
    status: string;
};

type LookupPayload = {
    qr_data: string;
    destination: { id: number; name?: string | null; address?: string | null };
    tickets: TicketRow[];
};

type Props = {
    lookup?: LookupPayload | null;
    scanError?: string | null;
};

export default function PublicTicketScan({ lookup, scanError }: Props) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const useFormState = useForm({
        qr_data: lookup?.qr_data ?? '',
        booking_item_id: '',
    });

    const scanResultHandledRef = useRef(false);

    useEffect(() => {
        if (!isScanning || !videoRef.current) return;
        setCameraError(null);
        scanResultHandledRef.current = false;
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        reader
            .decodeFromConstraints(
                { video: { facingMode: 'environment' } },
                videoRef.current,
                (result) => {
                    const text = result?.getText();
                    if (!text || scanResultHandledRef.current) return;
                    scanResultHandledRef.current = true;
                    router.visit(
                        `/tickets/scan?qr=${encodeURIComponent(text)}`,
                    );
                },
            )
            .catch(() => {
                setCameraError(
                    'Kamera tidak bisa dibuka. Pastikan izin kamera aktif, lalu coba scan QR masuk kembali.',
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

    const stopScanner = () => {
        (
            readerRef.current as unknown as { reset?: () => void } | null
        )?.reset?.();
        readerRef.current = null;
        setIsScanning(false);
    };

    const handleUseTicket = (itemId: number) => {
        useFormState.setData({
            qr_data: lookup?.qr_data ?? '',
            booking_item_id: itemId.toString(),
        });
        useFormState.post('/tickets/scan/use', {
            preserveScroll: true,
        });
    };

    return (
        <PublicLayout showCategories={false} showChips={false}>
            <Head title="Scan Tiket Wisata" />
            <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-28 md:px-8 md:py-12">
                <section className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.34)] md:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Scan Tiket
                            </p>
                            <h1 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">
                                Scan QR masuk dari mitra wisata
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                Arahkan kamera ke QR masuk di loket wisata, lalu
                                pilih tiket paid yang ingin digunakan.
                            </p>
                        </div>
                        <Button
                            type="button"
                            className="bg-sky-600 text-white hover:bg-sky-700"
                            onClick={() =>
                                isScanning ? stopScanner() : setIsScanning(true)
                            }
                        >
                            <Camera className="mr-2 h-4 w-4" />
                            {isScanning ? 'Stop Scan' : 'Mulai Scan'}
                        </Button>
                    </div>

                    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
                        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950">
                            {isScanning ? (
                                <video
                                    ref={videoRef}
                                    className="h-72 w-full object-cover md:h-96"
                                    muted
                                />
                            ) : (
                                <div className="grid h-72 place-items-center bg-slate-950 p-8 text-center text-white md:h-96">
                                    <div>
                                        <ScanLine className="mx-auto h-10 w-10 text-sky-300" />
                                        <p className="mt-3 text-sm font-semibold">
                                            Kamera belum aktif
                                        </p>
                                        <p className="mt-1 text-xs text-white/65">
                                            Tekan Mulai Scan untuk membaca QR
                                            masuk.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                            <h2 className="text-sm font-bold text-slate-950">
                                Cara menggunakan tiket
                            </h2>
                            <ol className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                                <li>
                                    1. Buka menu Scan Tiket saat berada di
                                    lokasi wisata.
                                </li>
                                <li>
                                    2. Scan QR masuk yang ditempel oleh mitra.
                                </li>
                                <li>
                                    3. Pilih tiket yang akan digunakan untuk
                                    masuk.
                                </li>
                                <li>
                                    4. Tunjukkan halaman berhasil ke petugas
                                    jika diminta.
                                </li>
                            </ol>
                            <div className="mt-4 rounded-2xl bg-white p-3 text-xs leading-5 text-slate-500">
                                Satu tiket hanya dapat dipakai satu kali.
                                Pastikan tanggal kunjungan sesuai sebelum
                                memilih tiket.
                            </div>
                        </div>
                    </div>

                    {cameraError && (
                        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                            <AlertCircle className="mt-0.5 h-4 w-4" />
                            {cameraError}
                        </div>
                    )}
                    {scanError && (
                        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                            <AlertCircle className="mt-0.5 h-4 w-4" />
                            {scanError}
                        </div>
                    )}
                </section>

                {lookup && (
                    <section className="mt-6 rounded-[28px] border border-sky-100 bg-white p-5 shadow-sm md:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold text-sky-600 uppercase">
                                    Tiket tersedia
                                </p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">
                                    {lookup.destination.name ??
                                        'Destinasi wisata'}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {lookup.destination.address ??
                                        'Alamat destinasi'}
                                </p>
                            </div>
                            <Badge className="bg-sky-50 text-sky-700">
                                {lookup.tickets.length} tiket ditemukan
                            </Badge>
                        </div>

                        <div className="mt-5 grid gap-3">
                            {lookup.tickets.map((item) => (
                                <div
                                    key={item.item_id}
                                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Ticket className="h-4 w-4 text-sky-600" />
                                            <h3 className="font-bold text-slate-950">
                                                {item.ticket_name}
                                            </h3>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {item.booking_code} · Kunjungan{' '}
                                            {item.visit_date ?? '-'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Sisa {item.remaining_quantity} dari{' '}
                                            {item.quantity} tiket
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        disabled={
                                            !item.usable_today ||
                                            useFormState.processing
                                        }
                                        className="bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-500"
                                        onClick={() =>
                                            handleUseTicket(item.item_id)
                                        }
                                    >
                                        {useFormState.processing &&
                                        useFormState.data.booking_item_id ===
                                            item.item_id.toString() ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                        )}
                                        Gunakan 1 tiket
                                    </Button>
                                    {!item.usable_today && (
                                        <div className="basis-full text-xs font-semibold text-amber-700">
                                            Tiket belum dapat digunakan.
                                            Pastikan status paid, tanggal
                                            kunjungan hari ini, dan sisa tiket
                                            masih ada.
                                        </div>
                                    )}
                                </div>
                            ))}
                            {lookup.tickets.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                                    Tidak ada tiket aktif untuk destinasi ini di
                                    akun kamu.
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </main>
        </PublicLayout>
    );
}
