import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type Props = {
    children: ReactNode;
    variant?: 'header' | 'sidebar';
    className?: string;
};

export function AppShell({ children, variant = 'header', className }: Props) {
    const isOpen = usePage<SharedData>().props.sidebarOpen;

    useEffect(() => {
        if (variant !== 'sidebar') {
            return;
        }

        const root = document.documentElement;
        const hadDark = root.classList.contains('dark');

        root.classList.remove('dark');
        root.classList.add('theme-light');

        return () => {
            root.classList.remove('theme-light');
            if (hadDark) {
                root.classList.add('dark');
            }
        };
    }, [variant]);

    if (variant === 'header') {
        return (
            <div className={cn('flex min-h-screen w-full flex-col', className)}>
                {children}
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen} className={className}>
            {children}
        </SidebarProvider>
    );
}
