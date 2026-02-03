import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Bell, UserCircle } from 'lucide-react';
import { NavUser } from '@/components/nav-user';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth, unread_notifications } = usePage().props as {
        auth?: { user?: { role?: string; mitra_onboarding_type?: string | null } };
        unread_notifications?: number;
    };
    const isMitra = auth?.user?.role === 'mitra';
    const onboardingType = auth?.user?.mitra_onboarding_type ?? null;
    const notificationHref = onboardingType === 'wisata' ? '/mitra/wisata/notifications' : null;

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-4">
                {isMitra && (
                    <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                        {notificationHref && (
                            <Link href={notificationHref} className="relative flex items-center gap-2 hover:text-sky-600">
                                <Bell className="h-4 w-4" />
                                Notifikasi
                                {Boolean(unread_notifications) && (
                                    <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                        {unread_notifications}
                                    </span>
                                )}
                            </Link>
                        )}
                    </div>
                )}
                <NavUser />
            </div>
        </header>
    );
}
