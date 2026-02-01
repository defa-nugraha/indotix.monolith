import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

type Option = { id: number; label: string };

type Rule = {
    id: number;
    type: string;
    value: number;
    start_date?: string | null;
    end_date?: string | null;
    destination?: string | null;
};

type Props = {
    destinations: Option[];
    rules: Rule[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Komisi Platform', href: '/admin/wisata/finance/commissions' },
];

export default function AdminWisataCommissions({ destinations, rules }: Props) {
    const form = useForm({
        mitra_wisata_onboarding_id: '',
        type: 'percentage',
        value: '',
        start_date: '',
        end_date: '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Komisi Platform Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Komisi Platform</h1>
                    <p className="text-sm text-slate-500">Set komisi global atau per destinasi.</p>
                    <form
                        className="mt-6 grid gap-4 md:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/admin/wisata/finance/commissions');
                        }}
                    >
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Destinasi (kosong = global)</Label>
                            <select
                                value={form.data.mitra_wisata_onboarding_id}
                                onChange={(event) => form.setData('mitra_wisata_onboarding_id', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Global</option>
                                {destinations.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.mitra_wisata_onboarding_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Tipe</Label>
                            <select
                                value={form.data.type}
                                onChange={(event) => form.setData('type', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="percentage">Persentase</option>
                                <option value="fixed">Fixed</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Nilai</Label>
                            <Input
                                value={form.data.value}
                                onChange={(event) => form.setData('value', event.target.value)}
                                placeholder="10"
                            />
                            <InputError message={form.errors.value} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Mulai berlaku</Label>
                            <Input
                                type="date"
                                value={form.data.start_date}
                                onChange={(event) => form.setData('start_date', event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Berakhir</Label>
                            <Input
                                type="date"
                                value={form.data.end_date}
                                onChange={(event) => form.setData('end_date', event.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Simpan Komisi
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Riwayat Komisi</h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Destinasi</th>
                                    <th className="px-4 py-3 text-left">Tipe</th>
                                    <th className="px-4 py-3 text-left">Nilai</th>
                                    <th className="px-4 py-3 text-left">Periode</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule) => (
                                    <tr key={rule.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{rule.destination ?? 'Global'}</td>
                                        <td className="px-4 py-3">{rule.type}</td>
                                        <td className="px-4 py-3">{rule.value}</td>
                                        <td className="px-4 py-3">
                                            {rule.start_date ?? '-'} → {rule.end_date ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                                {rules.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                                            Belum ada komisi.
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
