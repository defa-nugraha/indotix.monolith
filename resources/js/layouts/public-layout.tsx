import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import PublicHeader, { type PublicHeaderProps } from '@/components/public-header';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type PublicLayoutProps = PublicHeaderProps & {
    children: ReactNode;
    skeleton?: React.ReactNode;
    className?: string;
    contentClassName?: string;
};

export default function PublicLayout({
    children,
    skeleton,
    className,
    contentClassName,
    ...headerProps
}: PublicLayoutProps) {
    const { url } = usePage();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setReady(false);
        const timer = setTimeout(() => setReady(true), 320);
        return () => clearTimeout(timer);
    }, [url]);

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
        []
    );

    return (
        <div className={cn('min-h-screen bg-[#f4f6f8] text-slate-900', className)}>
            <PublicHeader {...headerProps} />
            <div className={cn('relative', contentClassName)} aria-busy={!ready}>
                <div className={cn('transition-opacity duration-200', ready ? 'opacity-100' : 'pointer-events-none opacity-0')}>
                    {children}
                </div>
                {!ready && (
                    <div className="absolute inset-0">
                        {skeleton ?? fallbackSkeleton}
                    </div>
                )}
            </div>
        </div>
    );
}
