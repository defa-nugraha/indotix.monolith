import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payout Mitra', href: '/admin/finance/payouts' },
    { title: 'Generate', href: '/admin/finance/payouts/create' },
];

type Props = {
    hotelOptions: Array<{ id: number; label: string }>;
};

export default function PayoutCreate({ hotelOptions }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        hotel_id: '',
        period_start: '',
        period_end: '',
        notes: '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Generate Payout" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                                Generate payout
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                Buat payout baru
                            </h1>
                            <p className="text-sm text-slate-500">
                                Pilih periode dan hotel yang akan dipayout.
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/admin/finance/payouts">
                                <ArrowLeft className="mr-2 size-4" />
                                Kembali
                            </Link>
                        </Button>
                    </div>
                </section>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        post('/admin/finance/payouts', {
                            onSuccess: () => {
                                Swal.fire({ title: 'Berhasil', text: 'Payout dibuat.', icon: 'success' });
                            },
                            onError: () => {
                                Swal.fire({ title: 'Gagal', text: 'Payout gagal dibuat.', icon: 'error' });
                            },
                        });
                    }}
                    className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Hotel
                            </label>
                            <select
                                value={data.hotel_id}
                                onChange={(event) => setData('hotel_id', event.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                required
                            >
                                <option value="">Pilih hotel</option>
                                {hotelOptions.map((hotel) => (
                                    <option key={hotel.id} value={hotel.id}>
                                        {hotel.label}
                                    </option>
                                ))}
                            </select>
                            {errors.hotel_id && <p className="text-xs text-red-500">{errors.hotel_id}</p>}
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Mulai
                            </label>
                            <input
                                type="date"
                                value={data.period_start}
                                onChange={(event) => setData('period_start', event.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                required
                            />
                            {errors.period_start && <p className="text-xs text-red-500">{errors.period_start}</p>}
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Sampai
                            </label>
                            <input
                                type="date"
                                value={data.period_end}
                                onChange={(event) => setData('period_end', event.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                required
                            />
                            {errors.period_end && <p className="text-xs text-red-500">{errors.period_end}</p>}
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Catatan
                            </label>
                            <textarea
                                value={data.notes}
                                onChange={(event) => setData('notes', event.target.value)}
                                className="min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                                placeholder="Catatan internal payout"
                            />
                        </div>
                    </div>
                    <div className="mt-6">
                        <Button type="submit" disabled={processing} className="bg-sky-600 text-white hover:bg-sky-700">
                            Generate payout
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
