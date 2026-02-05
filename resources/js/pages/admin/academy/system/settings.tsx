import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';

type Setting = {
    booking_timeout_minutes: number;
    cutoff_minutes: number;
    refund_policy?: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Eljohn Academy', href: '/admin/academy/classes' },
    { title: 'Konfigurasi', href: '/admin/academy/system/settings' },
];

export default function AcademySettings({ setting }: { setting?: Setting | null }) {
    const form = useForm({
        booking_timeout_minutes: setting?.booking_timeout_minutes ?? 15,
        cutoff_minutes: setting?.cutoff_minutes ?? 60,
        refund_policy: setting?.refund_policy ?? '',
    });

    const submit = () => {
        form.post('/admin/academy/system/settings', {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Pengaturan diperbarui.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Periksa data.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Konfigurasi Academy" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Konfigurasi Sistem</h1>
                    <form
                        className="mt-4 grid gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submit();
                        }}
                    >
                        <input
                            type="number"
                            min={1}
                            value={form.data.booking_timeout_minutes}
                            onChange={(event) => form.setData('booking_timeout_minutes', Number(event.target.value))}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Booking timeout (menit)"
                        />
                        <input
                            type="number"
                            min={0}
                            value={form.data.cutoff_minutes}
                            onChange={(event) => form.setData('cutoff_minutes', Number(event.target.value))}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Cut-off penjualan (menit)"
                        />
                        <textarea
                            value={form.data.refund_policy}
                            onChange={(event) => form.setData('refund_policy', event.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            rows={4}
                            placeholder="Kebijakan refund default"
                        />
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Simpan
                        </Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
