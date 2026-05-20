import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarAdmin } from '@/components/app-sidebar-admin';
import { AppSidebarMitra } from '@/components/app-sidebar-mitra';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { loadCkeditor, warmupCkeditor } from '@/lib/ckeditor-loader';
import Swal from 'sweetalert2';
import CoachMarks from '@/components/coach-marks';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage<SharedData>().props;
    const role = auth?.user?.role;
    const isMitra = role === 'mitra';
    const page = usePage();
    const currentUrl = page.url ?? window.location.pathname;
    const errors = (page.props as { errors?: Record<string, string> }).errors;
    const mitraError = errors?.mitra;
    const hasShownSuspendedRef = useRef(false);

    useEffect(() => {
        const shouldPreload =
            role === 'admin' &&
            (currentUrl.startsWith('/admin/blog/posts/create') ||
                (currentUrl.includes('/admin/blog/posts/') &&
                    currentUrl.endsWith('/edit')));
        if (shouldPreload) {
            warmupCkeditor();
            loadCkeditor().catch(() => null);
        }
    }, [role, currentUrl]);

    useEffect(() => {
        if (!isMitra || hasShownSuspendedRef.current) {
            return;
        }

        const user = auth?.user;
        if (user?.is_suspended) {
            const reason = user.suspended_reason
                ? `Alasan: ${user.suspended_reason}`
                : 'Silakan hubungi admin untuk informasi lebih lanjut.';
            Swal.fire({
                icon: 'warning',
                title: 'Akun Anda Disuspend',
                text: reason,
                confirmButtonText: 'Mengerti',
            });
            hasShownSuspendedRef.current = true;
            return;
        }

        if (mitraError && mitraError.toLowerCase().includes('suspend')) {
            Swal.fire({
                icon: 'warning',
                title: 'Akun Mitra Disuspend',
                text: mitraError,
                confirmButtonText: 'Mengerti',
            });
            hasShownSuspendedRef.current = true;
        }
    }, [isMitra, auth?.user, mitraError]);

    return (
        <AppShell variant="sidebar" className="theme-light">
            {isMitra ? <AppSidebarMitra /> : <AppSidebarAdmin />}
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <CoachMarks context={isMitra ? 'mitra' : 'admin'} />
        </AppShell>
    );
}
