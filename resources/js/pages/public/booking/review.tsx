import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { Bell, CalendarCheck, ClipboardCheck, Mail, Phone, Star, Ticket, User, Users, MapPinned, ShoppingBag, UserCircle, History, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function BookingReview({ draft, hotel, roomType, pricing, voucher }: any) {
    const { auth, unread_notifications } = usePage().props as { auth?: { user?: unknown }; unread_notifications?: number };
    const isUser = Boolean((auth?.user as any)?.role === 'user');
    const form = useForm({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        special_request: '',
    });
    const voucherForm = useForm({
        voucher_code: '',
    });
    const [showPrice, setShowPrice] = useState(true);

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Review Booking">
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

            <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-semibold text-slate-900">Review Booking</h1>
                                    <div className="mt-2 text-sm text-slate-500">Pastikan data sudah benar sebelum melanjutkan.</div>
                                </div>
                                <ClipboardCheck className="h-6 w-6 text-sky-500" />
                            </div>
                            <div className="mt-4 grid gap-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    {hotel.name} · {hotel.city_name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="h-4 w-4 text-sky-500" />
                                    {draft.check_in} → {draft.check_out} · {pricing.nights} malam
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-sky-500" />
                                    {roomType.name} · {draft.rooms} kamar · {draft.guests} tamu
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900">Kontak Pemesan</h2>
                                <User className="h-5 w-5 text-sky-500" />
                            </div>
                            <p className="mt-2 text-sm text-slate-500">Lengkapi data untuk menerima konfirmasi booking.</p>
                            <form
                                className="mt-4 grid gap-4"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    form.post('/booking/confirm', {
                                        onSuccess: () =>
                                            Swal.fire({ title: 'Berhasil', text: 'Booking dibuat. Lanjutkan pembayaran.', icon: 'success' }),
                                        onError: () =>
                                            Swal.fire({ title: 'Gagal', text: 'Booking gagal diproses.', icon: 'error' }),
                                    });
                                }}
                            >
                                <div className="grid gap-2">
                                    <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <input
                                            className="h-10 w-full bg-transparent text-sm outline-none"
                                            placeholder="Nama tamu"
                                            value={form.data.guest_name}
                                            onChange={(event) => form.setData('guest_name', event.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Nomor Telepon</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                            <Phone className="h-4 w-4 text-slate-400" />
                                            <input
                                                className="h-10 w-full bg-transparent text-sm outline-none"
                                                placeholder="Nomor telepon"
                                                value={form.data.guest_phone}
                                                onChange={(event) => form.setData('guest_phone', event.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Email</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                            <input
                                                className="h-10 w-full bg-transparent text-sm outline-none"
                                                placeholder="Email"
                                                value={form.data.guest_email}
                                                onChange={(event) => form.setData('guest_email', event.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-semibold text-slate-700">Permintaan Khusus (opsional)</label>
                                    <textarea
                                        className="min-h-[100px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                        placeholder="Contoh: kamar non-smoking, lantai tinggi, dll."
                                        value={form.data.special_request}
                                        onChange={(event) => form.setData('special_request', event.target.value)}
                                    />
                                </div>
                                <button className="h-12 rounded-xl bg-sky-600 text-sm font-semibold text-white shadow-sm">
                                    Konfirmasi Booking
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-700">
                                <Ticket className="h-4 w-4" />
                                Pilihan yang tepat untuk staycation kamu!
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-slate-900">{roomType.name}</h3>
                            <div className="mt-3 grid gap-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="h-4 w-4 text-sky-500" />
                                    {draft.check_in} → {draft.check_out}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-sky-500" />
                                    {draft.rooms} kamar · {draft.guests} tamu
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPinned className="h-4 w-4 text-sky-500" />
                                    {hotel.address}
                                </div>
                            </div>
                            <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between text-left font-semibold text-slate-900"
                                    onClick={() => setShowPrice((prev) => !prev)}
                                >
                                    <span>Rincian Harga</span>
                                    <span>{showPrice ? '−' : '+'}</span>
                                </button>
                                {showPrice && (
                                    <div className="mt-3 space-y-2 text-slate-600">
                                        <div className="flex items-center justify-between">
                                            <span>Harga kamar</span>
                                            <span>Rp {pricing.subtotal.toLocaleString('id-ID')}</span>
                                        </div>
                                        {pricing.discount_amount > 0 && (
                                            <div className="flex items-center justify-between text-emerald-600">
                                                <span>Diskon voucher</span>
                                                <span>- Rp {pricing.discount_amount.toLocaleString('id-ID')}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 font-semibold text-slate-900">
                                            <span>Total</span>
                                            <span>Rp {pricing.total.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-900">Promo & Voucher</h3>
                                <Ticket className="h-5 w-5 text-sky-500" />
                            </div>
                            <p className="mt-2 text-sm text-slate-500">
                                Masukkan kode voucher untuk potongan harga.
                            </p>
                            {voucher ? (
                                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-emerald-500">Voucher aktif</div>
                                            <div className="mt-1 text-base font-semibold">{voucher.code}</div>
                                            <div className="text-xs text-emerald-600">
                                                Potongan Rp {voucher.discount_amount?.toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                            onClick={() => voucherForm.post('/booking/voucher/remove')}
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form
                                    className="mt-4 flex flex-col gap-3 sm:flex-row"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        voucherForm.post('/booking/voucher', {
                                            onSuccess: () =>
                                                Swal.fire({ title: 'Berhasil', text: 'Voucher diterapkan.', icon: 'success' }),
                                            onError: (errors) =>
                                                Swal.fire({
                                                    title: 'Gagal',
                                                    text: errors.voucher_code ?? 'Voucher tidak valid.',
                                                    icon: 'error',
                                                }),
                                        });
                                    }}
                                >
                                    <input
                                        className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
                                        placeholder="Masukkan kode voucher"
                                        value={voucherForm.data.voucher_code}
                                        onChange={(event) => voucherForm.setData('voucher_code', event.target.value)}
                                    />
                                    <button className="h-11 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm">
                                        Terapkan
                                    </button>
                                </form>
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
