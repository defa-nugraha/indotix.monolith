import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarAdmin } from '@/components/app-sidebar-admin';
import { AppSidebarMitra } from '@/components/app-sidebar-mitra';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage<SharedData>().props;
    const role = auth?.user?.role;
    const isMitra = role === 'mitra';
    return (
        <AppShell variant="sidebar" className="theme-light">
            {isMitra ? <AppSidebarMitra /> : <AppSidebarAdmin />}
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
