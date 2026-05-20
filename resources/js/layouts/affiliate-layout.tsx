import { Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { Bell, Link2, PiggyBank, LayoutGrid, TicketCheck, Wallet, FileText, MessageCircle } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import CoachMarks from '@/components/coach-marks';

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
    const { affiliate_status } = usePage().props as {
        affiliate_status?: string | null;
    };

    return (
        <PublicLayout showCategories={false} showChips={false} coachContext="none">
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
            <CoachMarks context="affiliate" />
        </PublicLayout>
    );
}
