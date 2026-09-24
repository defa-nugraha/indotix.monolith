import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarCheck,
    ChevronDown,
    LayoutGrid,
    LineChart,
    MonitorPlay,
    Users,
    MapPinned,
    Sparkles,
    ShoppingBag,
    Link2,
    MessageCircle,
    Star,
    BookOpen,
    QrCode,
    Ticket,
    UserCircle,
} from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
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

const dashboardNavItem: NavItem = {
    title: 'Dashboard',
    href: dashboard(),
    icon: LayoutGrid,
};

const profileNavItem: NavItem = {
    title: 'Kelola Profil',
    href: '/settings/profile',
    icon: UserCircle,
};

export function AppSidebarAdmin() {
    const { auth } = usePage().props as {
        auth?: { user?: { role?: string; admin_permissions?: string[] } };
    };
    const role = auth?.user?.role;
    const permissions = auth?.user?.admin_permissions ?? [];
    const isFullAdmin = role === 'admin';
    const isAcademyAdmin = role === 'admin_academy';
    const isRetailAdmin = role === 'admin_retail';
    const isSpecialAdmin = role === 'admin_special_program';
    const hasAnyPermission = (features: string[]) =>
        isFullAdmin ||
        features.some((feature) =>
            permissions.some((permission) =>
                permission.startsWith(`${feature}.`),
            ),
        );
    const hasFeaturePermission = (feature: string) =>
        hasAnyPermission([feature]);
    const hasHotelPermission = () =>
        hasAnyPermission([
            'hotel_properties',
            'hotel_rooms',
            'hotel_bookings',
            'hotel_finance',
            'hotel_vouchers',
        ]);
    const hasWisataPermission = () =>
        hasAnyPermission([
            'wisata_destinations',
            'wisata_tickets',
            'wisata_bookings',
            'wisata_finance',
            'wisata_content',
        ]);
    const hasEventPermission = () =>
        hasAnyPermission([
            'events_items',
            'events_tickets',
            'events_bookings',
            'events_finance',
            'events_content',
            'events_system',
        ]);
    const hasEventItemsPermission = () => hasAnyPermission(['events_items']);
    const hasMitraPermission = () =>
        hasAnyPermission([
            'mitra',
            'mitra_wisata',
            'mitra_events',
            'mitra_documents',
            'mitra_all',
        ]);
    const hasBlogPermission = () =>
        hasAnyPermission(['blog_posts', 'blog_tags']);
    const hasPublicPermission = () =>
        hasAnyPermission([
            'public_home',
            'public_banners',
            'public_promo_items',
            'public_entry_qr',
            'public_contacts',
            'public_partners',
            'public_pages',
        ]);
    const hasSystemPermission = () =>
        hasAnyPermission([
            'system_audit',
            'system_settings',
            'system_notifications',
        ]);
    const hasSpecialProgramPermission = () =>
        hasAnyPermission([
            'special_programs',
            'special_program_tickets',
            'special_program_bookings',
            'special_program_scans',
        ]);
    const hasRetailPermission = () =>
        hasAnyPermission([
            'retail_products',
            'retail_categories',
            'retail_variants',
            'retail_inventory',
            'retail_orders',
            'retail_refunds',
            'retail_promotions',
            'retail_reports',
            'retail_system',
        ]);
    const hasAcademyPermission = () =>
        hasAnyPermission([
            'academy_classes',
            'academy_tickets',
            'academy_bookings',
            'academy_scans',
            'academy_finance',
            'academy_system',
        ]);
    const mainNavItems = [
        dashboardNavItem,
        ...(isFullAdmin || hasFeaturePermission('users')
            ? [
                  {
                      title: 'Kelola User',
                      href: '/admin/users',
                      icon: Users,
                  },
              ]
            : []),
        ...(isFullAdmin || hasFeaturePermission('chat')
            ? [
                  {
                      title: 'Live Chat',
                      href: '/admin/chat',
                      icon: MessageCircle,
                  },
              ]
            : []),
        ...(isFullAdmin || hasFeaturePermission('reviews')
            ? [
                  {
                      title: 'Ulasan Produk',
                      href: '/admin/reviews',
                      icon: Star,
                  },
              ]
            : []),
        profileNavItem,
    ];
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
        isCurrentUrl('/admin/marketing/vouchers') ||
        isCurrentUrl('/admin/hotel/exceptions');
    const isPublicSectionActive =
        isCurrentUrl('/admin/public/home') ||
        isCurrentUrl('/admin/public/banners') ||
        isCurrentUrl('/admin/public/promo-items') ||
        isCurrentUrl('/admin/public/entry-qr') ||
        isCurrentUrl('/admin/public/contacts') ||
        isCurrentUrl('/admin/public/contact-us') ||
        isCurrentUrl('/admin/public/partners') ||
        isCurrentUrl('/admin/public/about') ||
        isCurrentUrl('/admin/public/faqs') ||
        isCurrentUrl('/admin/public/privacy-policy');
    const publicMenuItems = [
        {
            feature: 'public_home',
            href: '/admin/public/home',
            label: 'Halaman Home',
        },
        {
            feature: 'public_banners',
            href: '/admin/public/banners',
            label: 'Banner Website',
        },
        {
            feature: 'public_entry_qr',
            href: '/admin/public/entry-qr',
            label: 'QR Masuk Mitra',
        },
        {
            feature: 'public_contacts',
            href: '/admin/public/contacts',
            label: 'Kontak',
        },
        {
            feature: 'public_contacts',
            href: '/admin/public/contact-us',
            label: 'Contact Us',
        },
        {
            feature: 'public_partners',
            href: '/admin/public/partners',
            label: 'Partner Kami',
        },
        {
            feature: 'public_pages',
            href: '/admin/public/about',
            label: 'Tentang Kami',
        },
        {
            feature: 'public_pages',
            href: '/admin/public/faqs',
            label: 'FAQ',
        },
        {
            feature: 'public_pages',
            href: '/admin/public/privacy-policy',
            label: 'Dokumen Legal',
        },
    ];
    const visiblePublicMenuItems = publicMenuItems.filter((item) =>
        hasAnyPermission([item.feature]),
    );
    const showMobileSection = hasFeaturePermission('mobile_home_content');
    const isMobileSectionActive =
        isCurrentUrl('/admin/mobile/home') ||
        isCurrentUrl('/admin/mobile/promos');
    const isWisataSectionActive =
        isCurrentUrl('/admin/wisata/destinations') ||
        isCurrentUrl('/admin/wisata/tickets') ||
        isCurrentUrl('/admin/wisata/bookings') ||
        isCurrentUrl('/admin/wisata/scans') ||
        isCurrentUrl('/admin/wisata/exceptions') ||
        isCurrentUrl('/admin/wisata/finance/commissions') ||
        isCurrentUrl('/admin/wisata/finance/payouts') ||
        isCurrentUrl('/admin/wisata/finance/reports') ||
        isCurrentUrl('/admin/wisata/content') ||
        isCurrentUrl('/admin/wisata/vouchers');
    const isAffiliateSectionActive =
        isCurrentUrl('/admin/wisata/affiliates') ||
        isCurrentUrl('/admin/wisata/affiliates/commissions') ||
        isCurrentUrl('/admin/wisata/affiliates/links') ||
        isCurrentUrl('/admin/wisata/affiliates/performance') ||
        isCurrentUrl('/admin/wisata/affiliates/commission-items') ||
        isCurrentUrl('/admin/wisata/affiliates/payouts') ||
        isCurrentUrl('/admin/wisata/affiliates/campaigns') ||
        isCurrentUrl('/admin/wisata/affiliates/exceptions') ||
        isCurrentUrl('/admin/wisata/affiliates/system/audit') ||
        isCurrentUrl('/admin/wisata/affiliates/system/settings');
    const isSystemSectionActive =
        isCurrentUrl('/admin/system/audit-logs') ||
        isCurrentUrl('/admin/system/settings') ||
        isCurrentUrl('/admin/system/notifications');
    const isMitraSectionActive =
        isCurrentUrl('/admin/mitra') ||
        isCurrentUrl('/admin/mitra-wisata') ||
        isCurrentUrl('/admin/events/organizers') ||
        isCurrentUrl('/admin/mitra-documents');
    const isBlogSectionActive =
        isCurrentUrl('/admin/blog/posts') ||
        isCurrentUrl('/admin/blog/posts/create') ||
        isCurrentUrl('/admin/blog/tags');
    const isSpecialProgramSectionActive =
        isCurrentUrl('/admin/special-programs') ||
        isCurrentUrl('/admin/special-programs/create') ||
        isCurrentUrl('/admin/special-programs/tickets') ||
        isCurrentUrl('/admin/special-programs/bookings') ||
        isCurrentUrl('/admin/special-programs/attendees') ||
        isCurrentUrl('/admin/special-programs/scans');
    const isSouvenirSectionActive =
        isCurrentUrl('/admin/retail-shop/products') ||
        isCurrentUrl('/admin/retail-shop/categories') ||
        isCurrentUrl('/admin/retail-shop/variants') ||
        isCurrentUrl('/admin/retail-shop/inventory') ||
        isCurrentUrl('/admin/retail-shop/orders') ||
        isCurrentUrl('/admin/retail-shop/fulfillment') ||
        isCurrentUrl('/admin/retail-shop/refunds') ||
        isCurrentUrl('/admin/retail-shop/promotions') ||
        isCurrentUrl('/admin/retail-shop/reports') ||
        isCurrentUrl('/admin/retail-shop/audit') ||
        isCurrentUrl('/admin/retail-shop/settings');
    const isEventSectionActive =
        isCurrentUrl('/admin/events') ||
        isCurrentUrl('/admin/events/organizers') ||
        isCurrentUrl('/admin/events/tickets') ||
        isCurrentUrl('/admin/events/bookings') ||
        isCurrentUrl('/admin/events/attendees') ||
        isCurrentUrl('/admin/events/scans') ||
        isCurrentUrl('/admin/events/content') ||
        isCurrentUrl('/admin/events/exceptions') ||
        isCurrentUrl('/admin/events/finance/commissions') ||
        isCurrentUrl('/admin/events/finance/settlements') ||
        isCurrentUrl('/admin/events/finance/reports') ||
        isCurrentUrl('/admin/events/system/audit-logs') ||
        isCurrentUrl('/admin/events/system/settings');
    const isAcademySectionActive =
        isCurrentUrl('/admin/academy/classes') ||
        isCurrentUrl('/admin/academy/tickets') ||
        isCurrentUrl('/admin/academy/bookings') ||
        isCurrentUrl('/admin/academy/attendees') ||
        isCurrentUrl('/admin/academy/scans') ||
        isCurrentUrl('/admin/academy/finance') ||
        isCurrentUrl('/admin/academy/reports') ||
        isCurrentUrl('/admin/academy/system/audit') ||
        isCurrentUrl('/admin/academy/system/settings');
    const showMitraSection = hasMitraPermission();
    const showHotelSection = false;
    const showBlogSection = hasBlogPermission();
    const showWisataSection = hasWisataPermission();
    const showAffiliateSection = false;
    const showEventSection = false;
    const showPublicSection = visiblePublicMenuItems.length > 0;
    const showSystemSection = hasSystemPermission();
    const showSpecialProgramSection = false;
    const showSouvenirSection = false;
    const showAcademySection = false;
    const showAcademyFlatMenu = false;
    const showRetailFlatMenu = false;
    const showSpecialFlatMenu = false;
    const academyFlatItems = [
        {
            title: 'Master Kelas',
            href: '/admin/academy/classes',
            icon: CalendarCheck,
        },
        {
            title: 'Produk Tiket',
            href: '/admin/academy/tickets',
            icon: CalendarCheck,
        },
        {
            title: 'Booking',
            href: '/admin/academy/bookings',
            icon: CalendarCheck,
        },
        {
            title: 'Peserta',
            href: '/admin/academy/attendees',
            icon: CalendarCheck,
        },
        {
            title: 'Monitoring QR',
            href: '/admin/academy/scans',
            icon: CalendarCheck,
        },
        {
            title: 'Keuangan & Refund',
            href: '/admin/academy/finance',
            icon: CalendarCheck,
        },
        {
            title: 'Laporan',
            href: '/admin/academy/reports',
            icon: CalendarCheck,
        },
        {
            title: 'Audit Log',
            href: '/admin/academy/system/audit',
            icon: CalendarCheck,
        },
        {
            title: 'Konfigurasi',
            href: '/admin/academy/system/settings',
            icon: CalendarCheck,
        },
    ];
    const retailFlatItems = [
        {
            title: 'Master Produk',
            href: '/admin/retail-shop/products',
            icon: ShoppingBag,
        },
        {
            title: 'Kategori Produk',
            href: '/admin/retail-shop/categories',
            icon: ShoppingBag,
        },
        {
            title: 'Variasi Produk',
            href: '/admin/retail-shop/variants',
            icon: ShoppingBag,
        },
        {
            title: 'Inventory & Stok',
            href: '/admin/retail-shop/inventory',
            icon: ShoppingBag,
        },
        {
            title: 'Order & Transaksi',
            href: '/admin/retail-shop/orders',
            icon: ShoppingBag,
        },
        {
            title: 'Fulfillment & Pengiriman',
            href: '/admin/retail-shop/fulfillment',
            icon: ShoppingBag,
        },
        {
            title: 'Refund & Retur',
            href: '/admin/retail-shop/refunds',
            icon: ShoppingBag,
        },
        {
            title: 'Promo Retail Shop',
            href: '/admin/retail-shop/promotions',
            icon: ShoppingBag,
        },
        {
            title: 'Laporan & Analitik',
            href: '/admin/retail-shop/reports',
            icon: ShoppingBag,
        },
        {
            title: 'Audit Log',
            href: '/admin/retail-shop/audit',
            icon: ShoppingBag,
        },
        {
            title: 'Konfigurasi Retail Shop',
            href: '/admin/retail-shop/settings',
            icon: ShoppingBag,
        },
    ];
    const specialFlatItems = [
        {
            title: 'Manajemen Program',
            href: '/admin/special-programs',
            icon: Sparkles,
        },
        {
            title: 'Produk Tiket',
            href: '/admin/special-programs/tickets',
            icon: Ticket,
        },
        {
            title: 'Booking',
            href: '/admin/special-programs/bookings',
            icon: CalendarCheck,
        },
        {
            title: 'Peserta',
            href: '/admin/special-programs/attendees',
            icon: Users,
        },
        {
            title: 'Monitoring QR',
            href: '/admin/special-programs/scans',
            icon: QrCode,
        },
    ];
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
                    {showAcademyFlatMenu &&
                        academyFlatItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(item.href)}
                                >
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    {showRetailFlatMenu &&
                        retailFlatItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(item.href)}
                                >
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    {showSpecialFlatMenu &&
                        specialFlatItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(item.href)}
                                >
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    {showMitraSection && (
                        <SidebarMenuItem>
                            <Collapsible defaultOpen={isMitraSectionActive}>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <Users />
                                        <span>Kelola Mitra</span>
                                        <ChevronDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/mitra-wisata',
                                                )}
                                            >
                                                <Link href="/admin/mitra-wisata">
                                                    Mitra Wisata
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/mitra-documents',
                                                )}
                                            >
                                                <Link href="/admin/mitra-documents">
                                                    Dokumen S&K Mitra
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showHotelSection && (
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
                                                isActive={isCurrentUrl(
                                                    '/hotels',
                                                )}
                                            >
                                                <Link href="/hotels">
                                                    Data Hotel
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/room-types',
                                                )}
                                            >
                                                <Link href="/room-types">
                                                    Tipe Kamar
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/room-inventories',
                                                )}
                                            >
                                                <Link href="/room-inventories">
                                                    Inventory per Tanggal
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/bookings',
                                                )}
                                            >
                                                <Link href="/admin/bookings">
                                                    Booking & Transaksi
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/finance/commissions',
                                                )}
                                            >
                                                <Link href="/admin/finance/commissions">
                                                    Komisi Platform
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/finance/payouts',
                                                )}
                                            >
                                                <Link href="/admin/finance/payouts">
                                                    Payout Mitra
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/finance/reports',
                                                )}
                                            >
                                                <Link href="/admin/finance/reports">
                                                    Laporan Keuangan
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/marketing/vouchers',
                                                )}
                                            >
                                                <Link href="/admin/marketing/vouchers">
                                                    Promo & Voucher
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/hotel/exceptions',
                                                )}
                                            >
                                                <Link href="/admin/hotel/exceptions">
                                                    Refund & Exception
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showBlogSection && (
                        <SidebarMenuItem>
                            <Collapsible defaultOpen={isBlogSectionActive}>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <BookOpen />
                                        <span>Jelajah Indotix</span>
                                        <ChevronDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/blog/posts',
                                                )}
                                            >
                                                <Link href="/admin/blog/posts">
                                                    Artikel
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/blog/tags',
                                                )}
                                            >
                                                <Link href="/admin/blog/tags">
                                                    Tags
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showWisataSection && (
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
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/destinations',
                                                )}
                                            >
                                                <Link href="/admin/wisata/destinations">
                                                    Master Destinasi
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/tickets',
                                                )}
                                            >
                                                <Link href="/admin/wisata/tickets">
                                                    Produk Tiket
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/bookings',
                                                )}
                                            >
                                                <Link href="/admin/wisata/bookings">
                                                    Monitoring Booking
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/scans',
                                                )}
                                            >
                                                <Link href="/admin/wisata/scans">
                                                    Monitoring Validasi QR
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/exceptions',
                                                )}
                                            >
                                                <Link href="/admin/wisata/exceptions">
                                                    Refund & Exception
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/finance/commissions',
                                                )}
                                            >
                                                <Link href="/admin/wisata/finance/commissions">
                                                    Komisi Platform
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/finance/payouts',
                                                )}
                                            >
                                                <Link href="/admin/wisata/finance/payouts">
                                                    Payout Mitra
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/finance/reports',
                                                )}
                                            >
                                                <Link href="/admin/wisata/finance/reports">
                                                    Laporan Keuangan
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/content',
                                                )}
                                            >
                                                <Link href="/admin/wisata/content">
                                                    Konten & Review
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        {isFullAdmin && (
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isCurrentUrl(
                                                        '/admin/wisata/vouchers',
                                                    )}
                                                >
                                                    <Link href="/admin/wisata/vouchers">
                                                        Voucher Wisata
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        )}
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/system/settings',
                                                )}
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
                    )}
                    {showAffiliateSection && (
                        <SidebarMenuItem>
                            <Collapsible defaultOpen={isAffiliateSectionActive}>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <Link2 />
                                        <span>Afiliasi Wisata</span>
                                        <ChevronDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/affiliates',
                                                )}
                                            >
                                                <Link href="/admin/wisata/affiliates">
                                                    Manajemen Afiliasi
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/affiliates/commissions',
                                                )}
                                            >
                                                <Link href="/admin/wisata/affiliates/commissions">
                                                    Skema Komisi
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/affiliates/links',
                                                )}
                                            >
                                                <Link href="/admin/wisata/affiliates/links">
                                                    Referral Link
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/affiliates/performance',
                                                )}
                                            >
                                                <Link href="/admin/wisata/affiliates/performance">
                                                    Monitoring Kinerja
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/affiliates/commission-items',
                                                )}
                                            >
                                                <Link href="/admin/wisata/affiliates/commission-items">
                                                    Rekap Komisi
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/affiliates/payouts',
                                                )}
                                            >
                                                <Link href="/admin/wisata/affiliates/payouts">
                                                    Payout Afiliasi
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/affiliates/campaigns',
                                                )}
                                            >
                                                <Link href="/admin/wisata/affiliates/campaigns">
                                                    Campaign Afiliasi
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/affiliates/exceptions',
                                                )}
                                            >
                                                <Link href="/admin/wisata/affiliates/exceptions">
                                                    Dispute & Penalti
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/affiliates/system/audit',
                                                )}
                                            >
                                                <Link href="/admin/wisata/affiliates/system/audit">
                                                    Audit Log
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/wisata/affiliates/system/settings',
                                                )}
                                            >
                                                <Link href="/admin/wisata/affiliates/system/settings">
                                                    Konfigurasi
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showEventSection && (
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
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/events',
                                                )}
                                            >
                                                <Link href="/admin/events">
                                                    Manajemen Event
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        {hasEventItemsPermission() && (
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isCurrentUrl(
                                                        '/admin/events/organizers',
                                                    )}
                                                >
                                                    <Link href="/admin/events/organizers">
                                                        Organizer Event
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        )}
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/events/tickets',
                                                )}
                                            >
                                                <Link href="/admin/events/tickets">
                                                    Produk Tiket
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/events/bookings',
                                                )}
                                            >
                                                <Link href="/admin/events/bookings">
                                                    Booking Event
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/events/attendees',
                                                )}
                                            >
                                                <Link href="/admin/events/attendees">
                                                    Data Peserta
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/events/scans',
                                                )}
                                            >
                                                <Link href="/admin/events/scans">
                                                    Monitoring QR
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/events/content',
                                                )}
                                            >
                                                <Link href="/admin/events/content">
                                                    Moderasi Konten
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/events/exceptions',
                                                )}
                                            >
                                                <Link href="/admin/events/exceptions">
                                                    Exception & Refund
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/events/finance/commissions',
                                                )}
                                            >
                                                <Link href="/admin/events/finance/commissions">
                                                    Komisi Event
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/events/finance/settlements',
                                                )}
                                            >
                                                <Link href="/admin/events/finance/settlements">
                                                    Settlement EO
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/events/finance/reports',
                                                )}
                                            >
                                                <Link href="/admin/events/finance/reports">
                                                    Laporan Event
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/events/system/audit-logs',
                                                )}
                                            >
                                                <Link href="/admin/events/system/audit-logs">
                                                    Audit Log
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/events/system/settings',
                                                )}
                                            >
                                                <Link href="/admin/events/system/settings">
                                                    Konfigurasi Event
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showAcademySection && (
                        <SidebarMenuItem>
                            <Collapsible defaultOpen={isAcademySectionActive}>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <CalendarCheck />
                                        <span>Eljohn Academy</span>
                                        <ChevronDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/academy/classes',
                                                )}
                                            >
                                                <Link href="/admin/academy/classes">
                                                    Master Kelas
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/academy/tickets',
                                                )}
                                            >
                                                <Link href="/admin/academy/tickets">
                                                    Produk Tiket
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/academy/bookings',
                                                )}
                                            >
                                                <Link href="/admin/academy/bookings">
                                                    Booking
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/academy/attendees',
                                                )}
                                            >
                                                <Link href="/admin/academy/attendees">
                                                    Peserta
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/academy/scans',
                                                )}
                                            >
                                                <Link href="/admin/academy/scans">
                                                    Monitoring QR
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/academy/finance',
                                                )}
                                            >
                                                <Link href="/admin/academy/finance">
                                                    Keuangan & Refund
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/academy/reports',
                                                )}
                                            >
                                                <Link href="/admin/academy/reports">
                                                    Laporan
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/academy/system/audit',
                                                )}
                                            >
                                                <Link href="/admin/academy/system/audit">
                                                    Audit Log
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/academy/system/settings',
                                                )}
                                            >
                                                <Link href="/admin/academy/system/settings">
                                                    Konfigurasi
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showSpecialProgramSection && (
                        <SidebarMenuItem>
                            <Collapsible
                                defaultOpen={isSpecialProgramSectionActive}
                            >
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <Sparkles />
                                        <span>Special Program</span>
                                        <ChevronDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/special-programs',
                                                )}
                                            >
                                                <Link href="/admin/special-programs">
                                                    Manajemen Program
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/special-programs/tickets',
                                                )}
                                            >
                                                <Link href="/admin/special-programs/tickets">
                                                    Produk Tiket
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/special-programs/bookings',
                                                )}
                                            >
                                                <Link href="/admin/special-programs/bookings">
                                                    Booking
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/special-programs/attendees',
                                                )}
                                            >
                                                <Link href="/admin/special-programs/attendees">
                                                    Peserta
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/special-programs/scans',
                                                )}
                                            >
                                                <Link href="/admin/special-programs/scans">
                                                    Monitoring QR
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showSouvenirSection && (
                        <SidebarMenuItem>
                            <Collapsible defaultOpen={isSouvenirSectionActive}>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <ShoppingBag />
                                        <span>Retail Shop</span>
                                        <ChevronDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/retail-shop/products',
                                                )}
                                            >
                                                <Link href="/admin/retail-shop/products">
                                                    Master Produk
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/retail-shop/categories',
                                                )}
                                            >
                                                <Link href="/admin/retail-shop/categories">
                                                    Kategori Produk
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/retail-shop/variants',
                                                )}
                                            >
                                                <Link href="/admin/retail-shop/variants">
                                                    Variasi Produk
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/retail-shop/inventory',
                                                )}
                                            >
                                                <Link href="/admin/retail-shop/inventory">
                                                    Inventory & Stok
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/retail-shop/orders',
                                                )}
                                            >
                                                <Link href="/admin/retail-shop/orders">
                                                    Order & Transaksi
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/retail-shop/fulfillment',
                                                )}
                                            >
                                                <Link href="/admin/retail-shop/fulfillment">
                                                    Fulfillment & Pengiriman
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/retail-shop/refunds',
                                                )}
                                            >
                                                <Link href="/admin/retail-shop/refunds">
                                                    Refund & Retur
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/retail-shop/promotions',
                                                )}
                                            >
                                                <Link href="/admin/retail-shop/promotions">
                                                    Promo Retail Shop
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/retail-shop/reports',
                                                )}
                                            >
                                                <Link href="/admin/retail-shop/reports">
                                                    Laporan & Analitik
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/retail-shop/audit',
                                                )}
                                            >
                                                <Link href="/admin/retail-shop/audit">
                                                    Audit Log
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/retail-shop/settings',
                                                )}
                                            >
                                                <Link href="/admin/retail-shop/settings">
                                                    Konfigurasi Retail Shop
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showPublicSection && (
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
                                        {visiblePublicMenuItems.map((item) => (
                                            <SidebarMenuSubItem key={item.href}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isCurrentUrl(
                                                        item.href,
                                                    )}
                                                >
                                                    <Link href={item.href}>
                                                        {item.label}
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showMobileSection && (
                        <SidebarMenuItem>
                            <Collapsible defaultOpen={isMobileSectionActive}>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <MonitorPlay />
                                        <span>Mobile App</span>
                                        <ChevronDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/mobile/home',
                                                )}
                                            >
                                                <Link href="/admin/mobile/home">
                                                    Home Content
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/mobile/promos',
                                                )}
                                            >
                                                <Link href="/admin/mobile/promos">
                                                    Promo Banners
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    )}
                    {showSystemSection && (
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
                                                isActive={isCurrentUrl(
                                                    '/admin/system/audit-logs',
                                                )}
                                            >
                                                <Link href="/admin/system/audit-logs">
                                                    Audit Log
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/system/settings',
                                                )}
                                            >
                                                <Link href="/admin/system/settings">
                                                    Konfigurasi Sistem
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/admin/system/notifications',
                                                )}
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
                    )}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
}
