import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarCheck, MapPinned, ShoppingBag, Star, Ticket, Bell, MessageCircle, UserCircle, History as HistoryIcon, Sparkles, ShoppingCart } from 'lucide-react';

const navItems = [
    { label: 'Wisata', icon: MapPinned, href: '/wisata' },
    { label: 'Event', icon: CalendarCheck, href: '/events' },
    { label: 'Souvenir', icon: ShoppingBag, href: '/souvenir' },
    { label: 'Spesial Program', icon: Star, href: '/special-programs', active: true },
    { label: 'Hotel', icon: Ticket, href: '/stay' },
];

type ProgramItem = {
    type: 'hotel' | 'wisata' | 'event';
    id: number;
    encrypted_id: string;
    title: string;
    city_name?: string | null;
    description?: string | null;
    image_url?: string | null;
    price?: number | null;
};

type Program = {
    id: number;
    encrypted_id: string;
    name: string;
    program_type: string;
    status: string;
    starts_at?: string | null;
    ends_at?: string | null;
    highlight_level?: string | null;
    description_internal?: string | null;
    terms?: string | null;
    discount?: Record<string, any> | null;
    rules?: Record<string, any> | null;
};

export default function SpecialProgramShow({ program, items }: { program: Program; items: ProgramItem[] }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: { role?: string } }; unread_notifications?: number; souvenir_cart_count?: number };
    const [selectedItem, setSelectedItem] = useState<ProgramItem | null>(
        items.find((item) => item.type !== 'hotel') ?? items[0] ?? null,
    );
    const [quantity, setQuantity] = useState(1);
    const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));

    const submitBooking = () => {
        if (!selectedItem) return;
        if (selectedItem.type === 'hotel') {
            window.location.href = `/stay/hotels/${selectedItem.encrypted_id}`;
            return;
        }
        router.post('/special-programs/booking/prepare', {
            program_id: program.id,
            item_type: selectedItem.type,
            item_id: selectedItem.id,
            quantity,
            visit_date: selectedItem.type === 'hotel' ? null : visitDate,
        });
    };

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title={program.name} />
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
                            <Link href="/register" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
                                Register
                            </Link>
                            <Link href="/login" className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">
                                Login
                            </Link>
                        </div>
                    )}
                    {auth?.user?.role === 'user' && (
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                            <Link href="/settings/profile" className="flex items-center gap-2 hover:text-sky-600">
                                <UserCircle className="h-4 w-4" />
                                Profile
                            </Link>
                            <Link href="/history" className="flex items-center gap-2 hover:text-sky-600">
                                <HistoryIcon className="h-4 w-4" />
                                Riwayat
                            </Link>
                            <Link href="/chat" className="flex items-center gap-2 hover:text-sky-600">
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
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 md:px-8">
                        {navItems.map((item) => (
                            <Link key={item.label} href={item.href} className={`flex items-center gap-2 text-sm font-semibold ${item.active ? 'text-slate-900' : 'text-slate-500'}`}>
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Special Program</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{program.name}</h1>
                            <p className="mt-2 text-sm text-slate-500">{program.program_type} · {program.starts_at ?? '-'} → {program.ends_at ?? '-'}</p>
                        </div>
                        <Sparkles className="h-10 w-10 text-sky-500" />
                    </div>
                    {program.terms && (
                        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                            {program.terms}
                        </div>
                    )}
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Produk dalam program</h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {items.map((item) => (
                                <button
                                    key={`${item.type}-${item.id}`}
                                    type="button"
                                    onClick={() => setSelectedItem(item)}
                                    className={`rounded-2xl border px-4 py-3 text-left ${selectedItem?.id === item.id ? 'border-sky-300 bg-sky-50' : 'border-slate-100 bg-white'}`}
                                >
                                    <div className="text-xs text-slate-500">{item.type.toUpperCase()}</div>
                                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                                    <div className="mt-1 text-xs text-slate-500">{item.city_name ?? 'Indonesia'}</div>
                                    {item.price ? (
                                        <div className="mt-2 text-xs font-semibold text-sky-600">Mulai Rp {Number(item.price).toLocaleString('id-ID')}</div>
                                    ) : (
                                        <div className="mt-2 text-[11px] text-slate-400">Harga menyesuaikan</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Pemesanan Program</h2>
                        <p className="text-sm text-slate-500">Pilih produk dan lanjutkan ke pembayaran.</p>
                        <div className="mt-4 grid gap-3">
                            <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                {selectedItem ? selectedItem.title : 'Pilih produk terlebih dahulu'}
                            </div>
                            {selectedItem?.type !== 'hotel' && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Tanggal kunjungan</label>
                                    <input
                                        type="date"
                                        value={visitDate}
                                        onChange={(event) => setVisitDate(event.target.value)}
                                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                            )}
                            {selectedItem?.type !== 'hotel' && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Jumlah tiket</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={(event) => setQuantity(Number(event.target.value))}
                                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                            )}
                            <button className="mt-2 h-11 rounded-full bg-sky-600 px-6 text-sm font-semibold text-white" onClick={submitBooking}>
                                {selectedItem?.type === 'hotel' ? 'Lihat Hotel' : 'Lanjutkan Pembayaran'}
                            </button>
                            <Link
                                href={`/chat/start/special_program/${program.id}`}
                                className="mt-3 block h-11 rounded-full border border-slate-200 px-6 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Chat Admin
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
