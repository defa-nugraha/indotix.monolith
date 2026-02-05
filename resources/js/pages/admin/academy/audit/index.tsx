import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Log = {
    id: number;
    action: string;
    subject_type?: string | null;
    subject_id?: number | null;
    created_at?: string | null;
};

type Props = {
    logs: { data: Log[] };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Eljohn Academy', href: '/admin/academy/classes' },
    { title: 'Audit Log', href: '/admin/academy/system/audit' },
];

export default function AcademyAudit({ logs }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log Academy" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Audit Log</h1>
                    <div className="mt-4 grid gap-3">
                        {logs.data.map((log) => (
                            <div key={log.id} className="rounded-2xl border border-slate-100 p-4">
                                <div className="text-sm font-semibold text-slate-900">{log.action}</div>
                                <div className="text-xs text-slate-500">
                                    {log.subject_type ?? '-'} #{log.subject_id ?? '-'} • {log.created_at ?? ''}
                                </div>
                            </div>
                        ))}
                        {logs.data.length === 0 && (
                            <div className="text-sm text-slate-500">Belum ada log.</div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
