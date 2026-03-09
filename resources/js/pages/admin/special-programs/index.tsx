import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type EventRow = {
    id: number;
    title: string;
    status: string;
    capacity_total: number;
    capacity_sold: number;
};

type Props = {
    programs: { data: EventRow[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    filters: { status?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Manajemen Special Program', href: '/admin/special-programs' },
];

export default function SpecialProgramsIndex({ programs, filters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Manajemen Special Program</h1>
                            <p className="text-sm text-slate-500">Approval, status program, dan kontrol kapasitas.</p>
                        </div>
                        <Link
                            href="/admin/special-programs/create"
                            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                        >
                            Buat Special Program
                        </Link>
                    </div>
                    <form
                        className="mt-6 flex flex-wrap gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get('/admin/special-programs', Object.fromEntries(data.entries()), { preserveState: true });
                        }}
                    >
                        <select name="status" defaultValue={filters.status ?? ''} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <option value="">Semua status</option>
                            <option value="draft">Draft</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="published">Published</option>
                            <option value="postponed">Postponed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
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
                                    <th className="px-4 py-3 text-left">Special Program</th>
                                    <th className="px-4 py-3 text-left">Kapasitas</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {programs.data.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{item.title}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.capacity_sold}/{item.capacity_total}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className="bg-slate-100 text-slate-600">{item.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/special-programs/${item.id}`} className="text-sky-600 hover:underline">
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {programs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada special program.
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
