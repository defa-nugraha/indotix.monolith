import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';

type Commission = {
    id: number;
    type: string;
    value: number;
    event?: { title?: string | null };
};

type Props = {
    commissions: Commission[];
    events: Array<{ id: number; title: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Komisi Special Program', href: '/admin/special-programs/finance/commissions' },
];

export default function EventCommissions({ commissions, events }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Komisi Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Komisi & Revenue Special Program</h1>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.post('/admin/special-programs/finance/commissions', Object.fromEntries(data.entries()), { preserveScroll: true });
                        }}
                    >
                        <select name="event_id" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <option value="">Global</option>
                            {events.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </select>
                        <select name="type" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <option value="percentage">Persentase</option>
                            <option value="fixed">Fixed</option>
                        </select>
                        <input name="value" placeholder="Nilai" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Simpan
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Special Program</th>
                                    <th className="px-4 py-3 text-left">Tipe</th>
                                    <th className="px-4 py-3 text-left">Nilai</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commissions.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{item.event?.title ?? 'Global'}</td>
                                        <td className="px-4 py-3">{item.type}</td>
                                        <td className="px-4 py-3">{item.value}</td>
                                    </tr>
                                ))}
                                {commissions.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
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
