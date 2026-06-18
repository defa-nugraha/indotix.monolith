import { Head, router } from '@inertiajs/react';
import { Eye, Filter, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sistem, Audit & Kontrol', href: '/admin/system/audit-logs' },
    { title: 'Log Aktivitas', href: '/admin/system/audit-logs' },
];

type LogRow = {
    source?: string | null;
    source_label?: string | null;
    id: number;
    actor_name?: string | null;
    actor_email?: string | null;
    actor_role?: string | null;
    action?: string | null;
    method?: string | null;
    path?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    payload?: unknown;
    created_at?: string | null;
};

type Props = {
    logs: {
        data: LogRow[];
        from?: number | null;
        to?: number | null;
        total?: number;
        per_page?: number;
        current_page?: number;
        last_page?: number;
    };
    filters: {
        search?: string;
        admin_id?: string;
        source?: string;
        role?: string;
        method?: string;
        path?: string;
        ip_address?: string;
        date_from?: string;
        date_to?: string;
        per_page?: string;
    };
    actorOptions: Array<{ id: number; label: string }>;
    roleOptions: string[];
    methodOptions: string[];
    summary: {
        total: number;
        today: number;
        unique_actors: number;
        user_logs: number;
        methods: Record<string, number>;
    };
};

const methodTone = (method?: string | null) => {
    if (method === 'POST') return 'border-emerald-100 bg-emerald-50 text-emerald-700';
    if (method === 'PUT' || method === 'PATCH') return 'border-amber-100 bg-amber-50 text-amber-700';
    if (method === 'DELETE') return 'border-rose-100 bg-rose-50 text-rose-700';
    return 'border-slate-100 bg-slate-50 text-slate-600';
};

const stringifyPayload = (payload: unknown) => {
    if (!payload) return '-';

    try {
        return JSON.stringify(payload, null, 2);
    } catch {
        return String(payload);
    }
};

export default function AuditLogIndex({
    logs,
    filters,
    actorOptions,
    roleOptions,
    methodOptions,
    summary,
}: Props) {
    const [selectedLog, setSelectedLog] = useState<LogRow | null>(null);

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const params = Object.fromEntries(
            Array.from(form.entries()).filter(([, value]) => String(value).trim() !== ''),
        );

        router.get('/admin/system/audit-logs', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Log Aktivitas" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-sky-600">
                                Audit Log
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Log aktivitas sistem
                            </h1>
                            <p className="text-sm text-slate-500">
                                Pantau perubahan penting dari admin, user, mitra, waktu, IP, dan payload yang dikirim.
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                            <ShieldCheck className="size-6" />
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <SummaryTile label="Total log" value={summary.total} />
                    <SummaryTile label="Log hari ini" value={summary.today} />
                    <SummaryTile label="Aktor tercatat" value={summary.unique_actors} />
                    <SummaryTile
                        label="Log user/mitra"
                        value={summary.user_logs}
                    />
                </section>

                <section className="overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 shadow-sm">
                    <form
                        onSubmit={applyFilters}
                        className="border-b border-slate-100 p-5"
                    >
                        <div className="grid gap-3 lg:grid-cols-[minmax(360px,2fr)_minmax(220px,0.9fr)_minmax(150px,0.55fr)_minmax(150px,0.55fr)_minmax(150px,0.55fr)]">
                            <div className="relative min-w-0">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Cari aktor, email, aksi, path, atau IP"
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>
                            <select
                                name="admin_id"
                                defaultValue={filters.admin_id ?? ''}
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            >
                                <option value="">Semua aktor</option>
                                {actorOptions.map((actor) => (
                                    <option key={actor.id} value={actor.id}>
                                        {actor.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="source"
                                defaultValue={filters.source ?? ''}
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            >
                                <option value="">Semua sumber</option>
                                <option value="admin">Admin</option>
                                <option value="user">User/Mitra</option>
                            </select>
                            <select
                                name="role"
                                defaultValue={filters.role ?? ''}
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            >
                                <option value="">Semua role</option>
                                {roleOptions.map((role) => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="method"
                                defaultValue={filters.method ?? ''}
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            >
                                <option value="">Semua method</option>
                                {methodOptions.map((method) => (
                                    <option key={method} value={method}>
                                        {method}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <input
                            type="hidden"
                            name="per_page"
                            value={String(filters.per_page ?? logs.per_page ?? 25)}
                        />
                        <div className="mt-3 grid gap-3 md:grid-cols-[0.8fr_0.8fr_0.7fr_0.7fr_auto]">
                            <input
                                name="path"
                                defaultValue={filters.path ?? ''}
                                placeholder="Path route"
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            />
                            <input
                                name="ip_address"
                                defaultValue={filters.ip_address ?? ''}
                                placeholder="IP address"
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            />
                            <input
                                type="date"
                                name="date_from"
                                defaultValue={filters.date_from ?? ''}
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            />
                            <input
                                type="date"
                                name="date_to"
                                defaultValue={filters.date_to ?? ''}
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            />
                            <div className="flex flex-wrap gap-2">
                                <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                    <Filter className="mr-2 size-4" />
                                    Terapkan
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.get('/admin/system/audit-logs')}
                                >
                                    <RotateCcw className="mr-2 size-4" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 text-left">Aktor</th>
                                    <th className="px-5 py-4 text-left">Sumber</th>
                                    <th className="px-5 py-4 text-left">Method</th>
                                    <th className="px-5 py-4 text-left">Aksi & Path</th>
                                    <th className="px-5 py-4 text-left">IP</th>
                                    <th className="px-5 py-4 text-left">Waktu</th>
                                    <th className="px-5 py-4 text-left">Detail</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                                            Belum ada log yang sesuai filter.
                                        </td>
                                    </tr>
                                )}
                                {logs.data.map((log) => (
                                    <tr key={`${log.source}-${log.id}`} className="border-t border-slate-100">
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-slate-900">
                                                {log.actor_name ?? '-'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {log.actor_email ?? '-'}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {log.actor_role ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {log.source_label ?? '-'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge className={methodTone(log.method)}>
                                                {log.method ?? '-'}
                                            </Badge>
                                        </td>
                                        <td className="max-w-md px-5 py-4">
                                            <div className="truncate font-medium text-slate-800">
                                                {log.action ?? '-'}
                                            </div>
                                            <div className="truncate text-xs text-slate-500">
                                                {log.path ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {log.ip_address ?? '-'}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {log.created_at ?? '-'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedLog(log)}
                                                className="border-sky-200 text-slate-700 hover:bg-sky-50"
                                            >
                                                <Eye className="mr-2 size-4" />
                                                Detail
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </section>

                <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                    <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Detail log aktivitas</DialogTitle>
                        </DialogHeader>
                        {selectedLog && (
                            <div className="grid gap-4 overflow-y-auto pr-1 text-sm">
                                <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2">
                                    <DetailItem label="Aktor" value={selectedLog.actor_name ?? '-'} />
                                    <DetailItem label="Email" value={selectedLog.actor_email ?? '-'} />
                                    <DetailItem label="Role" value={selectedLog.actor_role ?? '-'} />
                                    <DetailItem label="Sumber" value={selectedLog.source_label ?? '-'} />
                                    <DetailItem label="Method" value={selectedLog.method ?? '-'} />
                                    <DetailItem label="Waktu" value={selectedLog.created_at ?? '-'} />
                                    <DetailItem label="Path" value={selectedLog.path ?? '-'} />
                                    <DetailItem label="IP" value={selectedLog.ip_address ?? '-'} />
                                    <div className="md:col-span-2">
                                        <DetailItem label="User agent" value={selectedLog.user_agent ?? '-'} />
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                                        Payload
                                    </p>
                                    <pre className="max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
                                        {stringifyPayload(selectedLog.payload)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

function SummaryTile({
    label,
    value,
    danger = false,
}: {
    label: string;
    value: number;
    danger?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-sky-100/80 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
            <p className={danger ? 'mt-2 text-2xl font-semibold text-rose-600' : 'mt-2 text-2xl font-semibold text-slate-900'}>
                {value.toLocaleString('id-ID')}
            </p>
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
            <p className="mt-1 break-words text-slate-800">{value}</p>
        </div>
    );
}
