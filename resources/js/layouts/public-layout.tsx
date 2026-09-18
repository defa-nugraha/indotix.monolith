import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import PublicHeader, {
    type PublicHeaderProps,
} from '@/components/public-header';
import { PublicSeo } from '@/components/public-seo';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import CoachMarks from '@/components/coach-marks';
import PublicMobileNavigation from '@/components/public-mobile-navigation';
import Swal from 'sweetalert2';

type PublicLayoutProps = PublicHeaderProps & {
    children: ReactNode;
    skeleton?: React.ReactNode;
    className?: string;
    contentClassName?: string;
    coachContext?: 'public' | 'none';
    hideMobileHeader?: boolean;
};

export default function PublicLayout({
    children,
    skeleton,
    className,
    contentClassName,
    coachContext = 'public',
    hideMobileHeader = false,
    ...headerProps
}: PublicLayoutProps) {
    const { url } = usePage();
    const { errors, auth } = usePage().props as {
        errors?: Record<string, string>;
        auth?: { user?: { role?: string } };
    };
    const { public_whatsapp_number } = usePage().props as {
        public_whatsapp_number?: string | null;
    };
    const [ready, setReady] = useState(false);
    const publicPath = url.split(/[?#]/)[0] || '/';
    const isUser = auth?.user?.role === 'user';
    const showMobileNavigation = !auth?.user || isUser;
    const isPrivatePage =
        /\/(booking|bookings|payment|checkout|history|notifications|cart|affiliate)(\/|$)/.test(
            publicPath,
        );
    const whatsappDigits = (public_whatsapp_number ?? '').replace(/\D/g, '');
    const whatsappUrl = whatsappDigits
        ? `https://wa.me/${whatsappDigits}`
        : null;

    useEffect(() => {
        // Render immediately after navigation. The previous artificial delay
        // made fast pages feel slower and caused a visible skeleton flicker.
        setReady(true);
    }, [url]);

    useEffect(() => {
        if (!errors?.maintenance) {
            return;
        }

        Swal.fire({
            icon: 'info',
            title: 'Sistem sedang maintenance',
            text: errors.maintenance,
            confirmButtonText: 'Mengerti',
        });
    }, [errors?.maintenance]);

    const fallbackSkeleton = useMemo(
        () => (
            <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                <div className="space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-40 w-full rounded-2xl" />
                    <div className="grid gap-4 md:grid-cols-2">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Skeleton className="h-56 w-full rounded-2xl" />
                        <Skeleton className="h-56 w-full rounded-2xl" />
                        <Skeleton className="h-56 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        ),
        [],
    );

    return (
        <div
            className={cn(
                'public-shell min-h-screen bg-[#f4f6f8] text-slate-900',
                isUser && 'public-user-shell',
                showMobileNavigation && 'public-mobile-nav-shell',
                className,
            )}
        >
            {isUser && (
                <Head>
                    <link
                        href="https://fonts.bunny.net/css?family=sora:400,500,600,700"
                        rel="stylesheet"
                    />
                </Head>
            )}
            <PublicSeo
                title="Indotix - Tiket Wisata dan Destinasi Rekreasi"
                description="Temukan dan pesan tiket wisata, taman hiburan, serta destinasi rekreasi pilihan melalui Indotix."
                canonicalPath={publicPath}
                robots={
                    isPrivatePage
                        ? 'noindex,nofollow,noarchive'
                        : 'index,follow,max-image-preview:large'
                }
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: 'Indotix',
                    url: '/',
                    inLanguage: 'id-ID',
                }}
            />
            <div className={cn(hideMobileHeader && 'hidden md:block')}>
                <PublicHeader {...headerProps} />
            </div>
            <div
                className={cn('relative', contentClassName)}
                aria-busy={!ready}
            >
                <div
                    className={cn(
                        'transition-opacity duration-200',
                        ready ? 'opacity-100' : 'pointer-events-none opacity-0',
                    )}
                >
                    {children}
                </div>
                {!ready && (
                    <div className="absolute inset-0">
                        {skeleton ?? fallbackSkeleton}
                    </div>
                )}
            </div>
            {whatsappUrl && (
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Hubungi Indotix via WhatsApp"
                    className="public-whatsapp-float fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-[#1ebe5d] focus:ring-4 focus:ring-emerald-200 focus:outline-none md:right-6 md:bottom-8 md:h-14 md:w-14"
                >
                    <svg
                        viewBox="0 0 32 32"
                        aria-hidden="true"
                        className="h-8 w-8"
                        fill="currentColor"
                    >
                        <path d="M16.02 3.2A12.67 12.67 0 0 0 5.14 22.4L3.6 28.8l6.55-1.52A12.66 12.66 0 1 0 16.02 3.2Zm0 2.3a10.36 10.36 0 1 1-5.27 19.27l-.42-.25-3.6.84.86-3.5-.28-.45A10.36 10.36 0 0 1 16.02 5.5Zm-4.04 5.57c-.24 0-.62.09-.94.43-.32.35-1.23 1.2-1.23 2.94 0 1.73 1.26 3.4 1.43 3.64.18.23 2.44 3.9 6.05 5.31 3 .57 3.62.46 4.27.29.66-.17 2.13-.87 2.43-1.72.3-.84.3-1.56.21-1.72-.09-.15-.33-.24-.7-.43-.36-.18-2.12-1.04-2.45-1.16-.33-.12-.57-.18-.8.18-.24.36-.93 1.16-1.14 1.4-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.9-1.79-1.07-.96-1.8-2.14-2.01-2.5-.21-.36-.02-.56.16-.74.16-.16.36-.42.54-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63-.09-.18-.8-1.93-1.1-2.65-.29-.7-.58-.6-.8-.61l-.67-.01Z" />
                    </svg>
                </a>
            )}
            {showMobileNavigation && <PublicMobileNavigation />}
            {coachContext !== 'none' && <CoachMarks context="public" />}
        </div>
    );
}
