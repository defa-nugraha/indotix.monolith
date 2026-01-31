import { Link } from '@inertiajs/react';
import { BookOpen, Building2, ChevronDown, Folder, LayoutGrid, LineChart, MonitorPlay, Receipt, Ticket, Users, Wallet } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
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
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebarAdmin() {
    const { isCurrentUrl } = useCurrentUrl();
    const isHotelSectionActive =
        isCurrentUrl('/hotels') ||
        isCurrentUrl('/room-types') ||
        isCurrentUrl('/room-inventories') ||
        isCurrentUrl('/admin/bookings');
    const isFinanceSectionActive =
        isCurrentUrl('/admin/finance/commissions') ||
        isCurrentUrl('/admin/finance/payouts') ||
        isCurrentUrl('/admin/finance/payouts/create') ||
        isCurrentUrl('/admin/finance/reports');
    const isMarketingSectionActive =
        isCurrentUrl('/admin/marketing/vouchers');
    const isPublicSectionActive =
        isCurrentUrl('/admin/public/banners') ||
        isCurrentUrl('/admin/public/promo-videos') ||
        isCurrentUrl('/admin/public/promo-items') ||
        isCurrentUrl('/admin/public/contacts') ||
        isCurrentUrl('/admin/public/partners');
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
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Collapsible defaultOpen={isFinanceSectionActive}>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <Wallet />
                                    <span>Keuangan & Monetisasi</span>
                                    <ChevronDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
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
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Collapsible defaultOpen={isMarketingSectionActive}>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <Ticket />
                                    <span>Promo & Voucher</span>
                                    <ChevronDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/admin/marketing/vouchers')}
                                        >
                                            <Link href="/admin/marketing/vouchers">
                                                Voucher
                                            </Link>
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
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
