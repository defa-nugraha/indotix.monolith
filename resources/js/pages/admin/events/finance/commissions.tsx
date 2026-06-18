import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';

type Commission = {
    id: number;
    type: string;
    value: number;
    starts_at?: string | null;
    ends_at?: string | null;
    is_forever: boolean;
    event?: { title?: string | null };
    created_by_name?: string | null;
    updated_by_name?: string | null;
};

type Props = {
    commissions: Commission[];
    events: Array<{ id: number; title: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Komisi Event', href: '/admin/events/finance/commissions' },
];

export default function EventCommissions({ commissions, events }: Props) {
    const [isForever, setIsForever] = useState(true);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Komisi Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Komisi & Revenue Event
                    </h1>
                    <form
                        className="mt-6 grid gap-5 lg:grid-cols-12"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            if (
                                !isForever &&
                                (!data.get('starts_at') || !data.get('ends_at'))
                            ) {
                                Swal.fire({
                                    title: 'Tanggal berlaku wajib diisi',
                                    text: 'Isi tanggal mulai dan berakhir, atau centang berlaku selamanya.',
                                    icon: 'warning',
                                });
                                return;
                            }
                            if (
                                !isForever &&
                                String(data.get('ends_at')) <
                                    String(data.get('starts_at'))
                            ) {
                                Swal.fire({
                                    title: 'Tanggal tidak valid',
                                    text: 'Tanggal berakhir harus sama atau setelah tanggal mulai.',
                                    icon: 'warning',
                                });
                                return;
                            }
                            router.post(
                                '/admin/events/finance/commissions',
                                Object.fromEntries(data.entries()),
                                { preserveScroll: true },
                            );
                        }}
                    >
                        <select
                            name="event_id"
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm lg:col-span-4"
                        >
                            <option value="">Global</option>
                            {events.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </select>
                        <select
                            name="type"
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm lg:col-span-3"
                        >
                            <option value="percentage">Persentase</option>
                            <option value="fixed">Fixed</option>
                        </select>
                        <input
                            name="value"
                            placeholder="Nilai"
                            type="number"
                            min="0"
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm lg:col-span-3"
                        />
                        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 lg:col-span-2">
                            <input
                                type="checkbox"
                                name="is_forever"
                                value="1"
                                checked={isForever}
                                onChange={(event) =>
                                    setIsForever(event.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            Berlaku selamanya
                        </label>
                        <input
                            name="starts_at"
                            type="date"
                            disabled={isForever}
                            required={!isForever}
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-100 lg:col-span-3"
                        />
                        <input
                            name="ends_at"
                            type="date"
                            disabled={isForever}
                            required={!isForever}
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-100 lg:col-span-3"
                        />
                        <Button
                            type="submit"
                            className="bg-sky-600 text-white hover:bg-sky-700 lg:col-span-2"
                        >
                            Simpan
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Event
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Tipe
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Nilai
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Periode
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Dibuat oleh
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Diubah oleh
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {commissions.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3">
                                            {item.event?.title ?? 'Global'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.type}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.value}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.is_forever
                                                ? 'Berlaku selamanya'
                                                : `${item.starts_at ?? '-'} → ${item.ends_at ?? '-'}`}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.created_by_name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.updated_by_name ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                                {commissions.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-8 text-center text-sm text-slate-500"
                                        >
                                            Belum ada komisi.
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
