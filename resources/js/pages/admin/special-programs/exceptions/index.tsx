import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';

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
                        <input name="event_id" placeholder="ID Program" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        <select name="status" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <option value="postponed">Postponed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <input name="reason" placeholder="Alasan" className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
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
                        <input name="booking_id" placeholder="ID Booking" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        <input name="amount" placeholder="Jumlah refund" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        <input name="reason" placeholder="Alasan refund" className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Proses Refund
                        </Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
