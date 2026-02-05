import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { Bell, CalendarCheck, ClipboardCheck, Mail, MessageCircle, Phone, Ticket, User, UserCircle, History, ShoppingCart, MapPinned, ShoppingBag, Star, BookOpen, MapPin, CreditCard } from 'lucide-react';

type Draft = {
    class_id: number;
    ticket_id: number;
    quantity: number;
};

type Props = {
    draft: Draft;
    class: {
        id: number;
        title: string;
        category?: string | null;
        location_detail?: string | null;
        start_at?: string | null;
    };
    ticket: {
        id: number;
        name: string;
        price: number;
    };
    pricing: {
        total: number;
    };
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

export default function AcademyBookingReview({
    draft,
    class: academyClass,
    ticket,
    pricing,
    snapClientKey,
    snapScriptUrl,
    snapToken: initialSnapToken,
}: Props) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: { role?: string; name?: string; email?: string } }; unread_notifications?: number; souvenir_cart_count?: number };
    const isUser = Boolean(auth?.user?.role === 'user');
    const form = useForm({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        special_request: '',
    });
    const [loading, setLoading] = useState(false);
    const [snapToken, setSnapToken] = useState<string | null>(initialSnapToken ?? null);
    const snapOpened = useRef(false);
    const pricePerTicket = Number(ticket.price) || 0;

    useEffect(() => {
        if (auth?.user?.name && !form.data.guest_name) {
            form.setData('guest_name', auth.user.name);
        }
        if (auth?.user?.email && !form.data.guest_email) {
            form.setData('guest_email', auth.user.email);
        }
    }, [auth?.user?.name, auth?.user?.email]);

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

    const submitBooking = () => {
        setLoading(true);
        form.post('/academy/booking/confirm', {
            preserveScroll: true,
            onError: (errors) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: errors.booking ?? errors.guest_name ?? 'Tidak dapat memproses pembayaran.',
                    confirmButtonText: 'OK',
                });
                setLoading(false);
            },
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Pesanan dibuat',
                    text: 'Silakan lanjutkan pembayaran.',
                    timer: 1500,
                    showConfirmButton: false,
                });
                setLoading(false);
            },
        });
    };

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Souvenir', icon: ShoppingBag, href: '/souvenir' },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Academy', icon: BookOpen, href: '/academy' },
        { label: 'Hotel', icon: Ticket, href: '/stay' },
    ];

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Review Booking Academy">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
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
                            <Link
                                href="/register"
                                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                            >
                                Register
                            </Link>
                            <Link
                                href="/login"
                                className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                            >
                                Login
                            </Link>
                        </div>
                    )}
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
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 md:px-8 text-sm font-semibold text-slate-600">
                        <div className="flex items-center gap-2 text-slate-900">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">1</span>
                            Review
                        </div>
                        <span className="text-slate-300">—</span>
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-500">2</span>
                            Bayar
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
                <section className="flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1 rounded-3xl bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-slate-900">Review Pemesanan Academy</h1>
                                <div className="mt-2 text-sm text-slate-500">Pastikan data sudah benar sebelum melanjutkan.</div>
                            </div>
                            <ClipboardCheck className="h-6 w-6 text-sky-500" />
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-sky-500" />
                                {academyClass.title}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-sky-500" />
                                {academyClass.location_detail ?? '-'}
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarCheck className="h-4 w-4 text-sky-500" />
                                {academyClass.start_at ?? '-'}
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Ticket className="h-4 w-4 text-sky-500" />
                                    {ticket.name}
                                </div>
                                <div className="font-semibold text-slate-900">Rp {pricePerTicket.toLocaleString('id-ID')}</div>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">Jumlah tiket: {draft.quantity}</div>
                        </div>

                        <div className="mt-6">
                            <h2 className="text-base font-semibold text-slate-900">Data Pemesan</h2>
                            <div className="mt-4 grid gap-4">
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                                    <User className="h-4 w-4 text-slate-400" />
                                    <input
                                        value={form.data.guest_name}
                                        onChange={(event) => form.setData('guest_name', event.target.value)}
                                        placeholder="Nama lengkap"
                                        className="w-full bg-transparent text-sm outline-none"
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <input
                                            value={form.data.guest_phone}
                                            onChange={(event) => form.setData('guest_phone', event.target.value)}
                                            placeholder="Nomor telepon"
                                            className="w-full bg-transparent text-sm outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <input
                                            value={form.data.guest_email}
                                            onChange={(event) => form.setData('guest_email', event.target.value)}
                                            placeholder="Email"
                                            className="w-full bg-transparent text-sm outline-none"
                                        />
                                    </div>
                                </div>
                                <textarea
                                    value={form.data.special_request}
                                    onChange={(event) => form.setData('special_request', event.target.value)}
                                    placeholder="Catatan khusus (opsional)"
                                    rows={3}
                                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-[360px]">
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <div className="text-sm font-semibold text-slate-700">Ringkasan Harga</div>
                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Harga per tiket</span>
                                    <span>Rp {pricePerTicket.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Jumlah tiket</span>
                                    <span>{draft.quantity}</span>
                                </div>
                                <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                                    <span>Total</span>
                                    <span>Rp {Number(pricing.total).toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 rounded-3xl bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <CreditCard className="h-5 w-5 text-sky-500" />
                                Booking kamu sudah siap, lanjutkan pembayaran.
                            </div>
                            <button
                                type="button"
                                onClick={submitBooking}
                                className="mt-4 w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                                disabled={loading}
                            >
                                {loading ? 'Memproses...' : 'Lanjutkan Pembayaran'}
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
