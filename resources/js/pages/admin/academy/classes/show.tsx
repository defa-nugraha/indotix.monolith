import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

type Ticket = { id: number; name: string; price: number; is_active: boolean };
type AcademyClass = {
    id: number;
    title: string;
    description?: string | null;
    category?: string | null;
    start_at: string;
    end_at: string;
    duration_minutes: number;
    location_type: string;
    location_detail?: string | null;
    capacity_total: number;
    capacity_sold: number;
    status: string;
    tickets?: Ticket[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Eljohn Academy', href: '/admin/academy/classes' },
    { title: 'Master Kelas', href: '/admin/academy/classes' },
    { title: 'Detail', href: '#' },
];

export default function AcademyClassShow({ class: academyClass }: { class: AcademyClass }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Kelas Academy" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">{academyClass.title}</h1>
                            <p className="text-sm text-slate-500">{academyClass.category ?? '-'}</p>
                            <p className="mt-2 text-sm text-slate-600">{academyClass.description ?? '-'}</p>
                        </div>
                        <Badge className="bg-slate-100 text-slate-700">{academyClass.status}</Badge>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Jadwal</p>
                            <p className="mt-2 text-sm text-slate-900">{academyClass.start_at}</p>
                            <p className="text-sm text-slate-900">{academyClass.end_at}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Durasi</p>
                            <p className="mt-2 text-sm text-slate-900">{academyClass.duration_minutes} menit</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Kapasitas</p>
                            <p className="mt-2 text-sm text-slate-900">
                                {academyClass.capacity_sold}/{academyClass.capacity_total}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Produk Tiket</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {academyClass.tickets?.map((ticket) => (
                            <div key={ticket.id} className="rounded-2xl border border-slate-100 p-4">
                                <div className="font-semibold text-slate-900">{ticket.name}</div>
                                <div className="text-xs text-slate-500">Rp {ticket.price.toLocaleString('id-ID')}</div>
                                <Badge className={ticket.is_active ? 'mt-2 bg-emerald-50 text-emerald-700' : 'mt-2 bg-rose-50 text-rose-700'}>
                                    {ticket.is_active ? 'Aktif' : 'Nonaktif'}
                                </Badge>
                            </div>
                        ))}
                        {(!academyClass.tickets || academyClass.tickets.length === 0) && (
                            <div className="text-sm text-slate-500">Belum ada tiket.</div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
