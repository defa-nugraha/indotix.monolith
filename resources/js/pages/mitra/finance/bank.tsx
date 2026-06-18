import { Head, useForm } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type Props = {
    bank: {
        bank_name?: string | null;
        bank_account_number?: string | null;
        bank_account_name?: string | null;
    };
    payout_status?: string | null;
};

export default function MitraBankAccount({ bank, payout_status }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
        { title: 'Pengaturan Rekening', href: '/mitra/finance/bank' },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        bank_name: bank.bank_name ?? '',
        bank_account_number: bank.bank_account_number ?? '',
        bank_account_name: bank.bank_account_name ?? '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        patch('/mitra/finance/bank');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Rekening" />
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-sky-600">Pengaturan Rekening</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Rekening payout</h1>
                            <p className="text-sm text-slate-500">Pastikan data rekening Anda sesuai untuk proses payout.</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <CreditCard className="size-4 text-sky-500" />
                            Status payout: {payout_status ?? 'draft'}
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Nama Bank</label>
                            <input
                                value={data.bank_name}
                                onChange={(event) => setData('bank_name', event.target.value)}
                                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder="Contoh: BCA"
                            />
                            {errors.bank_name && <p className="text-xs text-rose-600">{errors.bank_name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Nomor Rekening</label>
                            <input
                                value={data.bank_account_number}
                                onChange={(event) => setData('bank_account_number', event.target.value)}
                                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder="Masukkan nomor rekening"
                            />
                            {errors.bank_account_number && <p className="text-xs text-rose-600">{errors.bank_account_number}</p>}
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">Nama Pemilik Rekening</label>
                            <input
                                value={data.bank_account_name}
                                onChange={(event) => setData('bank_account_name', event.target.value)}
                                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder="Nama sesuai buku tabungan"
                            />
                            {errors.bank_account_name && <p className="text-xs text-rose-600">{errors.bank_account_name}</p>}
                        </div>
                        <div className="flex justify-end md:col-span-2">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan perubahan'}
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
