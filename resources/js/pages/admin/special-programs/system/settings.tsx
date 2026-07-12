import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';

type Setting = {
    booking_timeout_minutes: number;
    max_ticket_per_user: number;
    sales_cutoff_minutes: number;
    refund_policy?: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Konfigurasi Special Program', href: '/admin/special-programs/system/settings' },
];

export default function EventSettings({ setting }: { setting?: Setting | null }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Konfigurasi Sistem Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Konfigurasi Sistem Special Program</h1>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.post('/admin/special-programs/system/settings', Object.fromEntries(data.entries()), { preserveScroll: true });
                        }}
                    >
                        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                            <span>Booking timeout (menit)</span>
                            <input
                                name="booking_timeout_minutes"
                                defaultValue={setting?.booking_timeout_minutes ?? 15}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Booking timeout (menit)"
                            />
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                            <span>Limit pembelian tiket</span>
                            <input
                                name="max_ticket_per_user"
                                defaultValue={setting?.max_ticket_per_user ?? 4}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Limit pembelian tiket"
                            />
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                            <span>Cut-off penjualan (menit)</span>
                            <input
                                name="sales_cutoff_minutes"
                                defaultValue={setting?.sales_cutoff_minutes ?? 30}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Cut-off penjualan (menit)"
                            />
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
                            <span>Kebijakan refund</span>
                            <textarea
                                name="refund_policy"
                                defaultValue={setting?.refund_policy ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Kebijakan refund"
                                rows={4}
                            />
                        </label>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700 md:col-span-2">
                            Simpan
                        </Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
