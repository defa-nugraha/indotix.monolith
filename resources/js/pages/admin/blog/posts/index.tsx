import { Head, Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { BulkDeleteTable, BulkDeleteRow, BulkDeleteSelectAll } from '@/components/admin/bulk-delete-table';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Post = {
    id: number;
    title: string;
    slug: string;
    status: string;
    label?: string | null;
    category?: string | null;
    tags?: string[];
    cover_image_url?: string | null;
    published_at?: string | null;
    author?: string | null;
};

type PageProps = {
    posts: {
        data: Post[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { status?: string };
};

export default function BlogPostsIndex() {
    const { posts, filters } = usePage<PageProps>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Jelajah Indotix', href: '/admin/blog/posts' },
    ];

    const deletePost = async (postId: number) => {
        const result = await Swal.fire({
            title: 'Hapus artikel?',
            text: 'Artikel akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.delete(`/admin/blog/posts/${postId}`, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Artikel dihapus.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menghapus artikel.' }),
        });
    };

    const updateFilter = (value: string) => {
        router.get('/admin/blog/posts', value ? { status: value } : {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jelajah Indotix" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Jelajah Indotix</h1>
                            <p className="text-sm text-slate-500">Kelola artikel, SEO, dan konten publik.</p>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/admin/blog/tags" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                                Tags
                            </Link>
                            <Link href="/admin/blog/posts/create">
                                <Button className="bg-sky-600 text-white hover:bg-sky-700">Tambah Artikel</Button>
                            </Link>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="grid max-w-xs gap-1 text-xs font-medium text-slate-600">
                            <span>Status artikel</span>
                            <select
                                value={filters?.status ?? ''}
                                onChange={(event) => updateFilter(event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Semua Status</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </label>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <BulkDeleteTable className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <BulkDeleteSelectAll />
                                    <th className="px-4 py-3 text-left">Cover</th>
                                    <th className="px-4 py-3 text-left">Judul</th>
                                    <th className="px-4 py-3 text-left">Kategori</th>
                                    <th className="px-4 py-3 text-left">Label/Tags</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Publish</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.data.map((item) => (
                                    <BulkDeleteRow deleteUrl={`/admin/blog/posts/${item.id}`} key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            {item.cover_image_url ? (
                                                <img
                                                    src={item.cover_image_url}
                                                    alt={item.title}
                                                    className="h-12 w-16 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="h-12 w-16 rounded-lg bg-slate-100" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{item.title}</div>
                                            <div className="text-xs text-slate-500">{item.slug}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{item.category ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-500">
                                            <div>{item.label ?? '-'}</div>
                                            <div className="text-xs">{item.tags?.join(', ')}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{item.status}</td>
                                        <td className="px-4 py-3 text-slate-500">{item.published_at ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/admin/blog/posts/${item.id}/edit`}
                                                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => deletePost(item.id)}
                                                    className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </BulkDeleteRow>
                                ))}
                                {posts.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                                            Belum ada artikel.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </BulkDeleteTable>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
