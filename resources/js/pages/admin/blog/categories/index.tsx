import { Head, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';

type Category = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    posts_count?: number;
};

export default function BlogCategoriesIndex({
    categories = [],
}: {
    categories: Category[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Jelajah Indotix', href: '/admin/blog/posts' },
        { title: 'Kategori', href: '/admin/blog/categories' },
    ];

    const form = useForm({
        name: '',
        slug: '',
        description: '',
        is_active: true,
    });

    const submit = () => {
        form.post('/admin/blog/categories', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Kategori ditambahkan.',
                });
            },
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat menyimpan kategori.',
                }),
        });
    };

    const updateCategory = (
        categoryId: number,
        payload: Record<string, string | number | boolean | null>,
    ) => {
        router.put(`/admin/blog/categories/${categoryId}`, payload, {
            preserveScroll: true,
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Kategori diperbarui.',
                }),
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat memperbarui kategori.',
                }),
        });
    };

    const deleteCategory = async (categoryId: number) => {
        const result = await Swal.fire({
            title: 'Hapus kategori?',
            text: 'Postingan di kategori ini akan diset tanpa kategori.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.delete(`/admin/blog/categories/${categoryId}`, {
            preserveScroll: true,
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Terhapus',
                    text: 'Kategori dihapus.',
                }),
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat menghapus kategori.',
                }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori Jelajah Indotix" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Kategori Jelajah Indotix
                    </h1>
                    <p className="text-sm text-slate-500">
                        Kelola kategori artikel untuk memudahkan pengelompokan
                        konten.
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Nama kategori</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Nama kategori"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Slug</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Slug (opsional)"
                                value={form.data.slug}
                                onChange={(event) =>
                                    form.setData('slug', event.target.value)
                                }
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Deskripsi singkat</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Deskripsi singkat"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData('description', event.target.value)
                                }
                            />
                        </label>
                        <Button
                            className="bg-sky-600 text-white hover:bg-sky-700"
                            type="button"
                            onClick={submit}
                        >
                            Simpan Kategori
                        </Button>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Kategori
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Slug
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Jumlah Post
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3 font-semibold text-slate-900">
                                            {item.name}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {item.slug}
                                        </td>
                                        <td className="px-4 py-3">
                                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                <span>Status</span>
                                                <select
                                                    defaultValue={
                                                        item.is_active
                                                            ? 'active'
                                                            : 'inactive'
                                                    }
                                                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                                                    onChange={(event) =>
                                                        updateCategory(item.id, {
                                                            is_active:
                                                                event.target
                                                                    .value ===
                                                                'active',
                                                        })
                                                    }
                                                >
                                                    <option value="active">
                                                        Aktif
                                                    </option>
                                                    <option value="inactive">
                                                        Nonaktif
                                                    </option>
                                                </select>
                                            </label>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {item.posts_count ?? 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        deleteCategory(item.id)
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
            </div>
        </AppLayout>
    );
}
