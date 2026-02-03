import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Organizer = {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    status: string;
    verification_status?: string | null;
};

type Props = {
    organizers: { data: Organizer[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    filters: { status?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Mitra Event (EO)', href: '/admin/events/organizers' },
];

export default function EventOrganizersIndex({ organizers, filters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mitra Event (EO)" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Mitra Event (EO)</h1>
                    <p className="text-sm text-slate-500">Review dan approval mitra event.</p>
                    <form
                        className="mt-6 flex flex-wrap gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get('/admin/events/organizers', Object.fromEntries(data.entries()), { preserveState: true });
                        }}
                    >
                        <select name="status" defaultValue={filters.status ?? ''} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <option value="">Semua status</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Filter
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">EO</th>
                                    <th className="px-4 py-3 text-left">Kontak</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {organizers.data.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{item.name}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-slate-600">{item.email ?? '-'}</div>
                                            <div className="text-xs text-slate-400">{item.phone ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={item.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : item.status === 'suspended' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}>
                                                {item.status}
                                            </Badge>
                                            {item.verification_status && (
                                                <div className="mt-1 text-xs text-slate-400">
                                                    Verifikasi: {item.verification_status}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/events/organizers/${item.id}`} className="text-sky-600 hover:underline">
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {organizers.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada data EO.
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
