import { Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import {
    Bell,
    ChartLine,
    Link2,
    PiggyBank,
    LayoutGrid,
    TicketCheck,
    UserCircle,
    Wallet,
    FileText,
    MessageCircle,
    ShoppingCart,
} from 'lucide-react';

type Props = {
    children: ReactNode;
    active?: string;
};

const menuItems = [
    { key: 'dashboard', label: 'Dashboard', href: '/affiliate', icon: LayoutGrid },
    { key: 'catalog', label: 'Katalog Wisata', href: '/affiliate/catalog', icon: TicketCheck },
    { key: 'links', label: 'Link & Kode', href: '/affiliate/links', icon: Link2 },
    { key: 'commissions', label: 'Komisi', href: '/affiliate/commissions', icon: Wallet },
    { key: 'payouts', label: 'Payout', href: '/affiliate/payouts', icon: PiggyBank },
    { key: 'notifications', label: 'Notifikasi', href: '/affiliate/notifications', icon: Bell },
    { key: 'terms', label: 'Ketentuan', href: '/affiliate/terms', icon: FileText },
    { key: 'support', label: 'Bantuan', href: '/affiliate/support', icon: MessageCircle },
];

export default function AffiliateLayout({ children, active }: Props) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_status } = usePage().props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
        affiliate_status?: string | null;
    };

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <Link href="/">
                            <img src="/logo.png" alt="Indotix" className="h-11 w-40 object-contain" />
                        </Link>
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
                    {auth?.user?.role === 'user' && (
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                            <Link href="/settings/profile" className="flex items-center gap-2 hover:text-sky-600">
                                <UserCircle className="h-4 w-4" />
                                Profile
                            </Link>
                            <Link href="/history" className="flex items-center gap-2 hover:text-sky-600">
                                <ChartLine className="h-4 w-4" />
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
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Status akun: <span className="font-semibold capitalize text-slate-900">{affiliate_status || 'pending'}</span>
                        </div>
                        <div className="mt-4 space-y-1">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold ${
                                        active === item.key ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </aside>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
                </div>
            </main>
        </div>
    );
}
