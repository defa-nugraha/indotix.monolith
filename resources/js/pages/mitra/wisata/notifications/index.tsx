import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    created_at: string;
    read_at: string | null;
};

type Props = {
    notifications: NotificationItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Notifikasi', href: '/mitra/wisata/notifications' },
];

export default function MitraWisataNotifications({ notifications }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifikasi Mitra Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Notifikasi</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">Update Terbaru</h1>
                    <p className="text-sm text-slate-500">
                        Informasi booking baru, validasi tiket, dan lainnya.
                    </p>
                </section>

                <section className="grid gap-3">
                    {notifications.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-sky-100/80 bg-white/90 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                                </div>
                                <Badge className={item.read_at ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}>
                                    {item.read_at ? 'Dibaca' : 'Baru'}
                                </Badge>
                            </div>
                            <p className="mt-2 text-xs text-slate-400">{item.created_at}</p>
                        </div>
                    ))}
                    {notifications.length === 0 && (
                        <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 text-center text-sm text-slate-500">
                            Belum ada notifikasi.
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
