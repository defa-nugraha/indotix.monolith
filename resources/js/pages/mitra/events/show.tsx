import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';

type EventDetail = {
    id: number;
    title: string;
    status: string;
    status_reason?: string | null;
    capacity_total: number;
    capacity_sold: number;
    start_at?: string | null;
    end_at?: string | null;
    tickets?: Array<{ id: number; name: string; price: number; is_active: boolean }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Event', href: '/mitra/events' },
    { title: 'Detail', href: '#' },
];

export default function MitraEventShow({ event }: { event: EventDetail }) {
    const submitReview = async () => {
        const result = await Swal.fire({
            title: 'Kirim untuk Review?',
            text: 'Event akan dikirim ke admin untuk diverifikasi.',
            showCancelButton: true,
            confirmButtonText: 'Kirim',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.post(`/mitra/events/${event.id}/submit`, {}, {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Terkirim', text: 'Event dikirim untuk review.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat mengirim.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">{event.title}</h1>
                            <p className="text-sm text-slate-500">
                                {event.start_at ?? '-'} <span className="text-slate-400">→</span> {event.end_at ?? '-'}
                            </p>
                        </div>
                        <Badge className="bg-slate-100 text-slate-700">{event.status}</Badge>
                    </div>
                    {event.status_reason && (
                        <p className="mt-3 text-sm text-rose-600">Alasan: {event.status_reason}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Button asChild variant="outline">
                            <a href={`/mitra/events/${event.id}/edit`}>Edit Event</a>
                        </Button>
                        {['draft', 'rejected'].includes(event.status) && (
                            <Button className="bg-sky-600 text-white hover:bg-sky-700" onClick={submitReview}>
                                Kirim untuk Review
                            </Button>
                        )}
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Kapasitas</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Terjual: {event.capacity_sold} / {event.capacity_total}
                    </p>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Produk Tiket</h2>
                        <Button asChild variant="outline">
                            <a href="/mitra/events/tickets">Kelola Tiket</a>
                        </Button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {event.tickets?.map((ticket) => (
                            <div key={ticket.id} className="rounded-2xl border border-slate-100 p-4">
                                <div className="font-semibold text-slate-900">{ticket.name}</div>
                                <div className="text-xs text-slate-500">
                                    Rp {ticket.price.toLocaleString('id-ID')}
                                </div>
                                <Badge className={ticket.is_active ? 'mt-2 bg-emerald-50 text-emerald-700' : 'mt-2 bg-rose-50 text-rose-700'}>
                                    {ticket.is_active ? 'Aktif' : 'Nonaktif'}
                                </Badge>
                            </div>
                        ))}
                        {(!event.tickets || event.tickets.length === 0) && (
                            <div className="text-sm text-slate-500">Belum ada tiket.</div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
