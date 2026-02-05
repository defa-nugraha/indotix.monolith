import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarCheck, MapPinned, ShoppingBag, Star, Ticket, Bell, MessageCircle, History as HistoryIcon, UserCircle, MapPin, Clock, Users, ShoppingCart } from 'lucide-react';
import Swal from 'sweetalert2';

type EventDetail = {
    id: number;
    encrypted_id: string;
    title: string;
    description?: string | null;
    city_name?: string | null;
    location?: string | null;
    address?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    capacity_total?: number | null;
    capacity_sold?: number | null;
};

type TicketItem = {
    id: number;
    name: string;
    description?: string | null;
    price: number;
    quota: number;
    sold_count: number;
    available: number;
};

export default function EventShow({ event, tickets }: { event: EventDetail; tickets: TicketItem[] }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: any }; unread_notifications?: number; souvenir_cart_count?: number };
    const [selectedTicket, setSelectedTicket] = useState<string>(tickets[0]?.id?.toString() ?? '');
    const form = useForm({
        event_id: event.id,
        ticket_id: tickets[0]?.id ?? 0,
        quantity: 1,
    });

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Souvenir', icon: ShoppingBag, href: '/souvenir' },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Hotel', icon: Ticket, href: '/stay' },
    ];

    const submitBooking = () => {
        form.post('/events/booking/prepare', {
            preserveScroll: true,
            onError: (errors) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: errors.quantity ?? errors.ticket_id ?? 'Tidak dapat melanjutkan pemesanan.',
                    confirmButtonText: 'OK',
                });
            },
        });
    };

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title={event.title}>
                <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700" rel="stylesheet" />
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
                    <Link href="/souvenir/cart" className="relative flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600">
                        <ShoppingCart className="h-4 w-4" />
                        Keranjang
                        {Boolean(souvenir_cart_count) && (
                            <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                                {souvenir_cart_count}
                            </span>
                        )}
                    </Link>
                    {auth?.user ? (
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                            <Link href="/settings/profile" className="flex items-center gap-2 hover:text-sky-600">
                                <UserCircle className="h-4 w-4" />
                                Profile
                            </Link>
                            <Link href="/history" className="flex items-center gap-2 hover:text-sky-600">
                                <HistoryIcon className="h-4 w-4" />
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
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                                Register
                            </Link>
                            <Link href="/login" className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">
                                Login
                            </Link>
                        </div>
                    )}
                </div>
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 md:px-8">
                        {categories.map((item) => (
                            <Link key={item.label} href={item.href} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <section className="rounded-3xl bg-white p-6 shadow-sm">
                        <div className="h-56 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500">
                            <img
                                src={`https://images.unsplash.com/photo-1472653431158-6364773b2a56?q=80&w=1200&auto=format&fit=crop&sig=${event.id}`}
                                alt={event.title}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="mt-6">
                            <h1 className="text-2xl font-semibold text-slate-900">{event.title}</h1>
                            <p className="mt-2 text-sm text-slate-500">{event.description ?? 'Event pilihan Indotix.'}</p>
                            <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-sky-500" />
                                    {event.location ?? event.address ?? 'Lokasi event'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="h-4 w-4 text-sky-500" />
                                    {event.start_at ?? '-'} {event.end_at ? `- ${event.end_at}` : ''}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-sky-500" />
                                    Kapasitas {event.capacity_total ?? 0} · Terjual {event.capacity_sold ?? 0}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Pemesanan Tiket</h2>
                        <p className="text-sm text-slate-500">Pilih tiket dan jumlah yang kamu inginkan.</p>
                        <div className="mt-4 space-y-3">
                            {tickets.length === 0 && (
                                <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    Tiket event belum tersedia.
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-semibold text-slate-600">Pilih Tiket</label>
                                <select
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={selectedTicket}
                                    onChange={(event) => {
                                        setSelectedTicket(event.target.value);
                                        form.setData('ticket_id', Number(event.target.value));
                                    }}
                                    disabled={tickets.length === 0}
                                >
                                    {tickets.map((ticket) => (
                                        <option key={ticket.id} value={ticket.id}>
                                            {ticket.name} · Rp {ticket.price.toLocaleString('id-ID')} · Tersedia {ticket.available}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">Jumlah Tiket</label>
                                <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                    <button
                                        type="button"
                                        className="h-8 w-8 rounded-full bg-slate-100 text-slate-600"
                                        onClick={() => form.setData('quantity', Math.max(1, form.data.quantity - 1))}
                                        disabled={tickets.length === 0}
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        className="w-16 bg-transparent text-center outline-none"
                                        value={form.data.quantity}
                                        onChange={(event) => form.setData('quantity', Number(event.target.value))}
                                        disabled={tickets.length === 0}
                                    />
                                    <button
                                        type="button"
                                        className="h-8 w-8 rounded-full bg-sky-100 text-sky-700"
                                        onClick={() => form.setData('quantity', Math.min(20, form.data.quantity + 1))}
                                        disabled={tickets.length === 0}
                                    >
                                        +
                                    </button>
                                    <span className="text-slate-500">tiket</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={submitBooking}
                                className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                disabled={tickets.length === 0}
                            >
                                Lanjutkan Pemesanan
                            </button>
                        </div>
                    </section>
                </div>
            </main>
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
