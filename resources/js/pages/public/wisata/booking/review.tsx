import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import {
    CalendarCheck,
    ClipboardCheck,
    Mail,
    Phone,
    Ticket,
    User,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { PublicFooter } from '@/components/public-footer';
import PublicLayout from '@/layouts/public-layout';
import { guardPurchaseByRole } from '@/lib/purchase-guard';

type Draft = {
    destination_id: number;
    ticket_id: number;
    visit_date: string;
    quantity: number;
    items?: Array<{ ticket_id: number; quantity: number }>;
};

type TicketLineItem = {
    ticket_id: number;
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
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
        subtotal?: number;
        discount_amount?: number;
        total: number;
        quantity?: number;
    };
    voucher?: {
        code: string;
        discount_type: string;
        discount_value: number;
        discount_amount: number;
    } | null;
    pendingVoucherCode?: string | null;
    items?: TicketLineItem[];
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
    voucher = null,
    pendingVoucherCode = null,
    items = [],
    snapClientKey,
    snapScriptUrl,
    snapToken: initialSnapToken,
}: Props) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage()
        .props as {
        auth?: {
            user?: {
                role?: string;
                name?: string;
                email?: string;
                phone?: string;
            };
        };
        unread_notifications?: number;
        souvenir_cart_count?: number;
    };
    const role = auth?.user?.role;
    const isUser = Boolean(auth?.user?.role === 'user');
    const form = useForm({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        special_request: '',
    });
    const voucherForm = useForm({
        voucher_code: voucher?.code ?? pendingVoucherCode ?? '',
    });
    const [loading, setLoading] = useState(false);
    const [snapToken, setSnapToken] = useState<string | null>(
        initialSnapToken ?? null,
    );
    const snapOpened = useRef(false);
    const ticketItems =
        items.length > 0
            ? items
            : [
                  {
                      ticket_id: ticket.id,
                      name: ticket.name,
                      quantity: draft.quantity,
                      unit_price: ticket.price,
                      subtotal: ticket.price * draft.quantity,
                  },
              ];
    const totalQuantity =
        pricing.quantity ??
        ticketItems.reduce((total, item) => total + item.quantity, 0);

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

    useEffect(() => {
        if (!voucher && pendingVoucherCode && !voucherForm.data.voucher_code) {
            voucherForm.setData('voucher_code', pendingVoucherCode);
        }
    }, [pendingVoucherCode, voucher]);

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
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
                <div className="mx-auto w-full max-w-3xl">
                    <div className="relative z-0 flex items-center justify-between">
                        <div className="absolute top-1/2 right-0 left-0 z-0 h-1 -translate-y-1/2 bg-slate-200" />
                        <div className="absolute top-1/2 left-0 z-0 h-1 w-1/2 -translate-y-1/2 bg-sky-600" />
                        {[
                            ['1', 'Detail'],
                            ['2', 'Pembayaran'],
                            ['3', 'Selesai'],
                        ].map(([number, label], index) => (
                            <div
                                key={label}
                                className={`relative z-10 flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-bold shadow-sm ${
                                    index === 0
                                        ? 'border-sky-200 text-sky-600'
                                        : 'border-slate-200 text-slate-400'
                                }`}
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                                        index === 0
                                            ? 'bg-sky-600 text-white'
                                            : 'bg-slate-200 text-slate-500'
                                    }`}
                                >
                                    {number}
                                </span>
                                {label}
                            </div>
                        ))}
                    </div>
                </div>

                <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
                    <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.34)] sm:p-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="font-['Space_Grotesk'] text-2xl font-black text-slate-950">
                                    Review Pemesanan Tiket
                                </h1>
                                <div className="mt-2 text-sm text-slate-500">
                                    Pastikan data sudah benar sebelum
                                    melanjutkan.
                                </div>
                            </div>
                            <ClipboardCheck className="h-6 w-6 text-sky-500" />
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-slate-600">
                            <div className="flex min-w-0 items-start gap-2">
                                <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                                <span className="min-w-0 break-words">
                                    {destination.destination_name} ·{' '}
                                    {destination.city_name ??
                                        destination.address_full}
                                </span>
                            </div>
                            <div className="flex min-w-0 items-start gap-2">
                                <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                                <span className="min-w-0 break-words">
                                    {draft.visit_date} · {totalQuantity} tiket
                                </span>
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
                                            text:
                                                errors.booking ??
                                                errors.guest_name ??
                                                'Tidak dapat memproses pembayaran.',
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
                                    <Label required className="text-slate-700">
                                        Nama Lengkap
                                    </Label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full text-sm font-medium focus:outline-none"
                                            value={form.data.guest_name}
                                            onChange={(event) =>
                                                form.setData(
                                                    'guest_name',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label required className="text-slate-700">
                                        Email
                                    </Label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full text-sm font-medium focus:outline-none"
                                            type="email"
                                            value={form.data.guest_email}
                                            onChange={(event) =>
                                                form.setData(
                                                    'guest_email',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label required className="text-slate-700">
                                        Nomor HP
                                    </Label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full text-sm font-medium focus:outline-none"
                                            value={form.data.guest_phone}
                                            readOnly
                                        />
                                    </div>
                                    {!hasPhone && (
                                        <div className="mt-1 text-xs text-rose-600">
                                            Nomor HP belum diisi. Lengkapi di{' '}
                                            <Link
                                                href="/settings/profile"
                                                className="font-semibold underline underline-offset-2"
                                            >
                                                halaman profil
                                            </Link>{' '}
                                            terlebih dahulu.
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Permintaan Khusus
                                    </label>
                                    <textarea
                                        className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sky-400 focus:ring-4 focus:ring-sky-100 focus:outline-none"
                                        value={form.data.special_request}
                                        onChange={(event) =>
                                            form.setData(
                                                'special_request',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="w-full rounded-2xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-sky-700 disabled:opacity-70 sm:w-auto"
                                    disabled={loading || !hasPhone}
                                >
                                    {loading
                                        ? 'Memproses...'
                                        : pricing.total <= 0
                                          ? 'Konfirmasi Tiket'
                                          : 'Lanjutkan Pembayaran'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <aside className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.34)] lg:sticky lg:top-28">
                        <h2 className="font-['Space_Grotesk'] text-xl font-black text-slate-950">
                            {destination.destination_name}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {destination.city_name ?? destination.address_full}
                        </p>
                        <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                            <div className="flex justify-between">
                                <span>Tiket</span>
                                <span className="font-semibold">
                                    {ticketItems.length} jenis tiket
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tanggal</span>
                                <span className="font-semibold">
                                    {draft.visit_date}
                                </span>
                            </div>
                            <div className="space-y-2 border-t border-slate-200 pt-3">
                                {ticketItems.map((item) => (
                                    <div
                                        key={item.ticket_id}
                                    className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                                >
                                        <div className="min-w-0">
                                            <div className="break-words font-semibold text-slate-900">
                                                {item.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {item.quantity} x Rp{' '}
                                                {item.unit_price.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-left font-semibold text-slate-900 sm:text-right">
                                            Rp{' '}
                                            {item.subtotal.toLocaleString(
                                                'id-ID',
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {(pricing.discount_amount ?? 0) > 0 && (
                                <div className="space-y-2 border-t border-slate-200 pt-3">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-slate-900">
                                            Rp {(pricing.subtotal ?? pricing.total).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Diskon voucher</span>
                                        <span className="font-semibold">
                                            - Rp {(pricing.discount_amount ?? 0).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-black text-sky-600">
                                <span>Total</span>
                                <span>
                                    Rp {pricing.total.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-950">
                                    Promo & Voucher
                                </h3>
                                <Ticket className="h-4 w-4 text-sky-500" />
                            </div>
                            {voucher ? (
                                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase text-emerald-500">
                                                Voucher aktif
                                            </p>
                                            <p className="mt-1 font-black">
                                                {voucher.code}
                                            </p>
                                            <p className="text-xs">
                                                Potongan Rp {voucher.discount_amount.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                            onClick={() => voucherForm.post('/wisata/booking/voucher/remove')}
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form
                                    className="mt-3 flex flex-col gap-2 sm:flex-row lg:flex-col"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        voucherForm.post('/wisata/booking/voucher', {
                                            preserveScroll: true,
                                            onSuccess: () =>
                                                Swal.fire({
                                                    title: 'Berhasil',
                                                    text: 'Voucher diterapkan.',
                                                    icon: 'success',
                                                }),
                                            onError: (errors) =>
                                                Swal.fire({
                                                    title: 'Gagal',
                                                    text:
                                                        errors.voucher_code ??
                                                        'Voucher tidak valid.',
                                                    icon: 'error',
                                                }),
                                        });
                                    }}
                                >
                                    <input
                                        className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm focus:border-sky-400 focus:ring-4 focus:ring-sky-100 focus:outline-none"
                                        aria-label="Kode voucher"
                                        required
                                        placeholder="Masukkan kode voucher"
                                        value={voucherForm.data.voucher_code}
                                        onChange={(event) =>
                                            voucherForm.setData(
                                                'voucher_code',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <button
                                        type="submit"
                                        className="h-11 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm disabled:opacity-70"
                                        disabled={voucherForm.processing}
                                    >
                                        Terapkan
                                    </button>
                                </form>
                            )}
                        </div>
                    </aside>
                </section>
            </main>
            <PublicFooter />
        </PublicLayout>
    );
}
