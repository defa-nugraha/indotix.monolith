import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
    BadgePercent,
    Bell,
    History,
    LayoutGrid,
    LogOut,
    Menu,
    MessageCircle,
    ScanLine,
    Search,
    UserCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';

export type PublicNavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    active?: boolean;
};

export type PublicHeaderSearch = {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    onSubmit?: (event: FormEvent) => void;
};

type HeaderDiscoveryProduct = {
    type: 'product';
    label: string;
    image?: string | null;
    url?: string | null;
    product_type_label?: string;
};

type HeaderDiscoveryKeyword = {
    type: 'keyword';
    label: string;
    url?: string | null;
    product_type_label?: string;
};

export type PublicHeaderProps = {
    categories?: PublicNavItem[];
    chips?: string[];
    search?: PublicHeaderSearch;
    showSearch?: boolean;
    showCategories?: boolean;
    showChips?: boolean;
    transparent?: boolean;
};

export default function PublicHeader({
    categories,
    chips = [],
    search,
    showSearch = true,
    showCategories = true,
    showChips = true,
    transparent = false,
}: PublicHeaderProps) {
    const { auth, unread_notifications, affiliate_menu } = usePage().props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        affiliate_menu?: boolean;
    };
    const url = usePage().url || '';
    const pathname = url.split('?')[0] ?? '';
    const role = auth?.user?.role;
    const isUser = role === 'user';
    const isLoggedIn = Boolean(auth?.user);
    const isNonUser = isLoggedIn && !isUser;
    const isActivePath = (path: string) =>
        pathname === path || pathname.startsWith(`${path}/`);

    const resolvedCategories = categories ?? [];
    const hasCategories = resolvedCategories.length > 0;
    const hasChips = chips.length > 0;
    const dashboardHref = role === 'mitra' ? '/mitra/dashboard' : '/dashboard';
    const dashboardLabel = role === 'mitra' ? 'Dashboard Mitra' : 'Dashboard';
    const [topbarSearchValue, setTopbarSearchValue] = useState(
        search?.value ?? '',
    );
    const [topbarOpen, setTopbarOpen] = useState(false);
    const [topbarProducts, setTopbarProducts] = useState<
        HeaderDiscoveryProduct[]
    >([]);
    const [topbarKeywords, setTopbarKeywords] = useState<
        HeaderDiscoveryKeyword[]
    >([]);
    const searchWrapperRef = useRef<HTMLDivElement | null>(null);
    const activeSearchValue = search?.value ?? topbarSearchValue;

    const handleLogout = () => {
        router.flushAll();
    };

    const userMenu = [
        {
            label: 'Profile',
            href: '/settings/profile',
            icon: UserCircle,
            show: true,
        },
        {
            label: 'Afiliasi',
            href: '/affiliate',
            icon: BadgePercent,
            show: Boolean(affiliate_menu),
        },
        { label: 'Riwayat', href: '/history', icon: History, show: true },
        { label: 'Scan Tiket', href: '/tickets/scan', icon: ScanLine, show: true },
        { label: 'Chat', href: '/chat', icon: MessageCircle, show: true },
        { label: 'Notifikasi', href: '/notifications', icon: Bell, show: true },
    ];
    const mainNav = [
        { label: 'Beranda', href: '/' },
        { label: 'Destinasi', href: '/wisata' },
        { label: 'Paket Wisata', href: '/wisata?ticket_kind=package' },
        { label: 'Promo', href: '/promo' },
        { label: 'Jelajah', href: '/jelajah' },
        { label: 'Tentang', href: '/about' },
    ];

    useEffect(() => {
        if (!topbarOpen) {
            return undefined;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (
                searchWrapperRef.current &&
                !searchWrapperRef.current.contains(event.target as Node)
            ) {
                setTopbarOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
        };
    }, [topbarOpen]);

    useEffect(() => {
        if (!showSearch || !topbarOpen) {
            return undefined;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                const target = new URL(
                    '/api/discovery/global/suggestions',
                    window.location.origin,
                );
                const keyword = activeSearchValue.trim();

                target.searchParams.set('product_limit', '6');
                target.searchParams.set('keyword_limit', '8');
                if (keyword) {
                    target.searchParams.set('q', keyword);
                }

                const response = await fetch(target.toString(), {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    return;
                }

                const payload = await response.json();
                setTopbarProducts(
                    Array.isArray(payload?.data?.products)
                        ? payload.data.products
                        : [],
                );
                setTopbarKeywords(
                    Array.isArray(payload?.data?.popular_searches)
                        ? payload.data.popular_searches
                        : [],
                );
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setTopbarProducts([]);
                    setTopbarKeywords([]);
                }
            }
        }, 220);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [activeSearchValue, showSearch, topbarOpen]);

    const handleTopbarChange = (value: string) => {
        if (search?.onChange) {
            search.onChange(value);
            return;
        }

        setTopbarSearchValue(value);
    };

    const handleTopbarNavigate = (url?: string | null, nextValue?: string) => {
        if (nextValue) {
            handleTopbarChange(nextValue);
        }

        setTopbarOpen(false);

        if (url) {
            router.visit(url);
        }
    };

    const handleTopbarSubmit = (event: FormEvent) => {
        if (search?.onSubmit) {
            search.onSubmit(event);
            return;
        }

        event.preventDefault();
        const keyword = activeSearchValue.trim();
        router.visit(
            keyword ? `/wisata?q=${encodeURIComponent(keyword)}` : '/wisata',
        );
    };

    const renderSearch = (className?: string) => {
        const showDiscovery =
            topbarOpen &&
            (topbarProducts.length > 0 || topbarKeywords.length > 0);

        return (
            <div
                className={cn(
                    'relative flex w-full min-w-0 items-center',
                    className,
                )}
                ref={searchWrapperRef}
                data-coach="public-search"
            >
                <form
                    className="flex w-full min-w-0 items-center gap-2"
                    onSubmit={handleTopbarSubmit}
                >
                    <div
                        className={cn(
                            'flex h-11 min-w-0 flex-1 items-center rounded-full border px-3.5 transition-all focus-within:ring-2 focus-within:ring-blue-500/50',
                            transparent
                                ? 'border-white/20 bg-white/10 text-white'
                                : 'border-slate-200 bg-slate-50 text-slate-800',
                        )}
                    >
                        <Search
                            className={cn(
                                'mr-1.5 h-4 w-4 shrink-0',
                                transparent
                                    ? 'text-white/70'
                                    : 'text-slate-400',
                            )}
                        />
                        <input
                            type="search"
                            placeholder={
                                search?.placeholder ?? 'Cari kota, destinasi...'
                            }
                            className={cn(
                                'min-w-0 flex-1 border-none bg-transparent py-2 text-sm font-medium focus:outline-none',
                                transparent
                                    ? 'placeholder:text-white/70'
                                    : 'placeholder:text-slate-400',
                            )}
                            value={activeSearchValue}
                            onChange={(event) =>
                                handleTopbarChange(event.target.value)
                            }
                            onFocus={() => setTopbarOpen(true)}
                        />
                    </div>
                    <button
                        type="submit"
                        aria-label="Cari"
                        className="inline-flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm transition hover:bg-sky-700 md:hidden"
                    >
                        <Search className="h-4 w-4" />
                    </button>
                </form>
                {showDiscovery && (
                    <div className="absolute top-full right-0 left-0 z-50 mt-3 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_80px_-34px_rgba(15,23,42,0.35)]">
                        {topbarProducts.length > 0 && (
                            <div className="border-b border-slate-100 p-4">
                                <div className="px-1 text-[11px] font-bold text-slate-400 uppercase">
                                    Rekomendasi produk
                                </div>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                    {topbarProducts.map((item) => (
                                        <button
                                            key={`${item.label}-${item.url ?? item.product_type_label}`}
                                            type="button"
                                            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
                                            onMouseDown={(event) =>
                                                event.preventDefault()
                                            }
                                            onClick={() =>
                                                handleTopbarNavigate(
                                                    item.url,
                                                    item.label,
                                                )
                                            }
                                        >
                                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                                                <img
                                                    src={
                                                        item.image ??
                                                        '/images/placeholder-card.jpg'
                                                    }
                                                    alt={item.label}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold text-slate-900">
                                                    {item.label}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {item.product_type_label ??
                                                        'Produk pilihan'}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {topbarKeywords.length > 0 && (
                            <div className="p-4">
                                <div className="px-1 text-[11px] font-bold text-slate-400 uppercase">
                                    Pencarian populer
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {topbarKeywords.map((item) => (
                                        <button
                                            key={`${item.label}-${item.product_type_label}`}
                                            type="button"
                                            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                            onMouseDown={(event) =>
                                                event.preventDefault()
                                            }
                                            onClick={() =>
                                                handleTopbarNavigate(
                                                    item.url,
                                                    item.label,
                                                )
                                            }
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <header
            className={cn(
                transparent
                    ? 'absolute top-0 right-0 left-0 z-30 border-b border-white/10 bg-gradient-to-b from-black/50 to-transparent text-white shadow-none transition-all duration-300'
                    : 'sticky top-0 z-30 border-b border-slate-100 bg-white text-slate-800 shadow-sm transition-all duration-300',
                isUser && 'public-user-header',
            )}
        >
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-[72px] items-center gap-4 xl:gap-5">
                    <Link
                        href="/"
                        className="group flex shrink-0 items-center gap-2"
                        data-skip-action-loading="true"
                    >
                        <img
                            src="/logo.png"
                            alt="Indotix"
                            className={cn(
                                'h-10 object-contain transition-transform group-hover:scale-105 md:h-11 md:w-36',
                                isUser ? 'w-24' : 'w-32',
                            )}
                        />
                    </Link>

                    <nav
                        className="hidden min-w-0 items-center gap-1 text-sm font-medium lg:flex xl:gap-1.5"
                        id="desktop-nav"
                    >
                        {mainNav.map((item) => {
                            const active =
                                item.href === '/'
                                    ? pathname === '/'
                                    : isActivePath(item.href.split('#')[0]);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'relative inline-flex min-h-10 items-center rounded-lg px-2.5 py-2 transition-colors xl:px-3',
                                        (item.href === '/jelajah' || item.href === '/about') && 'hidden xl:inline-flex',
                                        active
                                            ? transparent
                                                ? 'bg-white/15 text-white'
                                                : 'bg-sky-50 text-sky-700'
                                            : transparent
                                              ? 'text-white/90 hover:bg-white/10 hover:text-white'
                                              : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700',
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {showSearch &&
                        renderSearch(
                            isUser
                                ? 'hidden w-56 shrink-0 2xl:flex'
                                : 'hidden w-56 shrink-0 lg:flex xl:w-64',
                        )}

                    <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
                        {!auth?.user && (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className={cn(
                                        'inline-flex min-h-10 items-center rounded-full px-4 py-2 text-sm font-semibold transition',
                                        transparent
                                            ? 'text-white hover:bg-white/10'
                                            : 'text-slate-700 hover:bg-slate-100',
                                    )}
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href="/register"
                                    className="inline-flex min-h-10 items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                                >
                                    Daftar
                                </Link>
                            </div>
                        )}
                        {isUser && (
                            <div
                                data-coach="public-user-menu"
                                className={cn(
                                    'flex items-center gap-1.5 text-sm font-semibold',
                                    transparent
                                        ? 'text-white/90'
                                        : 'text-slate-600',
                                )}
                            >
                                <div
                                    className={cn(
                                        'mx-1 h-7 w-px',
                                        transparent
                                            ? 'bg-white/20'
                                            : 'bg-slate-200',
                                    )}
                                    aria-hidden="true"
                                />

                                {userMenu
                                    .filter((item) => item.show)
                                    .map((item) => {
                                        const active = isActivePath(item.href);
                                        const isProfile =
                                            item.href === '/settings/profile';

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                aria-label={item.label}
                                                title={item.label}
                                                className={cn(
                                                    'relative inline-flex min-h-10 items-center justify-center rounded-xl transition-colors',
                                                    isProfile
                                                        ? 'gap-2 px-3'
                                                        : 'size-10',
                                                    transparent
                                                        ? active
                                                            ? 'bg-white/15 text-white'
                                                            : 'text-white/85 hover:bg-white/10 hover:text-white'
                                                        : active
                                                          ? 'bg-sky-50 text-sky-700'
                                                          : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700',
                                                )}
                                            >
                                                <item.icon className="h-[18px] w-[18px] shrink-0" />
                                                {isProfile && (
                                                    <span className="hidden 2xl:inline">
                                                        Profile
                                                    </span>
                                                )}
                                                {item.href ===
                                                    '/notifications' &&
                                                    Boolean(
                                                        unread_notifications,
                                                    ) && (
                                                        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                                                            {unread_notifications}
                                                        </span>
                                                    )}
                                            </Link>
                                        );
                                    })}
                            </div>
                        )}
                        {isNonUser && (
                            <div
                                className={cn(
                                    'flex items-center gap-3 text-sm font-semibold',
                                    transparent
                                        ? 'text-white/90'
                                        : 'text-slate-600',
                                )}
                            >
                                <Link
                                    href={dashboardHref}
                                    className={cn(
                                        'flex items-center gap-2',
                                        transparent
                                            ? 'hover:text-white'
                                            : 'hover:text-sky-600',
                                        isActivePath(dashboardHref) &&
                                            (transparent
                                                ? 'text-white'
                                                : 'text-sky-600'),
                                    )}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    {dashboardLabel}
                                </Link>
                                <Link
                                    href={logout()}
                                    as="button"
                                    onClick={handleLogout}
                                    className={cn(
                                        'flex items-center gap-2',
                                        transparent
                                            ? 'text-white/90 hover:text-white'
                                            : 'text-rose-600 hover:text-rose-700',
                                    )}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="ml-auto flex items-center gap-2 md:hidden">
                        {isUser && (
                            <>
                                <Link
                                    href="/notifications"
                                    aria-label="Notifikasi"
                                    className="public-user-header__icon relative"
                                >
                                    <Bell className="h-5 w-5" />
                                    {Boolean(unread_notifications) && (
                                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                                            {unread_notifications}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    href="/chat"
                                    aria-label="Percakapan"
                                    className="public-user-header__icon"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                </Link>
                            </>
                        )}
                        {!auth?.user ? (
                            <Link
                                href="/login"
                                className={cn(
                                    'inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-bold shadow-sm transition',
                                    transparent
                                        ? 'bg-white text-sky-700 hover:bg-sky-50'
                                        : 'bg-sky-600 text-white hover:bg-sky-700',
                                )}
                            >
                                Masuk
                            </Link>
                        ) : (
                            <Sheet>
                                <SheetTrigger
                                    aria-label="Buka menu lainnya"
                                    className={cn(
                                        'inline-flex shrink-0 items-center justify-center rounded-full border p-2 shadow-sm',
                                        transparent
                                            ? 'border-white/20 bg-white/10 text-white'
                                            : 'border-slate-200 bg-white text-slate-600',
                                        isUser && 'public-user-header__icon',
                                    )}
                                >
                                    <Menu className="h-5 w-5" />
                                </SheetTrigger>
                                <SheetContent side="left" className="w-72">
                                    <SheetHeader>
                                        <SheetTitle>Menu</SheetTitle>
                                    </SheetHeader>
                                    <div className="flex flex-col gap-4 px-4 pb-6">
                                        {!auth?.user && (
                                            <div className="grid gap-2">
                                                <SheetClose asChild>
                                                    <Link
                                                        href="/register"
                                                        className="rounded-lg bg-sky-600 px-4 py-2 text-center text-sm font-semibold text-white"
                                                    >
                                                        Register
                                                    </Link>
                                                </SheetClose>
                                                <SheetClose asChild>
                                                    <Link
                                                        href="/login"
                                                        className="rounded-lg border border-blue-600 px-4 py-2 text-center text-sm font-semibold text-blue-600"
                                                    >
                                                        Login
                                                    </Link>
                                                </SheetClose>
                                            </div>
                                        )}
                                        {isUser && (
                                            <div className="grid gap-2">
                                                {userMenu
                                                    .filter((item) => item.show)
                                                    .map((item) => (
                                                        <SheetClose
                                                            asChild
                                                            key={item.href}
                                                        >
                                                            <Link
                                                                href={item.href}
                                                                className={cn(
                                                                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
                                                                    isActivePath(
                                                                        item.href,
                                                                    )
                                                                        ? 'bg-sky-50 text-sky-700'
                                                                        : 'text-slate-600 hover:bg-slate-50',
                                                                )}
                                                            >
                                                                <item.icon className="h-4 w-4" />
                                                                {item.label}
                                                            </Link>
                                                        </SheetClose>
                                                    ))}
                                            </div>
                                        )}
                                        {isNonUser && (
                                            <div className="grid gap-2">
                                                <SheetClose asChild>
                                                    <Link
                                                        href={dashboardHref}
                                                        className={cn(
                                                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
                                                            isActivePath(
                                                                dashboardHref,
                                                            )
                                                                ? 'bg-sky-50 text-sky-700'
                                                                : 'text-slate-600 hover:bg-slate-50',
                                                        )}
                                                    >
                                                        <LayoutGrid className="h-4 w-4" />
                                                        {dashboardLabel}
                                                    </Link>
                                                </SheetClose>
                                                <SheetClose asChild>
                                                    <Link
                                                        href={logout()}
                                                        as="button"
                                                        onClick={handleLogout}
                                                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                                                    >
                                                        <LogOut className="h-4 w-4" />
                                                        Logout
                                                    </Link>
                                                </SheetClose>
                                            </div>
                                        )}
                                        {showCategories && hasCategories && (
                                            <div className="grid gap-2">
                                                <div className="text-xs font-semibold text-slate-400 uppercase">
                                                    Kategori
                                                </div>
                                                {resolvedCategories.map(
                                                    (item) => {
                                                        const active =
                                                            item.active ??
                                                            isActivePath(
                                                                item.href,
                                                            );
                                                        return (
                                                            <SheetClose
                                                                asChild
                                                                key={item.href}
                                                            >
                                                                <Link
                                                                    href={
                                                                        item.href
                                                                    }
                                                                    className={cn(
                                                                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
                                                                        active
                                                                            ? 'bg-slate-100 text-slate-900'
                                                                            : 'text-slate-600 hover:bg-slate-50',
                                                                    )}
                                                                >
                                                                    <item.icon className="h-4 w-4" />
                                                                    {item.label}
                                                                </Link>
                                                            </SheetClose>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        )}
                    </div>
                </div>
            </div>

            {showCategories && hasCategories && (
                <div
                    className="hidden border-t border-slate-100 bg-white/90 md:block"
                    data-coach="public-categories"
                >
                    <div className="mx-auto flex w-full max-w-7xl snap-x snap-proximity items-center gap-3 overflow-x-auto px-4 py-3 text-sm font-semibold [scrollbar-width:none] md:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
                        {resolvedCategories.map((item) => {
                            const active =
                                item.active ?? isActivePath(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex min-h-10 snap-start items-center gap-2 rounded-full px-4 py-2 whitespace-nowrap transition',
                                        active
                                            ? 'bg-sky-600 text-white shadow-sm'
                                            : 'bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-700',
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {showChips && hasChips && (
                <div
                    className={cn(
                        'border-t border-slate-100',
                        isUser && 'hidden md:block',
                    )}
                >
                    <div className="mx-auto flex w-full max-w-7xl snap-x snap-proximity gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] md:flex-wrap md:overflow-visible md:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
                        {chips.map((chip) => (
                            <span
                                key={chip}
                                className="min-h-9 snap-start rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold whitespace-nowrap text-slate-600 shadow-sm"
                            >
                                {chip}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}
