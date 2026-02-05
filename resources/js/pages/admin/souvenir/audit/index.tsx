import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Log = {
    id: number;
    action: string;
    description?: string | null;
    created_at?: string | null;
    user?: { id: number; name: string } | null;
    data?: Record<string, any> | null;
};

export default function SouvenirAuditIndex({ logs }: { logs: { data: Log[]; links: any[] } }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Souvenir', href: '/admin/souvenir/products' },
        { title: 'Audit Log', href: '/admin/souvenir/audit' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log Souvenir" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Audit Log</h1>
                    <p className="text-sm text-slate-500">Catatan perubahan harga, stok, refund, dan aktivitas penting.</p>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                    <th className="px-4 py-3 text-left">Deskripsi</th>
                                    <th className="px-4 py-3 text-left">Admin</th>
                                    <th className="px-4 py-3 text-left">Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{log.action}</td>
                                        <td className="px-4 py-3 text-slate-600">{log.description ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{log.user?.name ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
