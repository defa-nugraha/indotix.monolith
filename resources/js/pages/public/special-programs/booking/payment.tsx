import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { ShoppingCart } from 'lucide-react';

type Booking = {
    encrypted_id: string;
    total: number;
    payment_status?: string | null;
    payment_deadline?: string | null;
    item: { name: string; type: string };
    ticket_name?: string | null;
    program: { name?: string | null };
    payment?: { payload?: Record<string, any> | null } | null;
};

type Props = {
    booking: Booking;
    snapClientKey: string;
    snapScriptUrl: string;
    snapError?: string | null;
};

declare global {
    interface Window {
        snap?: { pay: (token: string, options?: Record<string, unknown>) => void };
    }
}

export default function SpecialProgramPayment({ booking, snapClientKey, snapScriptUrl, snapError }: Props) {
    const { auth, souvenir_cart_count } = usePage().props as { auth?: { user?: { role?: string } }; souvenir_cart_count?: number };
    const snapOpened = useRef(false);
    const snapToken = booking.payment?.payload?.token as string | undefined;

    useEffect(() => {
        if (snapError) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: snapError });
        }
    }, [snapError]);

    useEffect(() => {
        if (!snapScriptUrl || !snapClientKey || !snapToken) return;
        const launch = () => {
            if (!snapOpened.current && window.snap) {
                snapOpened.current = true;
                window.snap.pay(snapToken);
            }
        };

        if (window.snap) {
            launch();
            return;
        }

        let script = document.querySelector('script[data-midtrans-snap]') as HTMLScriptElement | null;
        if (!script) {
            script = document.createElement('script');
            script.src = snapScriptUrl;
            script.setAttribute('data-client-key', snapClientKey);
            script.setAttribute('data-midtrans-snap', 'true');
            script.async = true;
            script.onerror = () => {
                Swal.fire({ icon: 'error', title: 'Gagal memuat pembayaran', text: 'Silakan coba lagi.' });
            };
            document.body.appendChild(script);
        }

        const timer = window.setInterval(() => {
            if (window.snap) {
                window.clearInterval(timer);
                launch();
            }
        }, 500);

        return () => window.clearInterval(timer);
    }, [snapClientKey, snapScriptUrl, snapToken]);

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Pembayaran Special Program" />
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <Link href="/"><img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" /></Link>
                    </div>
                    <div className="flex flex-1 items-center">
                        <input
                            type="text"
                            placeholder="Cari kota/hotel/wisata/event..."
                            className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm shadow-sm focus:border-sky-400 focus:outline-none"
                        />
                    </div>
                    <Link href="/souvenir/cart" className="relative flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600">
                        <ShoppingCart className="h-4 w-4" />
                        Keranjang
                        {Boolean(souvenir_cart_count) && (
                            <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                                {souvenir_cart_count}
                            </span>
                        )}
                    </Link>
                    {!auth?.user && (
                        <div className="flex items-center gap-2">
                            <Link href="/register" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">Register</Link>
                            <Link href="/login" className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">Login</Link>
                        </div>
                    )}
                </div>
            </header>

            <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <h1 className="text-xl font-semibold text-slate-900">Pembayaran Special Program</h1>
                    <p className="mt-2 text-sm text-slate-500">Booking kamu sudah siap, lanjutkan pembayaran.</p>
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
                            <span>Total</span>
                            <span className="text-lg font-semibold text-sky-600">Rp {Number(booking.total).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
