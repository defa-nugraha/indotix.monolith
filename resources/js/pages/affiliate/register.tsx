import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import PublicLayout from '@/layouts/public-layout';

type Destination = {
    id: number;
    destination_name: string;
    city_name?: string | null;
};

export default function AffiliateRegister({ destinations }: { destinations: Destination[] }) {
    const form = useForm({
        wisata_id: '',
        phone: '',
        type: 'individu',
        platform: '',
        bank_name: '',
        bank_account_number: '',
        bank_account_name: '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/affiliate/register', {
            onSuccess: () => {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pendaftaran afiliasi sudah dikirim.' });
            },
        });
    };

    return (
        <PublicLayout showCategories={false} showChips={false} showSearch={false}>
            <Head title="Daftar Afiliasi Wisata" />
            <main className="mx-auto w-full max-w-3xl px-4 py-10">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Daftar Afiliasi</p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Mulai program afiliasi wisata</h1>
                        <p className="mt-1 text-sm text-slate-500">Lengkapi data berikut agar admin bisa memverifikasi.</p>
                    </div>

                <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">Pilih Destinasi Wisata</span>
                        <select
                            value={form.data.wisata_id}
                            onChange={(event) => form.setData('wisata_id', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                        >
                            <option value="">Pilih destinasi</option>
                            {destinations.map((destination) => (
                                <option key={destination.id} value={destination.id}>
                                    {destination.destination_name}
                                    {destination.city_name ? ` - ${destination.city_name}` : ''}
                                </option>
                            ))}
                        </select>
                        {form.errors.wisata_id && <p className="text-xs text-rose-500">{form.errors.wisata_id}</p>}
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">Nomor HP</span>
                        <input
                            value={form.data.phone}
                            onChange={(event) => form.setData('phone', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                        />
                        {form.errors.phone && <p className="text-xs text-rose-500">{form.errors.phone}</p>}
                    </label>
                    <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">Tipe Afiliator</span>
                        <select
                            value={form.data.type}
                            onChange={(event) => form.setData('type', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                        >
                            <option value="individu">Individu</option>
                            <option value="komunitas">Komunitas</option>
                            <option value="media">Media</option>
                        </select>
                    </label>

                    <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">Platform Promosi</span>
                        <input
                            value={form.data.platform}
                            onChange={(event) => form.setData('platform', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                            placeholder="Instagram / TikTok / Blog"
                        />
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">Nama Bank</span>
                        <input
                            value={form.data.bank_name}
                            onChange={(event) => form.setData('bank_name', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">Nomor Rekening</span>
                        <input
                            value={form.data.bank_account_number}
                            onChange={(event) => form.setData('bank_account_number', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                        />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">Nama Pemilik Rekening</span>
                        <input
                            value={form.data.bank_account_name}
                            onChange={(event) => form.setData('bank_account_name', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                        />
                    </label>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="h-11 rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                            Kirim Pendaftaran
                        </button>
                    </div>
                </form>
                </div>
            </main>
        </PublicLayout>
    );
}
