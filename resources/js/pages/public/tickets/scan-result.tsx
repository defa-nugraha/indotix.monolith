import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

type Props = {
    status: 'success' | 'failed';
    result?: {
        destination_name?: string;
        booking_code?: string;
        ticket_name?: string;
        remaining_quantity?: number;
    } | null;
    message?: string | null;
};

export default function PublicTicketScanResult({
    status,
    result,
    message,
}: Props) {
    const success = status === 'success';

    return (
        <PublicLayout showCategories={false} showChips={false}>
            <Head
                title={
                    success
                        ? 'Tiket Berhasil Digunakan'
                        : 'Tiket Gagal Digunakan'
                }
            />
            <main className="grid min-h-[calc(100vh-120px)] place-items-center px-4 py-10 pb-28">
                <section className="w-full max-w-md rounded-[32px] border border-sky-100 bg-white p-8 text-center shadow-[0_24px_70px_-36px_rgba(15,23,42,0.34)]">
                    <div
                        className={`mx-auto grid h-28 w-28 place-items-center rounded-full ${
                            success
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                        }`}
                    >
                        {success ? (
                            <CheckCircle2 className="h-16 w-16 animate-[pulse_1.2s_ease-in-out_2]" />
                        ) : (
                            <XCircle className="h-16 w-16 animate-[pulse_1.2s_ease-in-out_2]" />
                        )}
                    </div>
                    <h1 className="mt-6 text-2xl font-black text-slate-950">
                        {success
                            ? 'Tiket berhasil digunakan'
                            : 'Tiket tidak dapat digunakan'}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                        {success
                            ? `${result?.ticket_name ?? 'Tiket wisata'} untuk ${result?.destination_name ?? 'destinasi'} sudah tercatat.`
                            : (message ??
                              'Tiket tidak valid atau sudah pernah digunakan.')}
                    </p>
                    {success && (
                        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left text-sm text-slate-600">
                            <div>
                                <span className="font-semibold text-slate-900">
                                    Booking:
                                </span>{' '}
                                {result?.booking_code ?? '-'}
                            </div>
                            <div className="mt-1">
                                <span className="font-semibold text-slate-900">
                                    Sisa tiket tipe ini:
                                </span>{' '}
                                {result?.remaining_quantity ?? 0}
                            </div>
                        </div>
                    )}
                    <div className="mt-7 grid gap-3">
                        <Button
                            asChild
                            className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                            <Link href="/tickets/scan">Scan tiket lain</Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="border-sky-200 text-sky-700 hover:bg-sky-50"
                        >
                            <Link href="/history">Lihat riwayat tiket</Link>
                        </Button>
                    </div>
                </section>
            </main>
        </PublicLayout>
    );
}
