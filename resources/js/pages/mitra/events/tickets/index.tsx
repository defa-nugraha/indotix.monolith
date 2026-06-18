import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Ticket = {
    id: number;
    name: string;
    price: number;
    quota: number | null;
    max_per_user: number;
    is_active: boolean;
    event?: { id?: number; title?: string | null };
};

type Props = {
    organizer: { id: number; name?: string | null };
    tickets: Ticket[];
    events: Array<{ id: number; title: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Produk Tiket', href: '/mitra/events/tickets' },
];

export default function MitraEventTicketsIndex({ tickets }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk Tiket Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-sky-600">Tiket</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Produk Tiket Event</h1>
                            <p className="text-sm text-slate-500">Kelola harga dan kuota tiket.</p>
                        </div>
                        <Button asChild className="bg-sky-600 text-white hover:bg-sky-700">
                            <Link href="/mitra/events/tickets/create">Tambah Tiket</Link>
                        </Button>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Nama</th>
                                    <th className="px-4 py-3 text-left">Event</th>
                                    <th className="px-4 py-3 text-left">Harga</th>
                                    <th className="px-4 py-3 text-left">Kuota</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket) => (
                                    <tr key={ticket.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-medium text-slate-900">{ticket.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{ticket.event?.title ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            Rp {ticket.price.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{ticket.quota ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={ticket.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}>
                                                {ticket.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/mitra/events/tickets/create?edit=${ticket.id}`}>Edit</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {tickets.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada tiket.
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
