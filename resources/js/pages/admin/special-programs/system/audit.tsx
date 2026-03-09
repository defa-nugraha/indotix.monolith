import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type LogRow = {
    id: number;
    action: string;
    subject_type?: string | null;
    subject_id?: number | null;
    created_at?: string | null;
};

type Props = {
    logs: { data: LogRow[] };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Audit Log', href: '/admin/special-programs/system/audit-logs' },
];

export default function EventAudit({ logs }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Audit Log Special Program</h1>
                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                    <th className="px-4 py-3 text-left">Subjek</th>
                                    <th className="px-4 py-3 text-left">Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{log.action}</td>
                                        <td className="px-4 py-3">
                                            {log.subject_type ? `${log.subject_type} #${log.subject_id}` : '-'}
                                        </td>
                                        <td className="px-4 py-3">{log.created_at ?? '-'}</td>
                                    </tr>
                                ))}
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada log.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
