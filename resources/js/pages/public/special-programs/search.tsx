import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarCheck, MapPinned, ShoppingBag, Star, Ticket, Bell, MessageCircle, UserCircle, History as HistoryIcon, Sparkles, ShoppingCart } from 'lucide-react';

const navItems = [
    { label: 'Wisata', icon: MapPinned, href: '/wisata' },
    { label: 'Event', icon: CalendarCheck, href: '/events' },
    { label: 'Souvenir', icon: ShoppingBag, href: '/souvenir' },
    { label: 'Spesial Program', icon: Star, href: '/special-programs', active: true },
    { label: 'Hotel', icon: Ticket, href: '/stay' },
];

const chips = ['Liburan', 'Promo', 'Subsidi', 'Bundling', 'Highlight', 'Early Access', 'Flash Sale'];

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
    items: ProgramItem[];
};

export default function SpecialProgramSearch({ programs = [] }: { programs: Program[] }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: { role?: string } }; unread_notifications?: number; souvenir_cart_count?: number };

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Special Program" />
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
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-4 py-3 md:px-8">
                        {chips.map((chip) => (
                            <span key={chip} className="rounded-full bg-slate-100 px-4 py-1 text-xs font-medium text-slate-600">
                                {chip}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Special Program</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Program spesial pilihan INDOTIX</h1>
                            <p className="mt-2 text-sm text-slate-500">Temukan promo tematik, bundling, dan highlight favorit di satu tempat.</p>
                        </div>
                        <Sparkles className="h-10 w-10 text-sky-500" />
                    </div>
                </section>

                <div className="mt-6 space-y-8">
                    {programs.map((program) => (
                        <section key={program.id} className="rounded-3xl bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">{program.name}</h2>
                                    <p className="text-sm text-slate-500">{program.program_type} · {program.starts_at ?? '-'} → {program.ends_at ?? '-'}</p>
                                </div>
                                <Link
                                    href={`/special-programs/${program.encrypted_id}`}
                                    className="rounded-lg border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-600"
                                >
                                    Lihat Detail
                                </Link>
                            </div>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {program.items.map((item) => (
                                    <Link
                                        key={`${program.id}-${item.type}-${item.id}`}
                                        href={item.type === 'hotel' ? `/stay/hotels/${item.encrypted_id}` : item.type === 'wisata' ? `/wisata/${item.encrypted_id}` : `/events/${item.encrypted_id}`}
                                        className="group rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1"
                                    >
                                        <div className="h-32 overflow-hidden rounded-t-2xl bg-slate-200">
                                            <img
                                                src={
                                                    item.image_url ??
                                                    `https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1200&auto=format&fit=crop&sig=${item.id}`
                                                }
                                                alt={item.title}
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <div className="text-xs text-slate-500">{item.type.toUpperCase()}</div>
                                            <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                                            <div className="mt-1 text-xs text-slate-500">{item.city_name ?? 'Indonesia'}</div>
                                            {item.price ? (
                                                <div className="mt-2 text-sm font-semibold text-sky-600">Mulai Rp {Number(item.price).toLocaleString('id-ID')}</div>
                                            ) : (
                                                <div className="mt-2 text-xs text-slate-400">Harga menyesuaikan</div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </main>
        </div>
    );
}
