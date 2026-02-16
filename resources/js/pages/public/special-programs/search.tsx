import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarCheck, MapPinned, ShoppingBag, Star, Ticket, Bell, MessageCircle, UserCircle, History as HistoryIcon, Sparkles, ShoppingCart } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';

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
        <PublicLayout categories={navItems} chips={chips}>
            <Head title="Special Program" />
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
                            <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
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
        </PublicLayout>
    );
}
