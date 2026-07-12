import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/form-field';

type Settlement = {
    id: number;
    period_start: string;
    period_end: string;
    total_sales: number;
    net_payout: number;
    status: string;
    organizer?: { name?: string | null };
};

type Props = {
    settlements: { data: Settlement[] };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Settlement Special Program', href: '/admin/special-programs/finance/settlements' },
];

export default function EventSettlements({ settlements }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settlement Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Settlement Special Program</h1>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.post('/admin/special-programs/finance/settlements', Object.fromEntries(data.entries()), { preserveScroll: true });
                        }}
                    >
                        <FormField label="ID Organizer">
                            <input name="event_organizer_id" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </FormField>
                        <FormField label="Periode mulai">
                            <input type="date" name="period_start" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </FormField>
                        <FormField label="Periode selesai">
                            <input type="date" name="period_end" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </FormField>
                        <FormField label="Total penjualan">
                            <input name="total_sales" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </FormField>
                        <FormField label="Komisi">
                            <input name="commission_amount" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </FormField>
                        <FormField label="Net payout">
                            <input name="net_payout" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </FormField>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700 md:col-span-4">
                            Generate Settlement
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Organizer</th>
                                    <th className="px-4 py-3 text-left">Periode</th>
                                    <th className="px-4 py-3 text-left">Total Sales</th>
                                    <th className="px-4 py-3 text-left">Net Payout</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {settlements.data.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{item.organizer?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{item.period_start} - {item.period_end}</td>
                                        <td className="px-4 py-3">{item.total_sales}</td>
                                        <td className="px-4 py-3">{item.net_payout}</td>
                                        <td className="px-4 py-3">{item.status}</td>
                                    </tr>
                                ))}
                                {settlements.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada settlement.
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
