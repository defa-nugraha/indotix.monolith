import { Link, usePage } from '@inertiajs/react';
import { AlertCircle, Banknote, Bell, Building2, CalendarDays, ChevronDown, LayoutGrid, MapPinned, QrCode, Ticket, Users, MessageCircle, Star, UserCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NavMain } from '@/components/nav-main';
import { useCurrentUrl } from '@/hooks/use-current-url';
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

export function AppSidebarMitra() {
    const { auth } = usePage<SharedData>().props;
    const { isCurrentUrl } = useCurrentUrl();
    const onboardingType = auth?.user?.mitra_onboarding_type ?? null;
    const showHotelMenus = onboardingType === 'hotel';
    const showWisataMenus = onboardingType === 'wisata';
    const showEventMenus = onboardingType === 'event';
    const isHotelSectionActive =
        isCurrentUrl('/mitra/hotels') ||
        isCurrentUrl('/mitra/room-types') ||
        isCurrentUrl('/mitra/room-inventories') ||
        isCurrentUrl('/mitra/bookings') ||
        isCurrentUrl('/mitra/reviews');
    const isOperationalActive = isCurrentUrl('/mitra/occupancy');
    const isFinanceActive =
        isCurrentUrl('/mitra/finance/summary') ||
        isCurrentUrl('/mitra/finance/payouts') ||
        isCurrentUrl('/mitra/finance/bank');

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
                <SidebarMenu className="px-2">
                    {showHotelMenus && (
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
                                                isActive={isCurrentUrl('/mitra/hotels')}
                                            >
                                                <Link href="/mitra/hotels">Data Hotel</Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl('/mitra/room-types')}
                                            >
                                                <Link href="/mitra/room-types">
                                                    Tipe Kamar
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl('/mitra/room-inventories')}
                                            >
                                                <Link href="/mitra/room-inventories">
                                                    Inventory per Tanggal
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl('/mitra/bookings')}
                                            >
                                                <Link href="/mitra/bookings">
                                                    Booking & Transaksi
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl('/mitra/reviews')}
                                            >
                                                <Link href="/mitra/reviews">
                                                    Ulasan Hotel
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showHotelMenus && (
                        <SidebarMenuItem>
                            <Collapsible defaultOpen={isOperationalActive}>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <CalendarDays />
                                        <span>Operasional</span>
                                        <ChevronDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl('/mitra/occupancy')}
                                            >
                                                <Link href="/mitra/occupancy">
                                                    Kalender Okupansi
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showHotelMenus && (
                        <SidebarMenuItem>
                            <Collapsible defaultOpen={isFinanceActive}>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <Banknote />
                                        <span>Keuangan</span>
                                        <ChevronDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl('/mitra/finance/summary')}
                                            >
                                                <Link href="/mitra/finance/summary">
                                                    Ringkasan Pendapatan
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl('/mitra/finance/payouts')}
                                            >
                                                <Link href="/mitra/finance/payouts">
                                                    Riwayat Payout
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl('/mitra/finance/bank')}
                                            >
                                                <Link href="/mitra/finance/bank">
                                                    Pengaturan Rekening
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showWisataMenus && (
                        <>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/wisata/destination')}>
                                    <Link href="/mitra/wisata/destination">
                                        <MapPinned />
                                        <span>Profil Destinasi</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/wisata/tickets') || isCurrentUrl('/mitra/wisata/tickets/create')}>
                                    <Link href="/mitra/wisata/tickets">
                                        <Ticket />
                                        <span>Produk Tiket</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/wisata/bookings')}>
                                    <Link href="/mitra/wisata/bookings">
                                        <CalendarDays />
                                        <span>Booking</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/wisata/scans')}>
                                    <Link href="/mitra/wisata/scans">
                                        <QrCode />
                                        <span>Validasi QR</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/wisata/finance/summary')}>
                                    <Link href="/mitra/wisata/finance/summary">
                                        <Banknote />
                                        <span>Ringkasan Pendapatan</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/wisata/finance/payouts')}>
                                    <Link href="/mitra/wisata/finance/payouts">
                                        <Banknote />
                                        <span>Riwayat Payout</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/wisata/notifications')}>
                                    <Link href="/mitra/wisata/notifications">
                                        <Bell />
                                        <span>Notifikasi</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/wisata/reviews')}>
                                    <Link href="/mitra/wisata/reviews">
                                        <Star />
                                        <span>Ulasan Wisata</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/wisata/disputes')}>
                                    <Link href="/mitra/wisata/disputes">
                                        <AlertCircle />
                                        <span>Laporan Masalah</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </>
                    )}
                    {showEventMenus && (
                        <>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/events')}>
                                    <Link href="/mitra/events">
                                        <CalendarDays />
                                        <span>Event</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl('/mitra/events/tickets') || isCurrentUrl('/mitra/events/tickets/create')}
                                >
                                    <Link href="/mitra/events/tickets">
                                        <Ticket />
                                        <span>Produk Tiket</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/events/bookings')}>
                                    <Link href="/mitra/events/bookings">
                                        <CalendarDays />
                                        <span>Booking</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/events/attendees')}>
                                    <Link href="/mitra/events/attendees">
                                        <Users />
                                        <span>Peserta</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/events/scans')}>
                                    <Link href="/mitra/events/scans">
                                        <QrCode />
                                        <span>Validasi QR</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/events/finance/summary')}>
                                    <Link href="/mitra/events/finance/summary">
                                        <Banknote />
                                        <span>Ringkasan Pendapatan</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/events/finance/payouts')}>
                                    <Link href="/mitra/events/finance/payouts">
                                        <Banknote />
                                        <span>Riwayat Payout</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/events/notifications')}>
                                    <Link href="/mitra/events/notifications">
                                        <Bell />
                                        <span>Notifikasi</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/events/reviews')}>
                                    <Link href="/mitra/events/reviews">
                                        <Star />
                                        <span>Ulasan Event</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isCurrentUrl('/mitra/events/disputes')}>
                                    <Link href="/mitra/events/disputes">
                                        <AlertCircle />
                                        <span>Laporan Masalah</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </>
                    )}
                </SidebarMenu>
            </SidebarContent>

        </Sidebar>
    );
}
