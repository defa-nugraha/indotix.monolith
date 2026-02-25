import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';

type Settings = {
    souvenir_tax_rate: number;
    souvenir_packing_fee: number;
    souvenir_default_shipping_fee: number;
};

export default function SouvenirSettingsIndex({ settings }: { settings: Settings }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Retail Shop', href: '/admin/souvenir/products' },
        { title: 'Konfigurasi Retail Shop', href: '/admin/souvenir/settings' },
    ];

    const [form, setForm] = useState({
        souvenir_tax_rate: settings.souvenir_tax_rate ?? 0,
        souvenir_packing_fee: settings.souvenir_packing_fee ?? 0,
        souvenir_default_shipping_fee: settings.souvenir_default_shipping_fee ?? 0,
    });

    const submit = () => {
        router.post('/admin/souvenir/settings', form, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Konfigurasi disimpan.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menyimpan konfigurasi.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Konfigurasi Retail Shop" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Konfigurasi Retail Shop</h1>
                    <p className="text-sm text-slate-500">Atur pajak, biaya packing, dan biaya pengiriman default.</p>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-600">Pajak (%)</label>
                            <input
                                type="number"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.souvenir_tax_rate}
                                onChange={(event) => setForm({ ...form, souvenir_tax_rate: Number(event.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600">Biaya Packing</label>
                            <input
                                type="number"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.souvenir_packing_fee}
                                onChange={(event) => setForm({ ...form, souvenir_packing_fee: Number(event.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600">Biaya Pengiriman Default</label>
                            <input
                                type="number"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.souvenir_default_shipping_fee}
                                onChange={(event) => setForm({ ...form, souvenir_default_shipping_fee: Number(event.target.value) })}
                            />
                        </div>
                    </div>
                    <Button className="mt-6 bg-sky-600 text-white hover:bg-sky-700" type="button" onClick={submit}>
                        Simpan Konfigurasi
                    </Button>
                </section>
            </div>
        </AppLayout>
    );
}
