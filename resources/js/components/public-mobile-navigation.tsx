import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    BadgePercent,
    BookOpen,
    History,
    Home,
    Info,
    LoaderCircle,
    Map as MapIcon,
    ScanLine,
    UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PublicMobileNavigation() {
    const page = usePage();
    const pathname = (page.url || '').split(/[?#]/)[0] || '/';
    const auth = (
        page.props as {
            auth?: { user?: { role?: string } };
        }
    ).auth;
    const role = auth?.user?.role;
    const isUser = role === 'user';
    const [loadingHref, setLoadingHref] = useState<string | null>(null);

    useEffect(() => {
        setLoadingHref(null);
    }, [pathname]);

    if (role && !isUser) {
        return null;
    }

    const isActivePath = (paths: string[]) =>
        paths.some(
            (path) => pathname === path || pathname.startsWith(`${path}/`),
        );

    const items = isUser
        ? [
              {
                  label: 'Beranda',
                  href: '/',
                  icon: Home,
                  active: pathname === '/',
              },
              {
                  label: 'Destinasi',
                  href: '/wisata',
                  icon: MapIcon,
                  active: isActivePath(['/wisata']),
              },
              {
                  label: 'Scan',
                  href: '/tickets/scan',
                  icon: ScanLine,
                  active: isActivePath(['/tickets/scan']),
                  prominent: true,
              },
              {
                  label: 'Riwayat',
                  href: '/history',
                  icon: History,
                  active: isActivePath(['/history']),
              },
              {
                  label: 'Profil',
                  href: '/settings/profile',
                  icon: UserCircle,
                  active: isActivePath(['/settings']),
              },
          ]
        : [
              {
                  label: 'Beranda',
                  href: '/',
                  icon: Home,
                  active: pathname === '/',
              },
              {
                  label: 'Destinasi',
                  href: '/wisata',
                  icon: MapIcon,
                  active: isActivePath(['/wisata']),
              },
              {
                  label: 'Promo',
                  href: '/promo',
                  icon: BadgePercent,
                  active: isActivePath(['/promo']),
              },
              {
                  label: 'Jelajah',
                  href: '/jelajah',
                  icon: BookOpen,
                  active: isActivePath(['/jelajah']),
              },
              {
                  label: 'Tentang',
                  href: '/about',
                  icon: Info,
                  active: isActivePath(['/about']),
              },
          ];

    return (
        <nav
            aria-label="Navigasi utama pengguna"
            className={cn(
                'public-mobile-navigation md:hidden',
                !isUser && 'is-public',
            )}
        >
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    aria-current={item.active ? 'page' : undefined}
                    onClick={() => {
                        if (!item.active) {
                            setLoadingHref(item.href);
                        }
                    }}
                    className={cn(
                        'public-mobile-navigation__item',
                        item.active && 'is-active',
                        'prominent' in item && item.prominent && 'is-prominent',
                    )}
                >
                    {loadingHref === item.href ? (
                        <LoaderCircle
                            aria-hidden="true"
                            className="h-5 w-5 animate-spin"
                        />
                    ) : (
                        <item.icon aria-hidden="true" className="h-5 w-5" />
                    )}
                    <span>{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}
