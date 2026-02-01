import { Head, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sistem, Audit & Kontrol', href: '/admin/system/settings' },
    { title: 'Konfigurasi Sistem', href: '/admin/system/settings' },
];

type Props = {
    settings: {
        booking_timeout_minutes: number;
        tax_rate: number;
        service_fee: number;
        wisata_booking_timeout_minutes: number;
        wisata_max_quota_per_ticket: number;
        wisata_refund_policy: string;
    };
};

export default function SystemSettings({ settings }: Props) {
    const { data, setData, post, processing } = useForm({
        booking_timeout_minutes: settings.booking_timeout_minutes,
        tax_rate: settings.tax_rate,
        service_fee: settings.service_fee,
        wisata_booking_timeout_minutes: settings.wisata_booking_timeout_minutes,
        wisata_max_quota_per_ticket: settings.wisata_max_quota_per_ticket,
        wisata_refund_policy: settings.wisata_refund_policy,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Konfigurasi Sistem" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                            Konfigurasi Sistem
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Atur parameter utama
                        </h1>
                        <p className="text-sm text-slate-500">
                            Fleksibel tanpa deploy ulang.
                        </p>
                    </div>
                </section>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        post('/admin/system/settings', {
                            onSuccess: () => Swal.fire({ title: 'Berhasil', text: 'Pengaturan disimpan.', icon: 'success' }),
                            onError: () => Swal.fire({ title: 'Gagal', text: 'Pengaturan gagal disimpan.', icon: 'error' }),
                        });
                    }}
                    className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                >
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Booking timeout (menit)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={data.booking_timeout_minutes}
                                onChange={(event) => setData('booking_timeout_minutes', Number(event.target.value))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Pajak (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={data.tax_rate}
                                onChange={(event) => setData('tax_rate', Number(event.target.value))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Biaya layanan (Rp)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.service_fee}
                                onChange={(event) => setData('service_fee', Number(event.target.value))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Booking timeout wisata (menit)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={data.wisata_booking_timeout_minutes}
                                onChange={(event) => setData('wisata_booking_timeout_minutes', Number(event.target.value))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Maks kuota per tiket wisata
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={data.wisata_max_quota_per_ticket}
                                onChange={(event) => setData('wisata_max_quota_per_ticket', Number(event.target.value))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Kebijakan refund wisata
                            </label>
                            <input
                                type="text"
                                value={data.wisata_refund_policy}
                                onChange={(event) => setData('wisata_refund_policy', event.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                    </div>
                    <div className="mt-6">
                        <Button type="submit" disabled={processing} className="bg-sky-600 text-white hover:bg-sky-700">
                            Simpan perubahan
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
