import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AffiliateLayout from '@/layouts/affiliate-layout';

type Notification = {
    id: number;
    title: string;
    message: string;
    created_at: string;
};

export default function AffiliateNotifications({ notifications }: { notifications: { data: Notification[] } }) {
    return (
        <>
            <Head title="Notifikasi Afiliasi" />
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase text-sky-600">Notifikasi</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">Update terbaru afiliasi</h1>
                </div>

                <div className="space-y-3">
                    {notifications.data.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                                </div>
                                <p className="text-xs text-slate-400">
                                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                                </p>
                            </div>
                        </div>
                    ))}
                    {notifications.data.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                            Belum ada notifikasi afiliasi.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

AffiliateNotifications.layout = (page: ReactNode) => <AffiliateLayout active="notifications">{page}</AffiliateLayout>;
