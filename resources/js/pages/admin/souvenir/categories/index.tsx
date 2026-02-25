import { Head, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';

type Category = {
    id: number;
    name: string;
    parent_id?: number | null;
    sort_order: number;
    is_active: boolean;
    parent?: { id: number; name: string } | null;
};

export default function SouvenirCategoriesIndex({ categories = [] }: { categories: Category[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Retail Shop', href: '/admin/souvenir/products' },
        { title: 'Kategori Produk', href: '/admin/souvenir/categories' },
    ];

    const form = useForm({
        name: '',
        parent_id: '',
        sort_order: 0,
        is_active: true,
    });

    const submit = () => {
        form.post('/admin/souvenir/categories', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Kategori berhasil ditambahkan.' });
            },
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menyimpan kategori.' }),
        });
    };

    const updateCategory = (categoryId: number, payload: Record<string, unknown>) => {
        router.put(`/admin/souvenir/categories/${categoryId}`, payload, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Kategori diperbarui.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memperbarui kategori.' }),
        });
    };

    const deleteCategory = async (categoryId: number) => {
        const result = await Swal.fire({
            title: 'Hapus kategori?',
            text: 'Kategori akan dihapus dari daftar.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.delete(`/admin/souvenir/categories/${categoryId}`, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Kategori dihapus.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menghapus kategori.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori Retail Shop" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Kategori Produk Retail Shop</h1>
                    <p className="text-sm text-slate-500">Kelola kategori & sub-kategori untuk katalog souvenir.</p>

                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Nama kategori"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                        />
                        <select
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={form.data.parent_id}
                            onChange={(event) => form.setData('parent_id', event.target.value)}
                        >
                            <option value="">Tanpa parent</option>
                            {categories.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Urutan"
                            value={form.data.sort_order}
                            onChange={(event) => form.setData('sort_order', Number(event.target.value))}
                        />
                        <Button className="bg-sky-600 text-white hover:bg-sky-700" type="button" onClick={submit}>
                            Simpan Kategori
                        </Button>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Kategori</th>
                                    <th className="px-4 py-3 text-left">Parent</th>
                                    <th className="px-4 py-3 text-left">Urutan</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                                        <td className="px-4 py-3 text-slate-500">{item.parent?.name ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                defaultValue={item.sort_order}
                                                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                                                onBlur={(event) => updateCategory(item.id, { sort_order: Number(event.target.value) })}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                defaultValue={item.is_active ? 'active' : 'inactive'}
                                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                                                onChange={(event) => updateCategory(item.id, { is_active: event.target.value === 'active' })}
                                            >
                                                <option value="active">Aktif</option>
                                                <option value="inactive">Nonaktif</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => deleteCategory(item.id)}
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
            </div>
        </AppLayout>
    );
}
