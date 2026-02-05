import { Head, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Product = { id: number; name: string };

type Variant = {
    id: number;
    variant_type: string;
    name: string;
    sku?: string | null;
    additional_price: number;
    stock: number;
    is_active: boolean;
    product?: Product | null;
};

type Props = {
    variants: { data: Variant[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    products: Product[];
    filters: { product_id?: number | null; search?: string };
};

export default function SouvenirVariantsIndex({ variants, products, filters }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Souvenir', href: '/admin/souvenir/products' },
        { title: 'Variasi Produk', href: '/admin/souvenir/variants' },
    ];

    const form = useForm({
        product_id: '',
        variant_type: 'size',
        name: '',
        sku: '',
        additional_price: 0,
        stock: 0,
        is_active: true,
    });

    const submitFilters = (formElement: HTMLFormElement) => {
        const data = new FormData(formElement);
        router.get('/admin/souvenir/variants', Object.fromEntries(data.entries()), { preserveState: true });
    };

    const submitCreate = () => {
        form.post('/admin/souvenir/variants', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Variasi ditambahkan.' });
            },
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Periksa data variasi.' }),
        });
    };

    const updateVariant = (variantId: number, payload: Record<string, unknown>) => {
        router.put(`/admin/souvenir/variants/${variantId}`, payload, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Variasi diperbarui.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memperbarui variasi.' }),
        });
    };

    const deleteVariant = async (variantId: number) => {
        const result = await Swal.fire({
            title: 'Hapus variasi?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.delete(`/admin/souvenir/variants/${variantId}`, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Variasi dihapus.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menghapus variasi.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Variasi Produk Souvenir" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Variasi Produk</h1>
                    <p className="text-sm text-slate-500">Kelola ukuran, warna, bahan, atau variasi lain.</p>

                    <div className="mt-6 grid gap-3 md:grid-cols-4">
                        <select
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={form.data.product_id}
                            onChange={(event) => form.setData('product_id', event.target.value)}
                        >
                            <option value="">Pilih produk</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={form.data.variant_type}
                            onChange={(event) => form.setData('variant_type', event.target.value)}
                        >
                            <option value="size">Ukuran</option>
                            <option value="color">Warna</option>
                            <option value="material">Bahan</option>
                            <option value="other">Lainnya</option>
                        </select>
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Nama variasi"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                        />
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="SKU variasi"
                            value={form.data.sku}
                            onChange={(event) => form.setData('sku', event.target.value)}
                        />
                        <input
                            type="number"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Harga tambahan"
                            value={form.data.additional_price}
                            onChange={(event) => form.setData('additional_price', Number(event.target.value))}
                        />
                        <input
                            type="number"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Stok"
                            value={form.data.stock}
                            onChange={(event) => form.setData('stock', Number(event.target.value))}
                        />
                        <Button className="bg-sky-600 text-white hover:bg-sky-700" type="button" onClick={submitCreate}>
                            Simpan Variasi
                        </Button>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form
                        className="mb-4 grid gap-3 md:grid-cols-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitFilters(event.currentTarget);
                        }}
                    >
                        <select
                            name="product_id"
                            defaultValue={filters.product_id ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">Semua produk</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                        <input
                            name="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Cari variasi"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <Button className="bg-sky-600 text-white hover:bg-sky-700" type="submit">
                            Filter
                        </Button>
                    </form>

                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Variasi</th>
                                    <th className="px-4 py-3 text-left">Produk</th>
                                    <th className="px-4 py-3 text-left">Harga tambahan</th>
                                    <th className="px-4 py-3 text-left">Stok</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variants.data.map((variant) => (
                                    <tr key={variant.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{variant.name}</div>
                                            <div className="text-xs text-slate-500">{variant.variant_type}</div>
                                        </td>
                                        <td className="px-4 py-3">{variant.product?.name ?? '-'}</td>
                                        <td className="px-4 py-3">Rp {variant.additional_price.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                defaultValue={variant.stock}
                                                className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                                                onBlur={(event) => updateVariant(variant.id, { stock: Number(event.target.value) })}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={variant.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}>
                                                {variant.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" variant="outline" onClick={() => updateVariant(variant.id, { is_active: !variant.is_active })}>
                                                    {variant.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => deleteVariant(variant.id)}>
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
