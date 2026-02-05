import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { Bell, ClipboardCheck, Mail, MessageCircle, Phone, ShoppingBag, User, UserCircle, History, ShoppingCart } from 'lucide-react';

type Item = {
    key: string;
    name: string;
    variant_name?: string | null;
    quantity: number;
    price: number;
    subtotal: number;
};

type Props = {
    items: Item[];
    summary: { subtotal: number; total: number };
    snapClientKey: string;
    snapScriptUrl: string;
    snapToken?: string | null;
};

declare global {
    interface Window {
        snap?: {
            pay: (token: string, options?: Record<string, unknown>) => void;
        };
    }
}

export default function SouvenirBookingReview({ items, summary, snapClientKey, snapScriptUrl, snapToken: initialSnapToken }: Props) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
    };
    const isUser = Boolean(auth?.user?.role === 'user');
    const form = useForm({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        shipping_address: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [snapToken, setSnapToken] = useState<string | null>(initialSnapToken ?? null);
    const snapOpened = useRef(false);

    useEffect(() => {
        if (initialSnapToken) {
            setSnapToken(initialSnapToken);
        }
    }, [initialSnapToken]);

    useEffect(() => {
        if (!snapScriptUrl || !snapClientKey) return;
        if (document.querySelector('script[data-midtrans-snap]')) return;
        const script = document.createElement('script');
        script.src = snapScriptUrl;
        script.setAttribute('data-client-key', snapClientKey);
        script.setAttribute('data-midtrans-snap', 'true');
        script.async = true;
        script.onload = () => {
            if (snapToken && !snapOpened.current && window.snap) {
                snapOpened.current = true;
                window.snap.pay(snapToken);
            }
        };
        document.body.appendChild(script);
    }, [snapClientKey, snapScriptUrl, snapToken]);

    useEffect(() => {
        if (!snapToken || snapOpened.current || !window.snap) return;
        snapOpened.current = true;
        window.snap.pay(snapToken);
    }, [snapToken]);

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Review Pemesanan Souvenir" />
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
                    <Link href="/souvenir/cart" className="relative flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600">
                        <ShoppingCart className="h-4 w-4" />
                        Keranjang
                        {Boolean(souvenir_cart_count) && (
                            <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                                {souvenir_cart_count}
                            </span>
                        )}
                    </Link>
                    {isUser && (
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                            <Link href="/settings/profile" className="flex items-center gap-2 hover:text-sky-600">
                                <UserCircle className="h-4 w-4" />
                                Profile
                            </Link>
                            <Link href="/history" className="flex items-center gap-2 hover:text-sky-600">
                                <History className="h-4 w-4" />
                                Riwayat
                            </Link>
                            <Link href="/?tab=chat" className="flex items-center gap-2 hover:text-sky-600">
                                <MessageCircle className="h-4 w-4" />
                                Chat
                            </Link>
                            <Link href="/notifications" className="relative flex items-center gap-2 hover:text-sky-600">
                                <Bell className="h-4 w-4" />
                                Notifikasi
                                {Boolean(unread_notifications) && (
                                    <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                        {unread_notifications}
                                    </span>
                                )}
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
                <section className="flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1 rounded-3xl bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-slate-900">Review Pemesanan Souvenir</h1>
                                <div className="mt-2 text-sm text-slate-500">Lengkapi data pengiriman sebelum bayar.</div>
                            </div>
                            <ClipboardCheck className="h-6 w-6 text-sky-500" />
                        </div>

                        <form
                            className="mt-6 space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                setLoading(true);
                                form.post('/souvenir/checkout/confirm', {
                                    preserveScroll: true,
                                    onError: (errors) => {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Gagal',
                                            text: errors.cart ?? errors.guest_name ?? 'Tidak dapat memproses pembayaran.',
                                        });
                                        setLoading(false);
                                    },
                                    onSuccess: (page) => {
                                        const nextToken = (page.props as any)?.snapToken ?? null;
                                        if (!nextToken) {
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Gagal',
                                                text: 'Token pembayaran tidak tersedia. Silakan coba lagi.',
                                            });
                                        } else {
                                            snapOpened.current = false;
                                            setSnapToken(nextToken);
                                        }
                                        setLoading(false);
                                    },
                                });
                            }}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full text-sm focus:outline-none"
                                            value={form.data.guest_name}
                                            onChange={(event) => form.setData('guest_name', event.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Email</label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full text-sm focus:outline-none"
                                            type="email"
                                            value={form.data.guest_email}
                                            onChange={(event) => form.setData('guest_email', event.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Nomor HP</label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full text-sm focus:outline-none"
                                            value={form.data.guest_phone}
                                            onChange={(event) => form.setData('guest_phone', event.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Alamat Pengiriman</label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <ShoppingBag className="h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full text-sm focus:outline-none"
                                            value={form.data.shipping_address}
                                            onChange={(event) => form.setData('shipping_address', event.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Catatan (opsional)</label>
                                <textarea
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none"
                                    value={form.data.notes}
                                    onChange={(event) => form.setData('notes', event.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="mt-4 w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700"
                                disabled={loading}
                            >
                                {loading ? 'Memproses...' : 'Lanjutkan Pembayaran'}
                            </button>
                        </form>
                    </div>

                    <aside className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Ringkasan Belanja</h2>
                        <div className="mt-4 space-y-3">
                            {items.map((item) => (
                                <div key={item.key} className="rounded-xl border border-slate-100 p-3 text-sm">
                                    <div className="font-semibold text-slate-900">{item.name}</div>
                                    {item.variant_name && <div className="text-xs text-slate-500">Varian: {item.variant_name}</div>}
                                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                        <span>{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</span>
                                        <span className="font-semibold text-slate-700">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span>Rp {summary.subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between font-semibold text-slate-900">
                                <span>Total</span>
                                <span>Rp {summary.total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </aside>
                </section>
            </main>
        </div>
    );
}
