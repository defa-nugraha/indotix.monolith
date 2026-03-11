import { Head, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';

type Variant = { id: number; name: string; stock: number };

type Product = {
    id: number;
    name: string;
    stock: number;
    min_stock: number;
    variants: Variant[];
};

type StockLog = {
    id: number;
    type: string;
    quantity: number;
    note?: string | null;
    created_at?: string | null;
    product?: { id: number; name: string } | null;
    variant?: { id: number; name: string } | null;
};

type Props = {
    products: Product[];
    logs: { data: StockLog[]; links: Array<{ url: string | null; label: string; active: boolean }> };
};

export default function SouvenirInventoryIndex({ products, logs }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Retail Shop', href: '/admin/retail-shop/products' },
        { title: 'Inventory & Stok', href: '/admin/retail-shop/inventory' },
    ];

    const form = useForm({
        product_id: '',
        variant_id: '',
        type: 'in',
        quantity: 0,
        note: '',
    });

    const submit = () => {
        form.post('/admin/retail-shop/inventory', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Stok berhasil diperbarui.' });
            },
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memperbarui stok.' }),
        });
    };

    const selectedProduct = products.find((product) => String(product.id) === String(form.data.product_id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory Retail Shop" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Inventory & Stok</h1>
                    <p className="text-sm text-slate-500">Atur stok masuk, stok keluar, dan penyesuaian manual.</p>

                    <div className="mt-6 grid gap-3 md:grid-cols-5">
                        <select
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={form.data.product_id}
                            onChange={(event) => {
                                form.setData('product_id', event.target.value);
                                form.setData('variant_id', '');
                            }}
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
                            value={form.data.variant_id}
                            onChange={(event) => form.setData('variant_id', event.target.value)}
                            disabled={!selectedProduct || selectedProduct.variants.length === 0}
                        >
                            <option value="">Tanpa variasi</option>
                            {selectedProduct?.variants.map((variant) => (
                                <option key={variant.id} value={variant.id}>
                                    {variant.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={form.data.type}
                            onChange={(event) => form.setData('type', event.target.value)}
                        >
                            <option value="in">Stok Masuk</option>
                            <option value="out">Stok Keluar</option>
                            <option value="adjust">Penyesuaian</option>
                        </select>
                        <input
                            type="number"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Jumlah"
                            value={form.data.quantity}
                            onChange={(event) => form.setData('quantity', Number(event.target.value))}
                        />
                        <Button className="bg-sky-600 text-white hover:bg-sky-700" type="button" onClick={submit}>
                            Simpan
                        </Button>
                        <textarea
                            className="md:col-span-5 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Catatan"
                            value={form.data.note}
                            onChange={(event) => form.setData('note', event.target.value)}
                        />
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Stok Real-time</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {products.map((product) => (
                            <div key={product.id} className="rounded-2xl border border-slate-100 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="font-semibold text-slate-900">{product.name}</div>
                                    <div className={`text-sm ${product.stock <= product.min_stock ? 'text-rose-600' : 'text-slate-500'}`}>
                                        Stok: {product.stock}
                                    </div>
                                </div>
                                {product.variants.length > 0 && (
                                    <div className="mt-3 grid gap-2 text-xs text-slate-500">
                                        {product.variants.map((variant) => (
                                            <div key={variant.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                                <span>{variant.name}</span>
                                                <span>Stok: {variant.stock}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Log Perubahan Stok</h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Produk</th>
                                    <th className="px-4 py-3 text-left">Variasi</th>
                                    <th className="px-4 py-3 text-left">Tipe</th>
                                    <th className="px-4 py-3 text-left">Jumlah</th>
                                    <th className="px-4 py-3 text-left">Catatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{log.product?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{log.variant?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{log.type}</td>
                                        <td className="px-4 py-3">{log.quantity}</td>
                                        <td className="px-4 py-3">{log.note ?? '-'}</td>
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
