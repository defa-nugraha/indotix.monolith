import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type LogItem = {
    id: number;
    action: string;
    subject_type?: string | null;
    subject_id?: number | null;
    meta?: Record<string, unknown> | null;
    created_at?: string | null;
};

type Props = {
    logs: { data: LogItem[] };
};

export default function WisataAffiliateAudit({ logs }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wisata', href: '/admin/wisata/destinations' },
        { title: 'Afiliasi Wisata', href: '/admin/wisata/affiliates' },
        { title: 'Audit Log', href: '/admin/wisata/affiliates/system/audit' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log Afiliasi" />
            <div className="px-4 md:px-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Audit Log</h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="py-2">Aksi</th>
                                    <th>Subject</th>
                                    <th>Waktu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.data.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3">{item.action}</td>
                                        <td>{item.subject_type ?? '-'} #{item.subject_id ?? '-'}</td>
                                        <td>{item.created_at ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {logs.data.length === 0 && <div className="py-6 text-center text-sm text-slate-500">Belum ada audit.</div>}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
