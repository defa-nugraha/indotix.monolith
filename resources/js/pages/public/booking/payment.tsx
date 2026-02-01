import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Bell, CalendarCheck, CreditCard, QrCode, Wallet, Landmark, ShoppingBag, Ticket, Users, MapPinned, UserCircle, History, MessageCircle } from 'lucide-react';

type PaymentOption = { id: string; label: string };

type Booking = {
    id: number;
    encrypted_id?: string;
    status: string;
    payment_status?: string | null;
    payment_deadline?: string | null;
    hotel: { name?: string | null; address?: string | null };
    check_in: string;
    check_out: string;
    nights: number;
    rooms_count: number;
    guests_count: number;
    subtotal?: number;
    discount_amount?: number | null;
    voucher_code?: string | null;
    total: number;
    payment?: { status?: string | null; payment_type?: string | null; payload?: any } | null;
};

export default function BookingPayment({ booking, paymentOptions }: { booking: Booking; paymentOptions: PaymentOption[] }) {
    const { auth } = usePage().props as { auth?: { user?: unknown } };
    const isUser = Boolean((auth?.user as any)?.role === 'user');
    const form = useForm({ payment_type: '' });
    const [remaining, setRemaining] = useState<number | null>(null);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    useEffect(() => {
        if (!booking.payment_deadline) return;
        const deadline = new Date(booking.payment_deadline).getTime();
        const interval = setInterval(() => {
            const diff = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
            setRemaining(diff);
        }, 1000);
        return () => clearInterval(interval);
    }, [booking.payment_deadline]);

    const countdown = useMemo(() => {
        if (remaining === null) return '-';
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, [remaining]);

    const instruction = booking.payment?.payload;
    const vaNumbers = instruction?.va_numbers ?? [];
    const permataVa = instruction?.permata_va_number;
    const qrisAction = instruction?.actions?.find((action: any) => action?.name?.includes('qr-code'))?.url;

    const paymentGroups = [
        {
            id: 'qris',
            label: 'QRIS',
            icon: QrCode,
            options: paymentOptions.filter((item) => item.id === 'qris'),
        },
        {
            id: 'va',
            label: 'Transfer Bank (VA)',
            icon: Landmark,
            options: paymentOptions.filter((item) => item.id.endsWith('_va')),
        },
        {
            id: 'ewallet',
            label: 'E-Wallet',
            icon: Wallet,
            options: paymentOptions.filter((item) => ['gopay', 'shopeepay', 'ovo', 'dana', 'linkaja'].includes(item.id)),
        },
        {
            id: 'card',
            label: 'Kartu Kredit/Debit',
            icon: CreditCard,
            options: paymentOptions.filter((item) => item.id === 'credit_card'),
        },
        {
            id: 'retail',
            label: 'Mini Market',
            icon: ShoppingBag,
            options: paymentOptions.filter((item) => ['alfamart', 'indomaret'].includes(item.id)),
        },
    ].filter((group) => group.options.length > 0);

    const bankLogoMap: Record<string, string> = {
        bca_va: '/images/logo/bca.png',
        bni_va: '/images/logo/bni.png',
        bri_va: '/images/logo/bri.png',
        mandiri_va: '/images/logo/mandiri.png',
        permata_va: '/images/logo/permata_bank.png',
    };
    const paymentLogoMap: Record<string, string[]> = {
        qris: ['/images/logo/qris.png'],
        gopay: ['/images/logo/gopay.png'],
        shopeepay: ['/images/logo/shopeepay.png'],
        dana: ['/images/logo/dan+dan.png'],
        ovo: [],
        linkaja: [],
        credit_card: ['/images/logo/visa.png', '/images/logo/mastercard.png'],
        alfamart: ['/images/logo/alfamart.png'],
        indomaret: ['/images/logo/indomaret.png'],
    };

    useEffect(() => {
        if (!form.data.payment_type) {
            setExpandedGroup(null);
            return;
        }
        if (form.data.payment_type.endsWith('_va')) {
            setExpandedGroup('va');
            return;
        }
        const group = paymentGroups.find((item) => item.options.some((opt) => opt.id === form.data.payment_type));
        setExpandedGroup(group?.id ?? null);
    }, [form.data.payment_type, paymentGroups]);

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Pembayaran">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
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
                            <Link
                                href="/register"
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
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
                            <Link href="/notifications" className="flex items-center gap-2 hover:text-sky-600">
                                <Bell className="h-4 w-4" />
                                Notifikasi
                            </Link>
                        </div>
                    )}
                </div>
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 md:px-8 text-sm font-semibold text-slate-600">
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-500">1</span>
                            Review
                        </div>
                        <span className="text-slate-300">—</span>
                        <div className="flex items-center gap-2 text-slate-900">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">2</span>
                            Bayar
                        </div>
                    </div>
                </div>
            </header>

            <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <h1 className="text-2xl font-semibold text-slate-900">Pembayaran</h1>
                            <p className="mt-2 text-sm text-slate-500">Selesaikan pembayaran sebelum {countdown}.</p>
                            <div className="mt-4 grid gap-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Ticket className="h-4 w-4 text-sky-500" />
                                    {booking.hotel.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="h-4 w-4 text-sky-500" />
                                    {booking.check_in} → {booking.check_out} · {booking.nights} malam
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-sky-500" />
                                    {booking.rooms_count} kamar · {booking.guests_count} tamu
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPinned className="h-4 w-4 text-sky-500" />
                                    {booking.hotel.address}
                                </div>
                            </div>
                            <div className="mt-4 text-lg font-semibold text-sky-600">Rp {booking.total.toLocaleString('id-ID')}</div>
                            <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Subtotal</span>
                                    <span>Rp {(booking.subtotal ?? booking.total).toLocaleString('id-ID')}</span>
                                </div>
                                {booking.discount_amount && booking.discount_amount > 0 && (
                                    <div className="mt-2 flex items-center justify-between text-emerald-600">
                                        <span>Voucher {booking.voucher_code ?? ''}</span>
                                        <span>- Rp {booking.discount_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="mt-2 flex items-center justify-between border-t border-dashed border-slate-200 pt-2 font-semibold text-slate-900">
                                    <span>Total</span>
                                    <span>Rp {booking.total.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Metode Pembayaran</h2>
                            <form
                                className="mt-4 grid gap-3"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    form.post(`/booking/${booking.encrypted_id ?? booking.id}/payment`, {
                                        onSuccess: () =>
                                            Swal.fire({ title: 'Berhasil', text: 'Instruksi pembayaran dibuat.', icon: 'success' }),
                                        onError: (errors) =>
                                            Swal.fire({
                                                title: 'Gagal',
                                                text: errors.payment ?? 'Pembayaran gagal dibuat.',
                                                icon: 'error',
                                            }),
                                    });
                                }}
                            >
                                <div className="grid gap-3">
                                    {paymentGroups.map((group) => {
                                        const Icon = group.icon;
                                        const isActive = form.data.payment_type.startsWith(group.id);
                                        return (
                                            <div key={group.id} className="space-y-2">
                                                <button
                                                    type="button"
                                                    className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm transition ${
                                                        expandedGroup === group.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200'
                                                    } hover:border-sky-300`}
                                                    onClick={() => {
                                                        if (group.options.length <= 1) {
                                                            const fallback = group.options[0]?.id ?? group.id;
                                                            form.setData('payment_type', fallback);
                                                            setExpandedGroup(null);
                                                            return;
                                                        }
                                                        setExpandedGroup((prev) => (prev === group.id ? null : group.id));
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Icon className="h-5 w-5 text-sky-600" />
                                                        <span className="text-sm font-semibold text-slate-900">{group.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            {group.options.slice(0, 3).flatMap((option) =>
                                                                (paymentLogoMap[option.id] ?? []).map((logo) => (
                                                                    <img
                                                                        key={`${group.id}-${option.id}-${logo}`}
                                                                        src={logo}
                                                                        alt={option.label}
                                                                        className="h-5 w-auto object-contain"
                                                                    />
                                                                ))
                                                            )}
                                                        </div>
                                                        <span className="text-slate-400">›</span>
                                                    </div>
                                                </button>

                                                {expandedGroup === group.id && group.id === 'va' && group.options.length > 0 && (
                                                    <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3">
                                                        <div className="text-xs font-semibold text-slate-500">Pilih Bank</div>
                                                        <div className="grid gap-2 sm:grid-cols-2">
                                                            {group.options.map((option) => (
                                                                <button
                                                                    key={option.id}
                                                                    type="button"
                                                                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                                                                        form.data.payment_type === option.id
                                                                            ? 'border-sky-500 bg-sky-50 text-sky-700'
                                                                            : 'border-slate-200 text-slate-600 hover:border-sky-300'
                                                                    }`}
                                                                    onClick={() => form.setData('payment_type', option.id)}
                                                                >
                                                                    <span className="flex items-center gap-2">
                                                                        {bankLogoMap[option.id] && (
                                                                            <img
                                                                                src={bankLogoMap[option.id]}
                                                                                alt={option.label}
                                                                                className="h-6 w-auto object-contain"
                                                                            />
                                                                        )}
                                                                        <span>{option.label}</span>
                                                                    </span>
                                                                    <span className="text-slate-400">›</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {expandedGroup === group.id && group.id !== 'va' && group.options.length > 1 && (
                                                    <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3">
                                                        <div className="text-xs font-semibold text-slate-500">Pilih Opsi</div>
                                                        <div className="grid gap-2 sm:grid-cols-2">
                                                            {group.options.map((option) => (
                                                                <button
                                                                    key={option.id}
                                                                    type="button"
                                                                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                                                                        form.data.payment_type === option.id
                                                                            ? 'border-sky-500 bg-sky-50 text-sky-700'
                                                                            : 'border-slate-200 text-slate-600 hover:border-sky-300'
                                                                    }`}
                                                                    onClick={() => form.setData('payment_type', option.id)}
                                                                >
                                                                    <span className="flex items-center gap-2">
                                                                        {(paymentLogoMap[option.id] ?? []).map((logo) => (
                                                                            <img key={`${option.id}-${logo}`} src={logo} alt={option.label} className="h-6 w-auto object-contain" />
                                                                        ))}
                                                                        <span>{option.label}</span>
                                                                    </span>
                                                                    <span className="text-slate-400">›</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    className="flex h-11 items-center justify-center gap-2 rounded-lg bg-sky-600 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                                    disabled={form.processing}
                                >
                                    {form.processing && (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                                    )}
                                    {form.processing ? 'Memproses...' : 'Lanjutkan Pembayaran'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-700">
                                <Ticket className="h-4 w-4" />
                                Booking kamu sudah siap, lanjutkan pembayaran.
                            </div>
                            <div className="mt-4 text-sm text-slate-600">
                                Status: <span className="font-semibold text-slate-900">{booking.status}</span>
                            </div>

                            {instruction && (
                                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                                    <div className="font-semibold text-slate-900">Instruksi Pembayaran</div>

                                    {qrisAction && (
                                        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-white p-4 text-center">
                                            <img src={qrisAction} alt="QRIS" className="h-48 w-48 rounded-lg border border-slate-200 object-contain" />
                                            <div className="text-xs text-slate-500">Scan QRIS untuk melanjutkan pembayaran.</div>
                                        </div>
                                    )}

                                    {vaNumbers.length > 0 && (
                                        <div className="mt-3 space-y-2 text-sm">
                                            {vaNumbers.map((va: any) => (
                                                <div key={`${va.bank}-${va.va_number}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                                                    <span className="text-slate-700">{va.bank?.toUpperCase()} Virtual Account</span>
                                                    <span className="font-semibold text-slate-900">{va.va_number}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {permataVa && (
                                        <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                                            <span className="text-slate-700">PERMATA Virtual Account</span>
                                            <span className="font-semibold text-slate-900">{permataVa}</span>
                                        </div>
                                    )}

                                    <div className="mt-3 grid gap-2 text-xs text-slate-500">
                                        {instruction?.order_id && <div>Order ID: {instruction.order_id}</div>}
                                        {instruction?.expiry_time && <div>Berakhir: {instruction.expiry_time}</div>}
                                        {instruction?.transaction_status && <div>Status: {instruction.transaction_status}</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <img src="/logo.png" alt="Indotix" className="h-8" />
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
                            <li>Souvenir</li>
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
        </div>
    );
}
