import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { Bell, ClipboardCheck, Mail, MessageCircle, Phone, ShoppingBag, User, UserCircle, History, ShoppingCart } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { guardPurchaseByRole } from '@/lib/purchase-guard';

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
    const { auth, unread_notifications, souvenir_cart_count, default_address } = usePage().props as {
        auth?: { user?: { role?: string; name?: string; email?: string; phone?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
        default_address?: { label?: string | null; formatted?: string | null };
    };
    const role = auth?.user?.role;
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
        if (auth?.user?.name && !form.data.guest_name) {
            form.setData('guest_name', auth.user.name);
        }
        if (auth?.user?.email && !form.data.guest_email) {
            form.setData('guest_email', auth.user.email);
        }
        if (auth?.user?.phone && !form.data.guest_phone) {
            form.setData('guest_phone', auth.user.phone);
        }
        if (default_address?.formatted && !form.data.shipping_address) {
            form.setData('shipping_address', default_address.formatted);
        }
    }, [auth?.user?.name, auth?.user?.email, auth?.user?.phone, default_address?.formatted]);

    const hasPhone = Boolean(auth?.user?.phone);
    const hasAddress = Boolean(default_address?.formatted);

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
            <Head title="Review Pemesanan Retail Shop" />
                        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
                <section className="flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1 rounded-3xl bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-slate-900">Review Pemesanan Retail Shop</h1>
                                <div className="mt-2 text-sm text-slate-500">Lengkapi data pengiriman sebelum bayar.</div>
                            </div>
                            <ClipboardCheck className="h-6 w-6 text-sky-500" />
                        </div>

                        <form
                            className="mt-6 space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (guardPurchaseByRole(role)) {
                                    return;
                                }
                                setLoading(true);
                                form.post('/retail-shop/checkout/confirm', {
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
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Alamat Pengiriman</label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <ShoppingBag className="h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full text-sm focus:outline-none"
                                            value={form.data.shipping_address}
                                            readOnly
                                        />
                                    </div>
                                    {default_address?.label && (
                                        <div className="mt-1 text-xs text-slate-500">Alamat: {default_address.label}</div>
                                    )}
                                    {!hasAddress && (
                                        <div className="mt-1 text-xs text-rose-600">
                                            Alamat utama belum diisi. Lengkapi di{' '}
                                            <Link href="/settings/profile" className="font-semibold underline underline-offset-2">
                                                halaman profil
                                            </Link>{' '}
                                            terlebih dahulu.
                                        </div>
                                    )}
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
                                disabled={loading || !hasPhone || !hasAddress}
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
        </PublicLayout>
    );
}
