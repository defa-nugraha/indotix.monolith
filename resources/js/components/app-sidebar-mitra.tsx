import { Link } from '@inertiajs/react';
import { Building2, ChevronDown, LayoutGrid } from 'lucide-react';
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
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard Mitra',
        href: '/mitra/dashboard',
        icon: LayoutGrid,
    },
];

export function AppSidebarMitra() {
    const { isCurrentUrl } = useCurrentUrl();
    const isHotelSectionActive =
        isCurrentUrl('/mitra/hotels') ||
        isCurrentUrl('/mitra/room-types') ||
        isCurrentUrl('/mitra/room-inventories');

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
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
