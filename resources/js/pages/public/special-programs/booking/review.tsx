import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { Bell, CalendarCheck, ClipboardCheck, Mail, MessageCircle, Phone, Ticket, User, UserCircle, History } from 'lucide-react';

type Draft = {
    program_id: number;
    item_type: string;
    item_id: number;
    ticket_id?: number | null;
    visit_date?: string | null;
    quantity: number;
};

type Props = {
    draft: Draft;
    program: { id: number; name: string; program_type: string };
    item: { title: string; city_name?: string | null };
    ticket: { name: string; price: number };
    pricing: { total: number };
    snapClientKey: string;
    snapScriptUrl: string;
    snapToken?: string | null;
};

declare global {
    interface Window {
        snap?: { pay: (token: string, options?: Record<string, unknown>) => void };
    }
}

export default function SpecialProgramBookingReview({
    draft,
    program,
    item,
    ticket,
    pricing,
    snapClientKey,
    snapScriptUrl,
    snapToken: initialSnapToken,
}: Props) {
    const { auth, unread_notifications } = usePage().props as { auth?: { user?: { role?: string; name?: string; email?: string } }; unread_notifications?: number };
    const isUser = Boolean(auth?.user?.role === 'user');
    const form = useForm({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [snapToken, setSnapToken] = useState<string | null>(initialSnapToken ?? null);
    const snapOpened = useRef(false);

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

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Review Booking Special Program" />
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" />
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
                            <Link href="/register" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">Register</Link>
                            <Link href="/login" className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">Login</Link>
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
            </header>

            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
                <section className="flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1 rounded-3xl bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-slate-900">Review Pemesanan Special Program</h1>
                                <div className="mt-2 text-sm text-slate-500">Pastikan data sudah benar sebelum melanjutkan.</div>
                            </div>
                            <ClipboardCheck className="h-6 w-6 text-sky-500" />
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Ticket className="h-4 w-4 text-sky-500" />
                                {program.name} · {item.title}
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarCheck className="h-4 w-4 text-sky-500" />
                                {draft.visit_date ?? '-'} · {draft.quantity} tiket
                            </div>
                        </div>
                        <form
                            className="mt-6 space-y-4"
                            onSubmit={(eventSubmit) => {
                                eventSubmit.preventDefault();
                                setLoading(true);
                                form.post('/special-programs/booking/confirm', {
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
                                });
                            }}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Nama lengkap</label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            className="w-full text-sm focus:outline-none"
                                            value={form.data.guest_name}
                                            onChange={(eventChange) => form.setData('guest_name', eventChange.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Email</label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <input
                                            type="email"
                                            className="w-full text-sm focus:outline-none"
                                            value={form.data.guest_email}
                                            onChange={(eventChange) => form.setData('guest_email', eventChange.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Nomor HP</label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            className="w-full text-sm focus:outline-none"
                                            value={form.data.guest_phone}
                                            onChange={(eventChange) => form.setData('guest_phone', eventChange.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="mt-4 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                                disabled={loading}
                            >
                                {loading ? 'Memproses...' : 'Lanjutkan Pembayaran'}
                            </button>
                        </form>
                    </div>

                    <aside className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Ringkasan Pesanan</h2>
                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            <div className="flex items-center justify-between">
                                <span>Program</span>
                                <span className="font-semibold text-slate-900">{program.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Produk</span>
                                <span className="font-semibold text-slate-900">{item.title}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Jumlah tiket</span>
                                <span className="font-semibold text-slate-900">{draft.quantity}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Harga per tiket</span>
                                <span className="font-semibold text-slate-900">Rp {Number(ticket.price).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                                <span>Total</span>
                                <span className="text-lg font-semibold text-sky-600">Rp {pricing.total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </aside>
                </section>
            </main>
        </div>
    );
}
