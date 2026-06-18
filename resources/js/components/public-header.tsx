import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BadgePercent, Bell, History, LayoutGrid, LogOut, Menu, MessageCircle, ShoppingCart, UserCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
};

export default function PublicHeader({
    categories,
    chips = [],
    search,
    showSearch = true,
    showCategories = true,
    showChips = true,
}: PublicHeaderProps) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_menu } = usePage().props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
        affiliate_menu?: boolean;
    };
    const url = usePage().url || '';
    const pathname = url.split('?')[0] ?? '';
    const role = auth?.user?.role;
    const isUser = role === 'user';
    const isLoggedIn = Boolean(auth?.user);
    const isNonUser = isLoggedIn && !isUser;
    const showCart = !isNonUser;

    const isActivePath = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    const resolvedCategories = categories ?? [];
    const hasCategories = resolvedCategories.length > 0;
    const hasChips = chips.length > 0;
    const dashboardHref = role === 'mitra' ? '/mitra/dashboard' : '/dashboard';
    const dashboardLabel = role === 'mitra' ? 'Dashboard Mitra' : 'Dashboard';
    const [topbarSearchValue, setTopbarSearchValue] = useState(search?.value ?? '');
    const [topbarOpen, setTopbarOpen] = useState(false);
    const [topbarProducts, setTopbarProducts] = useState<HeaderDiscoveryProduct[]>([]);
    const [topbarKeywords, setTopbarKeywords] = useState<HeaderDiscoveryKeyword[]>([]);
    const searchWrapperRef = useRef<HTMLDivElement | null>(null);
    const activeSearchValue = search?.value ?? topbarSearchValue;

    const handleLogout = () => {
        router.flushAll();
    };

    const userMenu = [
        { label: 'Profile', href: '/settings/profile', icon: UserCircle, show: true },
        { label: 'Afiliasi', href: '/affiliate', icon: BadgePercent, show: Boolean(affiliate_menu) },
        { label: 'Riwayat', href: '/history', icon: History, show: true },
        { label: 'Chat', href: '/chat', icon: MessageCircle, show: true },
        { label: 'Notifikasi', href: '/notifications', icon: Bell, show: true },
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
                const target = new URL('/api/discovery/global/suggestions', window.location.origin);
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

    const renderSearch = (className?: string) => {
        const showDiscovery = topbarOpen && (topbarProducts.length > 0 || topbarKeywords.length > 0);

        return (
            <div
                className={cn('relative flex w-full min-w-0 items-center', className)}
                ref={searchWrapperRef}
                data-coach="public-search"
            >
                {search?.onSubmit ? (
                    <form className="w-full min-w-0" onSubmit={search.onSubmit}>
                        <input
                            type="text"
                            placeholder={search.placeholder ?? 'Cari kota/hotel/wisata/event...'}
                            className="h-12 w-full min-w-0 rounded-full border border-slate-200 px-5 text-sm shadow-sm focus:border-sky-400 focus:outline-none"
                            value={activeSearchValue}
                            onChange={(event) => handleTopbarChange(event.target.value)}
                            onFocus={() => setTopbarOpen(true)}
                        />
                    </form>
                ) : (
                    <input
                        type="text"
                        placeholder={search?.placeholder ?? 'Cari kota/hotel/wisata/event...'}
                        className="h-12 w-full min-w-0 rounded-full border border-slate-200 px-5 text-sm shadow-sm focus:border-sky-400 focus:outline-none"
                        value={activeSearchValue}
                        onChange={(event) => handleTopbarChange(event.target.value)}
                        onFocus={() => setTopbarOpen(true)}
                    />
                )}
                {showDiscovery && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-3 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_80px_-34px_rgba(15,23,42,0.35)]">
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
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() =>
                                                handleTopbarNavigate(
                                                    item.url,
                                                    item.label,
                                                )
                                            }
                                        >
                                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                                                <img
                                                    src={item.image ?? '/images/placeholder-card.jpg'}
                                                    alt={item.label}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold text-slate-900">
                                                    {item.label}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {item.product_type_label ?? 'Produk pilihan'}
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
                                            onMouseDown={(event) => event.preventDefault()}
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
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2" data-skip-action-loading="true">
                        <img src="/logo.png" alt="Indotix" className="h-10 w-32 object-contain md:h-11 md:w-36" />
                    </Link>

                    {showSearch && renderSearch('flex-1')}

                    <div className="hidden items-center gap-4 md:flex">
                        {showCart && (
                            <Link href="/retail-shop/cart" data-coach="public-cart" className="relative flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600">
                                <ShoppingCart className="h-4 w-4" />
                                Keranjang
                                {Boolean(souvenir_cart_count) && (
                                    <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                                        {souvenir_cart_count}
                                    </span>
                                )}
                            </Link>
                        )}
                        {!auth?.user && (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/register"
                                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                                >
                                    Register
                                </Link>
                                <Link
                                    href="/login"
                                    className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                                >
                                    Login
                                </Link>
                            </div>
                        )}
                        {isUser && (
                            <div data-coach="public-user-menu" className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                                {userMenu
                                    .filter((item) => item.show)
                                    .map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-2 hover:text-sky-600',
                                                isActivePath(item.href) && 'text-sky-600'
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.label}
                                            {item.href === '/notifications' && Boolean(unread_notifications) && (
                                                <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                                    {unread_notifications}
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                            </div>
                        )}
                        {isNonUser && (
                            <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                                <Link
                                    href={dashboardHref}
                                    className={cn(
                                        'flex items-center gap-2 hover:text-sky-600',
                                        isActivePath(dashboardHref) && 'text-sky-600'
                                    )}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    {dashboardLabel}
                                </Link>
                                <Link
                                    href={logout()}
                                    as="button"
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-rose-600 hover:text-rose-700"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:hidden">
                        {showCart && (
                            <Link href="/retail-shop/cart" data-coach="public-cart" className="relative inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600">
                                <ShoppingCart className="h-4 w-4" />
                                <span className="hidden sm:inline">Keranjang</span>
                                <span className="sr-only">Keranjang</span>
                                {Boolean(souvenir_cart_count) && (
                                    <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                                        {souvenir_cart_count}
                                    </span>
                                )}
                            </Link>
                        )}
                        <Sheet>
                            <SheetTrigger className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600">
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
                                                <Link href="/register" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white text-center">
                                                    Register
                                                </Link>
                                            </SheetClose>
                                            <SheetClose asChild>
                                                <Link href="/login" className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 text-center">
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
                                                    <SheetClose asChild key={item.href}>
                                                        <Link
                                                            href={item.href}
                                                            className={cn(
                                                                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
                                                                isActivePath(item.href) ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'
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
                                                        isActivePath(dashboardHref) ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'
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
                                            <div className="text-xs font-semibold uppercase text-slate-400">Kategori</div>
                                            {resolvedCategories.map((item) => {
                                                const active = item.active ?? isActivePath(item.href);
                                                return (
                                                    <SheetClose asChild key={item.href}>
                                                        <Link
                                                            href={item.href}
                                                            className={cn(
                                                                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
                                                                active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                                                            )}
                                                        >
                                                            <item.icon className="h-4 w-4" />
                                                            {item.label}
                                                        </Link>
                                                    </SheetClose>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>

            {showCategories && hasCategories && (
                <div className="border-t border-slate-100" data-coach="public-categories">
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-6 overflow-x-auto px-4 py-3 text-sm font-semibold md:px-8">
                        {resolvedCategories.map((item) => {
                            const active = item.active ?? isActivePath(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn('flex items-center gap-2 whitespace-nowrap', active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900')}
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
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-3 md:flex-wrap md:overflow-visible md:px-8">
                        {chips.map((chip) => (
                            <span key={chip} className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-1 text-xs font-medium text-slate-600">
                                {chip}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}
