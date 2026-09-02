import { Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Banknote,
    Bell,
    CalendarDays,
    LayoutGrid,
    MapPinned,
    MessageCircle,
    QrCode,
    Star,
    Ticket,
    UserCircle,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { useCurrentUrl } from '@/hooks/use-current-url';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem, SharedData } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard Mitra',
        href: '/mitra/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Live Chat',
        href: '/mitra/chat',
        icon: MessageCircle,
    },
    {
        title: 'Kelola Profil',
        href: '/settings/profile',
        icon: UserCircle,
    },
];

const wisataNavItems = [
    {
        title: 'Profil Destinasi',
        href: '/mitra/wisata/destination',
        icon: MapPinned,
        activePaths: ['/mitra/wisata/destination'],
    },
    {
        title: 'Produk Tiket',
        href: '/mitra/wisata/tickets',
        icon: Ticket,
        activePaths: ['/mitra/wisata/tickets', '/mitra/wisata/tickets/create'],
    },
    {
        title: 'Booking Wisata',
        href: '/mitra/wisata/bookings',
        icon: CalendarDays,
        activePaths: ['/mitra/wisata/bookings'],
    },
    {
        title: 'QR Masuk',
        href: '/mitra/wisata/scans',
        icon: QrCode,
        activePaths: ['/mitra/wisata/scans'],
    },
    {
        title: 'Ringkasan Pendapatan',
        href: '/mitra/wisata/finance/summary',
        icon: Banknote,
        activePaths: ['/mitra/wisata/finance/summary'],
    },
    {
        title: 'Riwayat Payout',
        href: '/mitra/wisata/finance/payouts',
        icon: Banknote,
        activePaths: ['/mitra/wisata/finance/payouts'],
    },
    {
        title: 'Notifikasi',
        href: '/mitra/wisata/notifications',
        icon: Bell,
        activePaths: ['/mitra/wisata/notifications'],
    },
    {
        title: 'Ulasan Wisata',
        href: '/mitra/wisata/reviews',
        icon: Star,
        activePaths: ['/mitra/wisata/reviews'],
    },
    {
        title: 'Laporan Masalah',
        href: '/mitra/wisata/disputes',
        icon: AlertCircle,
        activePaths: ['/mitra/wisata/disputes'],
    },
];

export function AppSidebarMitra() {
    const { auth } = usePage<SharedData>().props;
    const { isCurrentUrl } = useCurrentUrl();
    const showWisataMenus = auth?.user?.mitra_onboarding_type === 'wisata';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/mitra/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {showWisataMenus && (
                    <SidebarMenu className="px-2">
                        {wisataNavItems.map((item) => {
                            const Icon = item.icon;
                            const active = item.activePaths.some((path) =>
                                isCurrentUrl(path),
                            );

                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild isActive={active}>
                                        <Link href={item.href}>
                                            <Icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                )}
            </SidebarContent>
        </Sidebar>
    );
}
