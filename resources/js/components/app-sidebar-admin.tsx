import { Link } from '@inertiajs/react';
import { Building2, CalendarCheck, ChevronDown, LayoutGrid, LineChart, MonitorPlay, Users, MapPinned } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { useCurrentUrl } from '@/hooks/use-current-url';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Kelola Mitra',
        href: '/admin/mitra',
        icon: Users,
    },
    {
        title: 'Mitra Wisata',
        href: '/admin/mitra-wisata',
        icon: Users,
    },
];

export function AppSidebarAdmin() {
    const { isCurrentUrl } = useCurrentUrl();
    const isHotelSectionActive =
        isCurrentUrl('/hotels') ||
        isCurrentUrl('/room-types') ||
        isCurrentUrl('/room-inventories') ||
        isCurrentUrl('/admin/bookings') ||
        isCurrentUrl('/admin/finance/commissions') ||
        isCurrentUrl('/admin/finance/payouts') ||
        isCurrentUrl('/admin/finance/payouts/create') ||
        isCurrentUrl('/admin/finance/reports') ||
        isCurrentUrl('/admin/marketing/vouchers');
    const isPublicSectionActive =
        isCurrentUrl('/admin/public/banners') ||
        isCurrentUrl('/admin/public/promo-videos') ||
        isCurrentUrl('/admin/public/promo-items') ||
        isCurrentUrl('/admin/public/contacts') ||
        isCurrentUrl('/admin/public/partners');
    const isWisataSectionActive =
        isCurrentUrl('/admin/wisata/destinations') ||
        isCurrentUrl('/admin/wisata/tickets') ||
        isCurrentUrl('/admin/wisata/bookings') ||
        isCurrentUrl('/admin/wisata/scans') ||
        isCurrentUrl('/admin/wisata/exceptions') ||
        isCurrentUrl('/admin/wisata/finance/commissions') ||
        isCurrentUrl('/admin/wisata/finance/payouts') ||
        isCurrentUrl('/admin/wisata/finance/reports') ||
        isCurrentUrl('/admin/wisata/content');
    const isSystemSectionActive =
        isCurrentUrl('/admin/system/audit-logs') ||
        isCurrentUrl('/admin/system/settings') ||
        isCurrentUrl('/admin/system/notifications');
    const isEventSectionActive =
        isCurrentUrl('/admin/events') ||
        isCurrentUrl('/admin/events/organizers') ||
        isCurrentUrl('/admin/events/tickets') ||
        isCurrentUrl('/admin/events/bookings') ||
        isCurrentUrl('/admin/events/attendees') ||
        isCurrentUrl('/admin/events/scans') ||
        isCurrentUrl('/admin/events/content') ||
        isCurrentUrl('/admin/events/reviews') ||
        isCurrentUrl('/admin/events/exceptions') ||
        isCurrentUrl('/admin/events/finance/commissions') ||
        isCurrentUrl('/admin/events/finance/settlements') ||
        isCurrentUrl('/admin/events/finance/reports') ||
        isCurrentUrl('/admin/events/system/audit-logs') ||
        isCurrentUrl('/admin/events/system/settings');
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <SidebarMenu className="px-2">
                    <SidebarMenuItem>
                        <Collapsible defaultOpen={isHotelSectionActive}>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <Building2 />
                                    <span>Hotel</span>
                                    <ChevronDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/hotels')}
                                        >
                                            <Link href="/hotels">Data Hotel</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/room-types')}
                                        >
                                            <Link href="/room-types">
                                                Tipe Kamar
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/room-inventories')}
                                        >
                                            <Link href="/room-inventories">
                                                Inventory per Tanggal
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/bookings')}
                                        >
                                            <Link href="/admin/bookings">
                                                Booking & Transaksi
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/finance/commissions')}
                                        >
                                            <Link href="/admin/finance/commissions">
                                                Komisi Platform
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/finance/payouts')}
                                        >
                                            <Link href="/admin/finance/payouts">
                                                Payout Mitra
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/finance/reports')}
                                        >
                                            <Link href="/admin/finance/reports">
                                                Laporan Keuangan
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/marketing/vouchers')}
                                        >
                                            <Link href="/admin/marketing/vouchers">
                                                Promo & Voucher
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Collapsible defaultOpen={isWisataSectionActive}>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <MapPinned />
                                    <span>Wisata</span>
                                    <ChevronDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/wisata/destinations')}
                                        >
                                            <Link href="/admin/wisata/destinations">Master Destinasi</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/wisata/tickets')}
                                        >
                                            <Link href="/admin/wisata/tickets">
                                                Produk Tiket
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/wisata/bookings')}
                                        >
                                            <Link href="/admin/wisata/bookings">
                                                Monitoring Booking
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/wisata/scans')}
                                        >
                                            <Link href="/admin/wisata/scans">
                                                Monitoring Validasi QR
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/wisata/exceptions')}
                                        >
                                            <Link href="/admin/wisata/exceptions">
                                                Refund & Exception
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/wisata/finance/commissions')}
                                        >
                                            <Link href="/admin/wisata/finance/commissions">
                                                Komisi Platform
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/wisata/finance/payouts')}
                                        >
                                            <Link href="/admin/wisata/finance/payouts">
                                                Payout Mitra
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/wisata/finance/reports')}
                                        >
                                            <Link href="/admin/wisata/finance/reports">
                                                Laporan Keuangan
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/wisata/content')}
                                        >
                                            <Link href="/admin/wisata/content">
                                                Konten & Review
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/system/audit-logs')}
                                        >
                                            <Link href="/admin/system/audit-logs">
                                                Audit Log
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/system/settings')}
                                        >
                                            <Link href="/admin/system/settings">
                                                Konfigurasi Sistem
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Collapsible defaultOpen={isEventSectionActive}>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <CalendarCheck />
                                    <span>Event</span>
                                    <ChevronDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/organizers')}>
                                            <Link href="/admin/events/organizers">Mitra Event (EO)</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events')}>
                                            <Link href="/admin/events">Manajemen Event</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/tickets')}>
                                            <Link href="/admin/events/tickets">Produk Tiket</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/bookings')}>
                                            <Link href="/admin/events/bookings">Booking Event</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/attendees')}>
                                            <Link href="/admin/events/attendees">Data Peserta</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/scans')}>
                                            <Link href="/admin/events/scans">Monitoring QR</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/content')}>
                                            <Link href="/admin/events/content">Moderasi Konten</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/reviews')}>
                                            <Link href="/admin/events/reviews">Review & Rating</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/exceptions')}>
                                            <Link href="/admin/events/exceptions">Exception & Refund</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/finance/commissions')}>
                                            <Link href="/admin/events/finance/commissions">Komisi Event</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/finance/settlements')}>
                                            <Link href="/admin/events/finance/settlements">Settlement EO</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/finance/reports')}>
                                            <Link href="/admin/events/finance/reports">Laporan Event</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/system/audit-logs')}>
                                            <Link href="/admin/events/system/audit-logs">Audit Log</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl('/admin/events/system/settings')}>
                                            <Link href="/admin/events/system/settings">Konfigurasi Event</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Collapsible defaultOpen={isPublicSectionActive}>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <MonitorPlay />
                                    <span>Konten Publik</span>
                                    <ChevronDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/public/banners')}
                                        >
                                            <Link href="/admin/public/banners">Banner</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/public/promo-videos')}
                                        >
                                            <Link href="/admin/public/promo-videos">Promo Video</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/public/promo-items')}
                                        >
                                            <Link href="/admin/public/promo-items">Promo Terkini</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={isCurrentUrl('/admin/public/contacts')}
                                    >
                                        <Link href="/admin/public/contacts">Kontak</Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={isCurrentUrl('/admin/public/partners')}
                                    >
                                        <Link href="/admin/public/partners">Partner Kami</Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </Collapsible>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Collapsible defaultOpen={isSystemSectionActive}>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <LineChart />
                                    <span>Sistem, Audit & Kontrol</span>
                                    <ChevronDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/system/audit-logs')}
                                        >
                                            <Link href="/admin/system/audit-logs">
                                                Audit Log
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/system/settings')}
                                        >
                                            <Link href="/admin/system/settings">
                                                Konfigurasi Sistem
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/system/notifications')}
                                        >
                                            <Link href="/admin/system/notifications">
                                                Notification Control
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>

        </Sidebar>
    );
}
