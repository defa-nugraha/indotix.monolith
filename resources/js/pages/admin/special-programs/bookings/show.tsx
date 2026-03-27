import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type BookingDetail = {
    id: number;
    status: string;
    quantity: number;
    visit_date?: string | null;
    notes?: string | null;
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    program?: { name?: string | null };
    variant?: { name?: string | null };
    user?: { name?: string | null };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    {
        title: 'Booking Special Program',
        href: '/admin/special-programs/bookings',
    },
    { title: 'Detail', href: '#' },
];

export default function EventBookingShow({
    booking,
}: {
    booking: BookingDetail;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Booking Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                {booking.program?.name ?? '-'}
                            </h1>
                            <p className="text-sm text-slate-500">
                                Variant: {booking.variant?.name ?? '-'}
                            </p>
                        </div>
                        <Badge className="bg-slate-100 text-slate-600">
                            {booking.status}
                        </Badge>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Data Pemesan
                        </h2>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                            <div>
                                Nama:{' '}
                                {booking.guest_name ??
                                    booking.user?.name ??
                                    '-'}
                            </div>
                            <div>Email: {booking.guest_email ?? '-'}</div>
                            <div>Telepon: {booking.guest_phone ?? '-'}</div>
                        </div>
                    </div>
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Ringkasan Booking
                        </h2>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                            <div>Jumlah orang: {booking.quantity}</div>
                            <div>Tanggal: {booking.visit_date ?? '-'}</div>
                            <div>Catatan: {booking.notes ?? '-'}</div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Update Status
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {['pending', 'confirmed', 'cancelled'].map((status) => (
                            <Button
                                key={status}
                                type="button"
                                variant={
                                    status === 'confirmed'
                                        ? 'default'
                                        : 'outline'
                                }
                                className={
                                    status === 'confirmed'
                                        ? 'bg-sky-600 text-white hover:bg-sky-700'
                                        : ''
                                }
                                onClick={() =>
                                    router.post(
                                        `/admin/special-programs/bookings/${booking.id}/status`,
                                        { status },
                                    )
                                }
                            >
                                {status}
                            </Button>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
