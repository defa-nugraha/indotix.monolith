import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrencyInput, parseCurrencyToInteger } from '@/lib/currency';

type Category = { id: number; name: string };

type Product = {
    id: number;
    name: string;
    description?: string | null;
    sku: string;
    price: number;
    cost_price?: number | null;
    weight: number;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    status: string;
    is_active: boolean;
    min_stock: number;
    stock: number;
    category?: Category | null;
    images?: Array<{ id: number; url: string }>;
};

type Props = {
    products: { data: Product[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    categories: Category[];
    filters: { search?: string; status?: string; category_id?: number | null };
};

export default function SouvenirProductsIndex({ products, categories, filters }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Retail Shop', href: '/admin/souvenir/products' },
        { title: 'Master Produk', href: '/admin/souvenir/products' },
    ];

    const form = useForm({
        name: '',
        category_id: '',
        description: '',
        price: '',
        cost_price: '',
        sku: '',
        weight: '',
        length: '',
        width: '',
        height: '',
        status: 'active',
        min_stock: '',
        stock: '',
        images: [] as File[],
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<Record<string, any>>({});
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [createPreviews, setCreatePreviews] = useState<string[]>([]);
    const [editPreviews, setEditPreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<Array<{ id: number; url: string }>>([]);

    const maxImages = 10;
    const canAddCreateImages = maxImages - form.data.images.length;
    const canAddEditImages = maxImages - (existingImages.length + editPreviews.length);
    const generateSku = () => {
        const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
        const random = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `SOUV-${timestamp}-${random}`;
    };

    const openCreateModal = () => {
        form.reset();
        form.setData('sku', generateSku());
        form.setData('status', 'active');
        setCreatePreviews([]);
        setIsCreateOpen(true);
    };

    useEffect(() => {
        if (form.data.images.length === 0) {
            setCreatePreviews([]);
            return;
        }
        const urls = form.data.images.map((file) => URL.createObjectURL(file));
        setCreatePreviews(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [form.data.images]);

    useEffect(() => {
        if (!editData.images || editData.images.length === 0) {
            setEditPreviews([]);
            return;
        }
        const urls = editData.images.map((file: File) => URL.createObjectURL(file));
        setEditPreviews(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [editData.images]);

    const submitFilters = (formElement: HTMLFormElement) => {
        const data = new FormData(formElement);
        router.get('/admin/souvenir/products', Object.fromEntries(data.entries()), {
            preserveState: true,
        });
    };

    const submitCreate = () => {
        form.post('/admin/souvenir/products', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                setIsCreateOpen(false);
                setCreatePreviews([]);
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Produk berhasil dibuat.' });
            },
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Periksa kembali data produk.' }),
        });
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setEditData({
            name: product.name,
            category_id: product.category?.id ?? '',
            description: product.description ?? '',
            price: String(product.price ?? ''),
            cost_price: product.cost_price ? String(product.cost_price) : '',
            sku: product.sku,
            weight: product.weight,
            length: product.length ?? '',
            width: product.width ?? '',
            height: product.height ?? '',
            status: product.status,
            min_stock: product.min_stock,
            stock: product.stock,
            images: [] as File[],
        });
        setExistingImages(product.images ?? []);
        setIsEditOpen(true);
    };

    const submitEdit = (productId: number) => {
        router.post(`/admin/souvenir/products/${productId}`, { ...editData, _method: 'put' }, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setEditingId(null);
                setIsEditOpen(false);
                setExistingImages([]);
                setEditPreviews([]);
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Produk diperbarui.' });
            },
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menyimpan perubahan.' }),
        });
    };

    const deactivate = async (productId: number) => {
        const result = await Swal.fire({
            title: 'Nonaktifkan produk?',
            text: 'Produk akan menjadi inactive.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Nonaktifkan',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.delete(`/admin/souvenir/products/${productId}`, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Produk dinonaktifkan.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menonaktifkan produk.' }),
        });
    };

    const deleteProduct = async (productId: number) => {
        const result = await Swal.fire({
            title: 'Hapus permanen?',
            text: 'Produk akan dihapus permanen. Riwayat transaksi akan menampilkan "Produk tidak tersedia".',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.delete(`/admin/souvenir/products/${productId}/force`, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Produk dihapus permanen.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Produk tidak dapat dihapus.' }),
        });
    };

    const duplicate = (productId: number) => {
        router.post(`/admin/souvenir/products/${productId}/duplicate`, {}, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Produk diduplikasi.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat duplikasi produk.' }),
        });
    };

    const removeExistingImage = (productId: number, imageId: number) => {
        router.delete(`/admin/souvenir/products/${productId}/images/${imageId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Foto berhasil dihapus.',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
            },
            onError: () =>
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Gagal menghapus foto.',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master Produk Retail Shop" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Master Produk Retail Shop</h1>
                            <p className="text-sm text-slate-500">Tambah dan kelola katalog produk souvenir.</p>
                        </div>
                        <Button className="bg-sky-600 text-white hover:bg-sky-700" type="button" onClick={openCreateModal}>
                            Tambah Produk
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
                        <input
                            name="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Cari nama / SKU"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <select
                            name="status"
                            defaultValue={filters.status ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">Semua status</option>
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select
                            name="category_id"
                            defaultValue={filters.category_id ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">Semua kategori</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <Button className="bg-sky-600 text-white hover:bg-sky-700" type="submit">
                            Filter
                        </Button>
                    </form>

                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Produk</th>
                                    <th className="px-4 py-3 text-left">Harga</th>
                                    <th className="px-4 py-3 text-left">Stok</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.data.map((product) => (
                                    <tr key={product.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{product.name}</div>
                                            <div className="text-xs text-slate-500">{product.sku} · {product.category?.name ?? 'Tanpa kategori'}</div>
                                        </td>
                                        <td className="px-4 py-3">Rp {Number(product.price || 0).toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3">{product.stock}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={product.status === 'active' ? 'bg-emerald-50 text-emerald-700' : product.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}>
                                                {product.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>Edit</Button>
                                                <Button size="sm" variant="outline" onClick={() => duplicate(product.id)}>Duplicate</Button>
                                                <Button size="sm" variant="outline" onClick={() => deactivate(product.id)}>Nonaktifkan</Button>
                                                <Button size="sm" variant="destructive" onClick={() => deleteProduct(product.id)}>Hapus</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </section>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Tambah Produk Retail Shop</DialogTitle>
                            <DialogDescription>Lengkapi data produk sebelum disimpan.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1 md:col-span-3">
                                <label className="text-xs font-semibold uppercase text-slate-500">Nama produk</label>
                                <input
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Nama produk"
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Kategori</label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={form.data.category_id}
                                    onChange={(event) => form.setData('category_id', event.target.value)}
                                >
                                    <option value="">Pilih kategori</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">SKU</label>
                                <input
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="SKU"
                                    value={form.data.sku}
                                    onChange={(event) => form.setData('sku', event.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Status</label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={form.data.status}
                                    onChange={(event) => form.setData('status', event.target.value)}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Harga jual</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Harga jual"
                                    value={formatCurrencyInput(form.data.price)}
                                    onChange={(event) => form.setData('price', parseCurrencyToInteger(event.target.value))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Harga modal</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Harga modal"
                                    value={formatCurrencyInput(form.data.cost_price)}
                                    onChange={(event) => form.setData('cost_price', parseCurrencyToInteger(event.target.value))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Berat (gram)</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Berat (gram)"
                                    value={form.data.weight}
                                    onChange={(event) => form.setData('weight', event.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Panjang</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Panjang"
                                    value={form.data.length}
                                    onChange={(event) => form.setData('length', event.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Lebar</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Lebar"
                                    value={form.data.width}
                                    onChange={(event) => form.setData('width', event.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Tinggi</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Tinggi"
                                    value={form.data.height}
                                    onChange={(event) => form.setData('height', event.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Min stok</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Min stok"
                                    value={form.data.min_stock}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        form.setData('min_stock', value === '' ? '' : Number(value));
                                    }}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Stok awal</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Stok awal"
                                    value={form.data.stock}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        form.setData('stock', value === '' ? '' : Number(value));
                                    }}
                                />
                            </div>
                            <div className="space-y-1 md:col-span-3">
                                <label className="text-xs font-semibold uppercase text-slate-500">Deskripsi</label>
                                <textarea
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Deskripsi"
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.target.value)}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-xs font-semibold uppercase text-slate-500">Foto Produk (maks 10)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    onChange={(event) => {
                                        const files = Array.from(event.target.files ?? []);
                                        if (files.length > canAddCreateImages) {
                                            Swal.fire({
                                                icon: 'warning',
                                                title: 'Batas foto',
                                                text: `Maksimal ${maxImages} foto per produk.`,
                                            });
                                            event.target.value = '';
                                            return;
                                        }
                                        form.setData('images', files);
                                    }}
                                />
                                {createPreviews.length > 0 && (
                                    <div className="mt-3 grid grid-cols-5 gap-2">
                                        {createPreviews.map((preview, index) => (
                                            <div key={preview} className="relative overflow-hidden rounded-lg border border-slate-200">
                                                <img src={preview} alt={`Preview ${index + 1}`} className="h-20 w-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                                Batal
                            </Button>
                            <Button className="bg-sky-600 text-white hover:bg-sky-700" type="button" onClick={submitCreate}>
                                Simpan Produk
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditOpen} onOpenChange={(open) => {
                    setIsEditOpen(open);
                    if (!open) setEditingId(null);
                }}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Edit Produk Retail Shop</DialogTitle>
                            <DialogDescription>Perbarui detail produk dan simpan perubahan.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1 md:col-span-3">
                                <label className="text-xs font-semibold uppercase text-slate-500">Nama produk</label>
                                <input
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={editData.name ?? ''}
                                    onChange={(event) => setEditData({ ...editData, name: event.target.value })}
                                    placeholder="Nama produk"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Kategori</label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={editData.category_id ?? ''}
                                    onChange={(event) => setEditData({ ...editData, category_id: event.target.value })}
                                >
                                    <option value="">Pilih kategori</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">SKU</label>
                                <input
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={editData.sku ?? ''}
                                    onChange={(event) => setEditData({ ...editData, sku: event.target.value })}
                                    placeholder="SKU"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Status</label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={editData.status ?? 'draft'}
                                    onChange={(event) => setEditData({ ...editData, status: event.target.value })}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Harga jual</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={formatCurrencyInput(editData.price ?? '')}
                                    onChange={(event) => setEditData({ ...editData, price: parseCurrencyToInteger(event.target.value) })}
                                    placeholder="Harga jual"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Harga modal</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={formatCurrencyInput(editData.cost_price ?? '')}
                                    onChange={(event) => setEditData({ ...editData, cost_price: parseCurrencyToInteger(event.target.value) })}
                                    placeholder="Harga modal"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Berat (gram)</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={editData.weight ?? ''}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setEditData({ ...editData, weight: value === '' ? '' : Number(value) });
                                    }}
                                    placeholder="Berat (gram)"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Panjang</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={editData.length ?? ''}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setEditData({ ...editData, length: value === '' ? '' : Number(value) });
                                    }}
                                    placeholder="Panjang"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Lebar</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={editData.width ?? ''}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setEditData({ ...editData, width: value === '' ? '' : Number(value) });
                                    }}
                                    placeholder="Lebar"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Tinggi</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={editData.height ?? ''}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setEditData({ ...editData, height: value === '' ? '' : Number(value) });
                                    }}
                                    placeholder="Tinggi"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Min stok</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={editData.min_stock ?? ''}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setEditData({ ...editData, min_stock: value === '' ? '' : Number(value) });
                                    }}
                                    placeholder="Min stok"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500">Stok</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={editData.stock ?? ''}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setEditData({ ...editData, stock: value === '' ? '' : Number(value) });
                                    }}
                                    placeholder="Stok"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-3">
                                <label className="text-xs font-semibold uppercase text-slate-500">Deskripsi</label>
                                <textarea
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={editData.description ?? ''}
                                    onChange={(event) => setEditData({ ...editData, description: event.target.value })}
                                    placeholder="Deskripsi"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-xs font-semibold uppercase text-slate-500">Foto Produk (maks 10)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    onChange={(event) => {
                                        const files = Array.from(event.target.files ?? []);
                                        if (files.length > canAddEditImages) {
                                            Swal.fire({
                                                icon: 'warning',
                                                title: 'Batas foto',
                                                text: `Maksimal ${maxImages} foto per produk.`,
                                            });
                                            event.target.value = '';
                                            return;
                                        }
                                        setEditData({ ...editData, images: files });
                                    }}
                                />
                                {existingImages.length > 0 && (
                                    <div className="mt-3 grid grid-cols-5 gap-2">
                                        {existingImages.map((image) => (
                                            <div key={image.id} className="relative overflow-hidden rounded-lg border border-slate-200">
                                                <img src={image.url} alt="Foto produk" className="h-20 w-full object-cover" />
                                                <button
                                                    type="button"
                                                    className="absolute right-1 top-1 rounded-full bg-white/90 px-2 text-xs text-rose-600 shadow"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        if (editingId) {
                                                            removeExistingImage(editingId, image.id);
                                                        }
                                                    }}
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {editPreviews.length > 0 && (
                                    <div className="mt-3 grid grid-cols-5 gap-2">
                                        {editPreviews.map((preview, index) => (
                                            <div key={preview} className="relative overflow-hidden rounded-lg border border-slate-200">
                                                <img src={preview} alt={`Preview ${index + 1}`} className="h-20 w-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" type="button" onClick={() => {
                                setIsEditOpen(false);
                                setEditingId(null);
                            }}>
                                Batal
                            </Button>
                            <Button
                                className="bg-sky-600 text-white hover:bg-sky-700"
                                type="button"
                                onClick={() => editingId && submitEdit(editingId)}
                            >
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
