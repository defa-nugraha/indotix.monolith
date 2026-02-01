import { Link, usePage } from '@inertiajs/react';
import { Banknote, Building2, CalendarDays, ChevronDown, LayoutGrid } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NavMain } from '@/components/nav-main';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { NavUser } from '@/components/nav-user';
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
];

export function AppSidebarMitra() {
    const { auth } = usePage<SharedData>().props;
    const { isCurrentUrl } = useCurrentUrl();
    const onboardingType = auth?.user?.mitra_onboarding_type ?? null;
    const showHotelMenus = onboardingType === 'hotel';
    const isHotelSectionActive =
        isCurrentUrl('/mitra/hotels') ||
        isCurrentUrl('/mitra/room-types') ||
        isCurrentUrl('/mitra/room-inventories') ||
        isCurrentUrl('/mitra/bookings');
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
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
