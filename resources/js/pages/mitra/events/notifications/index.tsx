import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type NotificationRow = {
    id: number;
    title: string;
    message: string;
    created_at: string | null;
    read_at: string | null;
};

type Props = {
    notifications: NotificationRow[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Notifikasi', href: '/mitra/events/notifications' },
];

export default function MitraEventNotifications({ notifications }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifikasi Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Notifikasi</h1>
                    <div className="mt-4 grid gap-3">
                        {notifications.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                                <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                                <div className="mt-1 text-xs text-slate-500">{item.created_at}</div>
                                <p className="mt-2 text-sm text-slate-600">{item.message}</p>
                            </div>
                        ))}
                        {notifications.length === 0 && (
                            <div className="text-sm text-slate-500">Belum ada notifikasi.</div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
