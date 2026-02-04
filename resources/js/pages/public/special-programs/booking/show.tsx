import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle, Clock, CreditCard, Loader2 } from 'lucide-react';

type Booking = {
    encrypted_id: string;
    quantity: number;
    unit_price: number;
    total: number;
    status: string;
    payment_status?: string | null;
    payment_deadline?: string | null;
    ticket_name?: string | null;
    program: { name?: string | null };
    item: { name: string; type: string; city_name?: string | null };
    guest: { name: string; email: string; phone: string };
};

type Props = {
    booking: Booking;
};

export default function SpecialProgramBookingShow({ booking }: Props) {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const [isDownloading, setIsDownloading] = useState(false);

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Detail Booking Special Program" />
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Indotix" className="h-8" />
                    </div>
                    <div className="flex flex-1 items-center">
                        <input
                            type="text"
                            placeholder="Cari kota/hotel/wisata/event..."
                            className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm shadow-sm focus:border-sky-400 focus:outline-none"
                        />
                    </div>
                    {!auth?.user && (
                        <div className="flex items-center gap-2">
                            <Link href="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Register</Link>
                            <Link href="/login" className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">Login</Link>
                        </div>
                    )}
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h1 className="text-2xl font-semibold text-slate-900">Detail Booking Special Program</h1>
                            <p className="mt-2 text-sm text-slate-500">Cek informasi booking kamu.</p>
                            <div className="mt-6 grid gap-4 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Program</span>
                                    <span className="font-semibold text-slate-900">{booking.program?.name ?? '-'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Produk</span>
                                    <span className="font-semibold text-slate-900">{booking.item.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Jumlah</span>
                                    <span className="font-semibold text-slate-900">{booking.quantity}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Harga</span>
                                    <span className="font-semibold text-slate-900">Rp {Number(booking.unit_price).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                                    <span>Total</span>
                                    <span className="text-lg font-semibold text-sky-600">Rp {Number(booking.total).toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Data Tamu</h2>
                            <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                <div>{booking.guest.name ?? '-'}</div>
                                <div>{booking.guest.email ?? '-'}</div>
                                <div>{booking.guest.phone ?? '-'}</div>
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700">
                                <CheckCircle className="h-4 w-4" />
                                Booking kamu tercatat aman di INDOTIX
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-slate-400" />
                                    Status pembayaran: {booking.payment_status ?? 'pending'}
                                </div>
                                {booking.payment_deadline && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        Batas bayar: {new Date(booking.payment_deadline).toLocaleString('id-ID')}
                                    </div>
                                )}
                            </div>
                            {booking.status === 'pending_payment' && (
                                <Link
                                    href={`/special-programs/booking/${booking.encrypted_id}/payment`}
                                    className="mt-4 block rounded-lg bg-sky-600 px-4 py-2 text-center text-sm font-semibold text-white"
                                >
                                    Lanjutkan Pembayaran
                                </Link>
                            )}
                            {(booking.status === 'paid' || booking.status === 'completed') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isDownloading) return;
                                        setIsDownloading(true);
                                        window.open(`/special-programs/booking/${booking.encrypted_id}/ticket`, '_blank');
                                        window.setTimeout(() => setIsDownloading(false), 8000);
                                    }}
                                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-600"
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Menyiapkan tiket...
                                        </>
                                    ) : (
                                        'Download Tiket'
                                    )}
                                </button>
                            )}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
