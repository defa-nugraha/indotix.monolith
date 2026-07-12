import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SouvenirAdminMenu from '@/components/souvenir-admin-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrencyInput, parseCurrencyToInteger } from '@/lib/currency';

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
    variants: {
        data: Variant[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    products: Product[];
    filters: { product_id?: number | null; search?: string };
};

export default function SouvenirVariantsIndex({
    variants,
    products,
    filters,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Retail Shop', href: '/admin/retail-shop/products' },
        { title: 'Variasi Produk', href: '/admin/retail-shop/variants' },
    ];

    const form = useForm({
        product_id: '',
        variant_type: 'size',
        name: '',
        sku: '',
        additional_price: '',
        stock: '',
        is_active: true,
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<Record<string, any>>({});

    const submitFilters = (formElement: HTMLFormElement) => {
        const data = new FormData(formElement);
        router.get(
            '/admin/retail-shop/variants',
            Object.fromEntries(data.entries()),
            { preserveState: true },
        );
    };

    const submitCreate = () => {
        const payload = {
            ...form.data,
            additional_price:
                form.data.additional_price === ''
                    ? null
                    : form.data.additional_price,
            stock: form.data.stock === '' ? null : Number(form.data.stock),
        };
        router.post('/admin/retail-shop/variants', payload, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setIsCreateOpen(false);
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Variasi ditambahkan.',
                });
            },
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Periksa data variasi.',
                }),
        });
    };

    const updateVariant = (
        variantId: number,
        payload: Record<string, string | number | boolean | null>,
    ) => {
        router.put(`/admin/retail-shop/variants/${variantId}`, payload, {
            preserveScroll: true,
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Variasi diperbarui.',
                }),
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat memperbarui variasi.',
                }),
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
        router.delete(`/admin/retail-shop/variants/${variantId}`, {
            preserveScroll: true,
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Terhapus',
                    text: 'Variasi dihapus.',
                }),
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat menghapus variasi.',
                }),
        });
    };

    const handleEdit = (variant: Variant) => {
        setEditingId(variant.id);
        setEditData({
            variant_type: variant.variant_type,
            name: variant.name,
            sku: variant.sku ?? '',
            additional_price: variant.additional_price ?? 0,
            stock: variant.stock ? String(variant.stock) : '',
            is_active: variant.is_active,
        });
        setIsEditOpen(true);
    };

    const submitEdit = () => {
        if (!editingId) return;
        const payload = {
            ...editData,
            additional_price:
                editData.additional_price === ''
                    ? null
                    : editData.additional_price,
            stock: editData.stock === '' ? null : Number(editData.stock),
        };
        updateVariant(editingId, payload);
        setIsEditOpen(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Variasi Produk Retail Shop" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Variasi Produk
                    </h1>
                    <p className="text-sm text-slate-500">
                        Kelola ukuran, warna, bahan, atau variasi lain.
                    </p>
                    <SouvenirAdminMenu className="mt-4" />

                    <div className="mt-6 flex justify-end">
                        <Button
                            className="bg-sky-600 text-white hover:bg-sky-700"
                            type="button"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            Tambah Variasi
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
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Produk</span>
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
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Pencarian variasi</span>
                            <input
                                name="search"
                                defaultValue={filters.search ?? ''}
                                placeholder="Cari variasi"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <Button
                            className="bg-sky-600 text-white hover:bg-sky-700"
                            type="submit"
                        >
                            Filter
                        </Button>
                    </form>

                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Variasi
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Produk
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Harga tambahan
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Stok
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {variants.data.map((variant) => (
                                    <tr
                                        key={variant.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">
                                                {variant.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {variant.variant_type}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {variant.product?.name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            Rp{' '}
                                            {variant.additional_price.toLocaleString(
                                                'id-ID',
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                <span>Stok</span>
                                                <input
                                                    type="number"
                                                    defaultValue={variant.stock}
                                                    className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                                                    onBlur={(event) =>
                                                        updateVariant(variant.id, {
                                                            stock: Number(
                                                                event.target.value,
                                                            ),
                                                        })
                                                    }
                                                />
                                            </label>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={
                                                    variant.is_active
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-50 text-slate-600'
                                                }
                                            >
                                                {variant.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleEdit(variant)
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        updateVariant(
                                                            variant.id,
                                                            {
                                                                is_active:
                                                                    !variant.is_active,
                                                            },
                                                        )
                                                    }
                                                >
                                                    {variant.is_active
                                                        ? 'Nonaktifkan'
                                                        : 'Aktifkan'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        deleteVariant(
                                                            variant.id,
                                                        )
                                                    }
                                                >
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

                <Dialog
                    open={isEditOpen}
                    onOpenChange={(open) => {
                        setIsEditOpen(open);
                        if (!open) setEditingId(null);
                    }}
                >
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit Variasi Produk</DialogTitle>
                            <DialogDescription>
                                Perbarui detail variasi retail shop.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    Tipe Variasi
                                </label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={editData.variant_type ?? 'size'}
                                    onChange={(event) =>
                                        setEditData({
                                            ...editData,
                                            variant_type: event.target.value,
                                        })
                                    }
                                >
                                    <option value="size">Ukuran</option>
                                    <option value="color">Warna</option>
                                    <option value="material">Bahan</option>
                                    <option value="other">Lainnya</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    Nama Variasi
                                </label>
                                <input
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Nama variasi"
                                    value={editData.name ?? ''}
                                    onChange={(event) =>
                                        setEditData({
                                            ...editData,
                                            name: event.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    SKU Variasi
                                </label>
                                <input
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="SKU variasi"
                                    value={editData.sku ?? ''}
                                    onChange={(event) =>
                                        setEditData({
                                            ...editData,
                                            sku: event.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    Harga Tambahan (Rp)
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Harga tambahan"
                                    value={formatCurrencyInput(
                                        editData.additional_price ?? '',
                                    )}
                                    onChange={(event) =>
                                        setEditData({
                                            ...editData,
                                            additional_price:
                                                parseCurrencyToInteger(
                                                    event.target.value,
                                                ),
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    Stok
                                </label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Stok"
                                    value={editData.stock ?? ''}
                                    onChange={(event) =>
                                        setEditData({
                                            ...editData,
                                            stock: event.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    Status
                                </label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={
                                        editData.is_active
                                            ? 'active'
                                            : 'inactive'
                                    }
                                    onChange={(event) =>
                                        setEditData({
                                            ...editData,
                                            is_active:
                                                event.target.value === 'active',
                                        })
                                    }
                                >
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Nonaktif</option>
                                </select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setIsEditOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                className="bg-sky-600 text-white hover:bg-sky-700"
                                type="button"
                                onClick={submitEdit}
                            >
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Tambah Variasi Produk</DialogTitle>
                            <DialogDescription>
                                Isi data variasi untuk produk retail shop.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    Produk
                                </label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={form.data.product_id}
                                    onChange={(event) =>
                                        form.setData(
                                            'product_id',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">Pilih produk</option>
                                    {products.map((product) => (
                                        <option
                                            key={product.id}
                                            value={product.id}
                                        >
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    Tipe Variasi
                                </label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={form.data.variant_type}
                                    onChange={(event) =>
                                        form.setData(
                                            'variant_type',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="size">Ukuran</option>
                                    <option value="color">Warna</option>
                                    <option value="material">Bahan</option>
                                    <option value="other">Lainnya</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    Nama Variasi
                                </label>
                                <input
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Nama variasi"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    SKU Variasi
                                </label>
                                <input
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="SKU variasi"
                                    value={form.data.sku}
                                    onChange={(event) =>
                                        form.setData('sku', event.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    Harga Tambahan (Rp)
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Harga tambahan"
                                    value={formatCurrencyInput(
                                        form.data.additional_price,
                                    )}
                                    onChange={(event) =>
                                        form.setData(
                                            'additional_price',
                                            parseCurrencyToInteger(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    Stok
                                </label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Stok"
                                    value={form.data.stock}
                                    onChange={(event) =>
                                        form.setData(
                                            'stock',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    Status
                                </label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={
                                        form.data.is_active
                                            ? 'active'
                                            : 'inactive'
                                    }
                                    onChange={(event) =>
                                        form.setData(
                                            'is_active',
                                            event.target.value === 'active',
                                        )
                                    }
                                >
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Nonaktif</option>
                                </select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                className="bg-sky-600 text-white hover:bg-sky-700"
                                type="button"
                                onClick={submitCreate}
                            >
                                Simpan Variasi
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
