import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/form-field';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Exception & Refund', href: '/admin/special-programs/exceptions' },
];

export default function EventExceptionsIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exception Handling Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Postpone / Cancel Special Program</h1>
                    <p className="text-sm text-slate-500">Set status program dan alasan krisis.</p>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            const eventId = data.get('event_id');
                            router.post(`/admin/special-programs/${eventId}/exception`, Object.fromEntries(data.entries()), { preserveScroll: true });
                        }}
                    >
                        <FormField label="ID Program">
                            <input name="event_id" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </FormField>
                        <FormField label="Status">
                            <select name="status" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <option value="postponed">Postponed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </FormField>
                        <FormField label="Alasan" className="md:col-span-2">
                            <input name="reason" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </FormField>
                        <Button type="submit" className="bg-rose-600 text-white hover:bg-rose-700">
                            Simpan
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Refund Booking</h2>
                    <p className="text-sm text-slate-500">Refund per booking dengan alasan.</p>
                    <form
                        className="mt-4 grid gap-3 md:grid-cols-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            const bookingId = data.get('booking_id');
                            router.post(`/admin/special-programs/bookings/${bookingId}/refund`, Object.fromEntries(data.entries()), { preserveScroll: true });
                        }}
                    >
                        <FormField label="ID Booking">
                            <input name="booking_id" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </FormField>
                        <FormField label="Jumlah refund">
                            <input name="amount" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </FormField>
                        <FormField label="Alasan refund" className="md:col-span-2">
                            <input name="reason" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </FormField>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Proses Refund
                        </Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
