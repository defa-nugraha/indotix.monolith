import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { Bell, CalendarCheck, ClipboardCheck, Mail, MessageCircle, Phone, Ticket, User, UserCircle, History, ShoppingCart} from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';

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
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: { role?: string; name?: string; email?: string; phone?: string } }; unread_notifications?: number; souvenir_cart_count?: number };
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
        <PublicLayout>
            <Head title="Review Booking Special Program" />
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
                                    onSuccess: (page: any) => {
                                        const token = page?.props?.snapToken as string | undefined;
                                        if (token) {
                                            setSnapToken(token);
                                            if (window.snap) {
                                                snapOpened.current = true;
                                                window.snap.pay(token);
                                            }
                                        }
                                        setLoading(false);
                                    },
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
                            </div>
                            <button
                                type="submit"
                                className="mt-4 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                                disabled={loading || !hasPhone}
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
        </PublicLayout>
    );
}
