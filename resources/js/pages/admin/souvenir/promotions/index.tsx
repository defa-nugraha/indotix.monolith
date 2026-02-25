import { Head, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Promotion = {
    id: number;
    name: string;
    type: string;
    value?: number | null;
    is_active: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
    special_program_id?: number | null;
};

type Program = { id: number; name: string };

export default function SouvenirPromotionsIndex({ promotions, programs }: { promotions: Promotion[]; programs: Program[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Retail Shop', href: '/admin/souvenir/products' },
        { title: 'Promo Retail Shop', href: '/admin/souvenir/promotions' },
    ];

    const form = useForm({
        name: '',
        type: 'discount',
        value: 0,
        is_active: false,
        starts_at: '',
        ends_at: '',
        special_program_id: '',
    });

    const submit = () => {
        form.post('/admin/souvenir/promotions', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Promo dibuat.' });
            },
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menyimpan promo.' }),
        });
    };

    const updatePromo = (promotionId: number, payload: Record<string, unknown>) => {
        router.put(`/admin/souvenir/promotions/${promotionId}`, payload, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Promo diperbarui.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memperbarui promo.' }),
        });
    };

    const deletePromo = async (promotionId: number) => {
        const result = await Swal.fire({
            title: 'Hapus promo?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.delete(`/admin/souvenir/promotions/${promotionId}`, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Promo dihapus.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menghapus promo.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Promo Retail Shop" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Promo & Program Khusus</h1>
                    <p className="text-sm text-slate-500">Diskon, bundling, dan integrasi Special Program.</p>
                    <div className="mt-6 grid gap-3 md:grid-cols-4">
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Nama promo"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                        />
                        <select
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={form.data.type}
                            onChange={(event) => form.setData('type', event.target.value)}
                        >
                            <option value="discount">Diskon</option>
                            <option value="bundling">Bundling</option>
                            <option value="special_program">Special Program</option>
                        </select>
                        <input
                            type="number"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Nilai"
                            value={form.data.value}
                            onChange={(event) => form.setData('value', Number(event.target.value))}
                        />
                        <select
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={form.data.special_program_id}
                            onChange={(event) => form.setData('special_program_id', event.target.value)}
                        >
                            <option value="">Pilih Special Program</option>
                            {programs.map((program) => (
                                <option key={program.id} value={program.id}>
                                    {program.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={form.data.starts_at}
                            onChange={(event) => form.setData('starts_at', event.target.value)}
                        />
                        <input
                            type="date"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={form.data.ends_at}
                            onChange={(event) => form.setData('ends_at', event.target.value)}
                        />
                        <Button className="bg-sky-600 text-white hover:bg-sky-700" type="button" onClick={submit}>
                            Simpan Promo
                        </Button>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Promo</th>
                                    <th className="px-4 py-3 text-left">Tipe</th>
                                    <th className="px-4 py-3 text-left">Periode</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {promotions.map((promo) => (
                                    <tr key={promo.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{promo.name}</td>
                                        <td className="px-4 py-3">{promo.type}</td>
                                        <td className="px-4 py-3">{promo.starts_at ?? '-'} → {promo.ends_at ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={promo.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}>
                                                {promo.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => updatePromo(promo.id, { is_active: !promo.is_active })}>
                                                    {promo.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => deletePromo(promo.id)}>
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
