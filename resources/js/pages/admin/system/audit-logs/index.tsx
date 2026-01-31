import { Head, router } from '@inertiajs/react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sistem, Audit & Kontrol', href: '/admin/system/audit-logs' },
    { title: 'Audit Log', href: '/admin/system/audit-logs' },
];

type LogRow = {
    id: number;
    admin_name?: string | null;
    action?: string | null;
    method?: string | null;
    path?: string | null;
    ip_address?: string | null;
    created_at?: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    logs: {
        data: LogRow[];
        links: PaginationLink[];
    };
    filters: {
        admin_id?: string;
        date_from?: string;
        date_to?: string;
    };
    adminOptions: Array<{ id: number; label: string }>;
};

export default function AuditLogIndex({ logs, filters, adminOptions }: Props) {
    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/admin/system/audit-logs', Object.fromEntries(form.entries()), { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                            Audit Log
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Jejak aksi admin
                        </h1>
                        <p className="text-sm text-slate-500">
                            Siapa melakukan apa & kapan.
                        </p>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Admin
                            </label>
                            <select
                                name="admin_id"
                                defaultValue={filters.admin_id ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua admin</option>
                                {adminOptions.map((admin) => (
                                    <option key={admin.id} value={admin.id}>
                                        {admin.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Dari tanggal
                            </label>
                            <input type="date" name="date_from" defaultValue={filters.date_from ?? ''} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs" />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Sampai tanggal
                            </label>
                            <input type="date" name="date_to" defaultValue={filters.date_to ?? ''} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs" />
                        </div>
                        <div className="flex items-end gap-3">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                <Filter className="mr-2 size-4" />
                                Terapkan
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.get('/admin/system/audit-logs')}>
                                <RotateCcw className="mr-2 size-4" />
                                Reset
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">Admin</th>
                                    <th className="py-3 pr-4">Aksi</th>
                                    <th className="py-3 pr-4">Path</th>
                                    <th className="py-3 pr-4">IP</th>
                                    <th className="py-3 pr-4">Waktu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500">
                                            Belum ada log.
                                        </td>
                                    </tr>
                                )}
                                {logs.data.map((log) => (
                                    <tr key={log.id}>
                                        <td className="py-4 pr-4">
                                            <div className="font-semibold text-slate-900">{log.admin_name ?? '-'}</div>
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {log.action ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {log.path ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {log.ip_address ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {log.created_at ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {logs.links?.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                            {logs.links.map((link) => (
                                <Button
                                    key={link.label}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                </Button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
