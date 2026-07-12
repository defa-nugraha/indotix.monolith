import { Head, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';

type Tag = {
    id: number;
    name: string;
    slug: string;
    posts_count?: number;
};

export default function BlogTagsIndex({ tags = [] }: { tags: Tag[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Jelajah Indotix', href: '/admin/blog/posts' },
        { title: 'Tags', href: '/admin/blog/tags' },
    ];

    const form = useForm({
        name: '',
        slug: '',
    });

    const submit = () => {
        form.post('/admin/blog/tags', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Tag ditambahkan.',
                });
            },
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat menyimpan tag.',
                }),
        });
    };

    const updateTag = (
        tagId: number,
        payload: Record<string, string | number | boolean | null>,
    ) => {
        router.put(`/admin/blog/tags/${tagId}`, payload, {
            preserveScroll: true,
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Tag diperbarui.',
                }),
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat memperbarui tag.',
                }),
        });
    };

    const deleteTag = async (tagId: number) => {
        const result = await Swal.fire({
            title: 'Hapus tag?',
            text: 'Tag akan dihapus dari daftar.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.delete(`/admin/blog/tags/${tagId}`, {
            preserveScroll: true,
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Terhapus',
                    text: 'Tag dihapus.',
                }),
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat menghapus tag.',
                }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tags Jelajah Indotix" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Tags Jelajah Indotix
                    </h1>
                    <p className="text-sm text-slate-500">
                        Gunakan tags untuk SEO dan pengelompokan tema.
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Nama tag</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Nama tag"
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
                        <Button
                            className="bg-sky-600 text-white hover:bg-sky-700"
                            type="button"
                            onClick={submit}
                        >
                            Simpan Tag
                        </Button>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Tag</th>
                                    <th className="px-4 py-3 text-left">
                                        Slug
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
                                {tags.map((item) => (
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
                                        <td className="px-4 py-3 text-slate-500">
                                            {item.posts_count ?? 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        updateTag(item.id, {
                                                            name: item.name,
                                                            slug: item.slug,
                                                        })
                                                    }
                                                    className="hidden"
                                                >
                                                    Simpan
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        deleteTag(item.id)
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
