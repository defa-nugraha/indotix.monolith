import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/promo-items' },
    { title: 'Promo Spesial', href: '/admin/public/promo-items' },
    { title: 'Tambah', href: '/admin/public/promo-items/create' },
];

type HomepageSlot = {
    value: number;
    label: string;
    used: boolean;
    used_by?: string | null;
};

type VoucherOption = {
    id: number;
    code: string;
    remaining_quota?: number | null;
    is_active: boolean;
};

export default function PromoItemCreate({
    nextSortOrder = 1,
    orderFull = false,
    homepageSlots = [],
    categoryOptions = {},
    voucherOptions = [],
}: {
    nextSortOrder?: number;
    orderFull?: boolean;
    homepageSlots?: HomepageSlot[];
    categoryOptions?: Record<string, string>;
    voucherOptions?: VoucherOption[];
}) {
    const slots = homepageSlots.length > 0
        ? homepageSlots
        : [1, 2, 3].map((value) => ({
              value,
              label: `Slot ${value}`,
              used: false,
              used_by: null,
          }));
    const form = useForm({
        title: '',
        slug: '',
        category: Object.keys(categoryOptions)[0] ?? 'wisata',
        excerpt: '',
        description: '',
        terms: '',
        link_url: '',
        voucher_id: '',
        sort_order: nextSortOrder,
        starts_at: '',
        ends_at: '',
        is_active: true,
        image: null as File | null,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Promo Spesial">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-sans text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Tambah Promo Spesial</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Buat promo yang tampil di halaman promo. Gunakan slot homepage 1-3 hanya untuk section Promo Spesial di beranda.
                    </p>
                    {orderFull && (
                        <p className="mt-1 text-sm text-amber-600">
                            Semua slot homepage sudah terpakai. Promo baru tetap bisa aktif dengan slot 0 dan tampil di halaman daftar promo.
                        </p>
                    )}
                    <form
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/admin/public/promo-items', {
                                forceFormData: true,
                                onSuccess: () =>
                                    Swal.fire({ title: 'Berhasil', text: 'Promo ditambahkan.', icon: 'success' }),
                                onError: () =>
                                    Swal.fire({ title: 'Gagal', text: 'Promo gagal ditambahkan.', icon: 'error' }),
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label required>Judul promo</Label>
                            <Input required value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} />
                            <InputError message={form.errors.title} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Slug URL (opsional)</Label>
                            <Input
                                value={form.data.slug}
                                onChange={(event) => form.setData('slug', event.target.value)}
                                placeholder="otomatis dari judul jika dikosongkan"
                            />
                            <InputError message={form.errors.slug} />
                        </div>
                        <div className="grid gap-2">
                            <Label required>Kategori promo</Label>
                            <select
                                required
                                value={form.data.category}
                                onChange={(event) => form.setData('category', event.target.value)}
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                            >
                                {Object.entries(categoryOptions).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.category} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Ringkasan promo</Label>
                            <Input
                                value={form.data.excerpt}
                                onChange={(event) => form.setData('excerpt', event.target.value)}
                                placeholder="Contoh: Diskon tiket wisata untuk pengguna baru"
                            />
                            <InputError message={form.errors.excerpt} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Deskripsi promo</Label>
                            <textarea
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                                rows={5}
                                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                            />
                            <InputError message={form.errors.description} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Syarat dan ketentuan</Label>
                            <textarea
                                value={form.data.terms}
                                onChange={(event) => form.setData('terms', event.target.value)}
                                rows={4}
                                placeholder="Pisahkan setiap poin dengan baris baru"
                                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                            />
                            <InputError message={form.errors.terms} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Link CTA detail promo</Label>
                            <Input value={form.data.link_url} onChange={(event) => form.setData('link_url', event.target.value)} />
                            <p className="text-xs text-slate-500">Opsional. Jika kosong, tombol detail promo akan mengarah ke halaman wisata.</p>
                            <InputError message={form.errors.link_url} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Voucher promo terhubung</Label>
                            <select
                                value={form.data.voucher_id}
                                onChange={(event) => form.setData('voucher_id', event.target.value)}
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                            >
                                <option value="">Tidak memakai voucher</option>
                                {voucherOptions.map((voucher) => (
                                    <option key={voucher.id} value={voucher.id}>
                                        {voucher.code}
                                        {voucher.remaining_quota === null
                                            ? ' · kuota tidak dibatasi'
                                            : ` · ${voucher.remaining_quota} tersisa`}
                                        {!voucher.is_active ? ' · nonaktif' : ''}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500">
                                Jika dipilih, kartu promo homepage menampilkan badge kuota dan klik promo akan menyimpan kode voucher untuk checkout.
                            </p>
                            <InputError message={form.errors.voucher_id} />
                        </div>
                        <div className="grid gap-2 md:grid-cols-3">
                            <div className="grid gap-2">
                                <Label>Slot homepage</Label>
                                <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                                    {slots.map((slot) => (
                                        <label
                                            key={slot.value}
                                            className={`flex items-start gap-2 rounded-lg border bg-white p-3 text-sm ${
                                                slot.used ? 'border-slate-200 text-slate-400' : 'border-sky-100 text-slate-700'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                checked={form.data.sort_order === slot.value}
                                                disabled={slot.used}
                                                onChange={(event) =>
                                                    form.setData('sort_order', event.target.checked ? slot.value : 0)
                                                }
                                            />
                                            <span className="grid gap-0.5">
                                                <span className="font-semibold">{slot.label}</span>
                                                {slot.used && (
                                                    <span className="text-xs text-amber-600">
                                                        Terisi oleh {slot.used_by ?? 'promo lain'}
                                                    </span>
                                                )}
                                            </span>
                                        </label>
                                    ))}
                                    <button
                                        type="button"
                                        className="w-fit text-xs font-semibold text-sky-700 hover:text-sky-800"
                                        onClick={() => form.setData('sort_order', 0)}
                                    >
                                        Tidak tampilkan di homepage
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Pilih satu slot homepage. Jika semua slot terisi, matikan salah satu promo yang aktif terlebih dahulu.
                                </p>
                                {orderFull && (
                                    <p className="text-xs font-semibold text-amber-600">
                                        Semua slot homepage sudah terisi. Promo baru tetap bisa disimpan tanpa tampil di homepage.
                                    </p>
                                )}
                                <InputError message={form.errors.sort_order} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tanggal mulai</Label>
                                <Input
                                    type="date"
                                    value={form.data.starts_at}
                                    onChange={(event) => form.setData('starts_at', event.target.value)}
                                />
                                <InputError message={form.errors.starts_at} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tanggal berakhir</Label>
                                <Input
                                    type="date"
                                    value={form.data.ends_at}
                                    onChange={(event) => form.setData('ends_at', event.target.value)}
                                />
                                <InputError message={form.errors.ends_at} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label required>Gambar promo</Label>
                            <Input required type="file" accept="image/*" onChange={(event) => form.setData('image', event.target.files?.[0] ?? null)} />
                            <p className="text-xs text-slate-500">
                                Ukuran rekomendasi: slot homepage 1-2 → 600 × 800 px (rasio 3:4), slot 0 atau 3 → 1200 × 400 px (rasio 3:1).
                            </p>
                            <InputError message={form.errors.image} />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} />
                            Aktif
                        </label>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700" disabled={form.processing}>
                            Simpan
                        </Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
