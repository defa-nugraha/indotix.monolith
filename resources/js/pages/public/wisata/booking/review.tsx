import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { Bell, CalendarCheck, ClipboardCheck, Mail, MessageCircle, Phone, Ticket, User, UserCircle, History, ShoppingCart } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { guardPurchaseByRole } from '@/lib/purchase-guard';

type Draft = {
    destination_id: number;
    ticket_id: number;
    visit_date: string;
    quantity: number;
};

type Props = {
    draft: Draft;
    destination: {
        id: number;
        destination_name: string;
        address_full?: string | null;
        city_name?: string | null;
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

export default function WisataBookingReview({
    draft,
    destination,
    ticket,
    pricing,
    snapClientKey,
    snapScriptUrl,
    snapToken: initialSnapToken,
}: Props) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: { role?: string; name?: string; email?: string; phone?: string } }; unread_notifications?: number; souvenir_cart_count?: number };
    const role = auth?.user?.role;
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

    useEffect(() => {
        if (auth?.user?.name && !form.data.guest_name) {
            form.setData('guest_name', auth.user.name);
        }
        if (auth?.user?.email && !form.data.guest_email) {
            form.setData('guest_email', auth.user.email);
        }
        if (auth?.user?.phone && !form.data.guest_phone) {
            form.setData('guest_phone', auth.user.phone);
        }
    }, [auth?.user?.name, auth?.user?.email, auth?.user?.phone]);

    const hasPhone = Boolean(auth?.user?.phone);

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
        <PublicLayout>
            <Head title="Review Booking Wisata">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
                        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
                <section className="flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1 rounded-3xl bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-slate-900">Review Pemesanan Tiket</h1>
                                <div className="mt-2 text-sm text-slate-500">Pastikan data sudah benar sebelum melanjutkan.</div>
                            </div>
                            <ClipboardCheck className="h-6 w-6 text-sky-500" />
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Ticket className="h-4 w-4 text-sky-500" />
                                {destination.destination_name} · {destination.city_name ?? destination.address_full}
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarCheck className="h-4 w-4 text-sky-500" />
                                {draft.visit_date} · {draft.quantity} tiket
                            </div>
                        </div>
                        <form
                            className="mt-6 space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (guardPurchaseByRole(role)) {
                                    return;
                                }
                                setLoading(true);
                                form.post('/wisata/booking/confirm', {
                                    preserveScroll: true,
                                    onError: (errors) => {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Gagal',
                                            text: errors.booking ?? errors.guest_name ?? 'Tidak dapat memproses pembayaran.',
                                        });
                                        setLoading(false);
                                    },
                                    onSuccess: () => {
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
                                            readOnly
                                        />
                                    </div>
                                    {!hasPhone && (
                                        <div className="mt-1 text-xs text-rose-600">
                                            Nomor HP belum diisi. Lengkapi di{' '}
                                            <Link href="/settings/profile" className="font-semibold underline underline-offset-2">
                                                halaman profil
                                            </Link>{' '}
                                            terlebih dahulu.
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Permintaan Khusus</label>
                                    <textarea
                                        className="mt-2 min-h-[90px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        value={form.data.special_request}
                                        onChange={(event) => form.setData('special_request', event.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white disabled:opacity-70"
                                    disabled={loading || !hasPhone}
                                >
                                    {loading ? 'Memproses...' : 'Lanjutkan Pembayaran'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <aside className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">{destination.destination_name}</h2>
                        <p className="text-sm text-slate-500">{destination.city_name ?? destination.address_full}</p>
                        <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                            <div className="flex justify-between">
                                <span>Tiket</span>
                                <span className="font-semibold">{ticket.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tanggal</span>
                                <span className="font-semibold">{draft.visit_date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Jumlah</span>
                                <span className="font-semibold">{draft.quantity} tiket</span>
                            </div>
                            <div className="flex justify-between text-base font-semibold text-sky-600">
                                <span>Total</span>
                                <span>Rp {pricing.total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </aside>
                </section>
            </main>
            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <Link href="/"><img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" /></Link>
                        <p className="mt-3 text-sm text-slate-600">
                            Neo Soho Capital 40th Floor<br />
                            Jl. Tanjung Duren Raya No 1<br />
                            Jakarta Barat, DKI Jakarta 11470
                        </p>
                        <p className="mt-4 text-sm text-slate-600">0812 9205 9888</p>
                        <p className="text-sm text-slate-600">info@indotix.co.id</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Layanan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Wisata</li>
                            <li>Special Program</li>
                            <li>Event</li>
                            <li>Hotel</li>
                            <li>Retail Shop</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Perusahaan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Tentang Kami</li>
                            <li>Karir</li>
                            <li>Blog</li>
                            <li>Kebijakan Privasi</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Download Indotix</h4>
                        <div className="mt-3 h-12 w-40 rounded-lg bg-slate-900" />
                        <h4 className="mt-6 text-sm font-semibold text-slate-900">Ikuti Kami</h4>
                        <div className="mt-3 flex gap-2">
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                        </div>
                    </div>
                </div>
                <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Indotix. All rights reserved.
                </div>
            </footer>
        </PublicLayout>
    );
}
