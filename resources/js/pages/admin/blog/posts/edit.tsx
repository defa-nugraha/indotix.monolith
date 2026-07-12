import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import CkeditorField from '@/components/ckeditor-field';

type Category = { id: number; name: string };
type Tag = { id: number; name: string };
type Post = {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    label?: string | null;
    category_id?: number | null;
    cover_image_url?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
    status: string;
    published_at?: string | null;
    tags?: string[];
};

export default function BlogPostEdit({ post, categories = [], tags = [] }: { post: Post; categories: Category[]; tags: Tag[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Jelajah Indotix', href: '/admin/blog/posts' },
        { title: 'Edit Artikel', href: `/admin/blog/posts/${post.id}/edit` },
    ];

    const form = useForm({
        title: post.title ?? '',
        slug: post.slug ?? '',
        excerpt: post.excerpt ?? '',
        content: post.content ?? '',
        label: post.label ?? '',
        category_id: post.category_id ? String(post.category_id) : '',
        tags: post.tags?.join(', ') ?? '',
        status: post.status ?? 'draft',
        published_at: post.published_at ?? '',
        meta_title: post.meta_title ?? '',
        meta_description: post.meta_description ?? '',
        meta_keywords: post.meta_keywords ?? '',
        cover_image: null as File | null,
        _method: 'put',
    });

    const submit = () => {
        form.post(`/admin/blog/posts/${post.id}`, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Artikel Jelajah Indotix" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Edit Artikel</h1>
                            <p className="text-sm text-slate-500">Perbarui konten dan metadata SEO.</p>
                        </div>
                        <Link href="/admin/blog/posts" className="text-sm font-semibold text-slate-600">
                            Kembali
                        </Link>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Judul artikel</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Judul artikel"
                                value={form.data.title}
                                onChange={(event) => form.setData('title', event.target.value)}
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Slug</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Slug (opsional)"
                                value={form.data.slug}
                                onChange={(event) => form.setData('slug', event.target.value)}
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Kategori</span>
                            <select
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.category_id}
                                onChange={(event) => form.setData('category_id', event.target.value)}
                            >
                                <option value="">Pilih kategori</option>
                                {categories.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Label artikel</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Label (contoh: Highlight, Trending)"
                                value={form.data.label}
                                onChange={(event) => form.setData('label', event.target.value)}
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600 md:col-span-2">
                            <span>Tags</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Tags (pisahkan dengan koma)"
                                value={form.data.tags}
                                onChange={(event) => form.setData('tags', event.target.value)}
                            />
                        </label>
                    </div>

                    <div className="mt-6">
                        <label className="text-sm font-semibold text-slate-700">Ringkasan</label>
                        <textarea
                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            rows={3}
                            placeholder="Ringkasan singkat artikel untuk preview."
                            value={form.data.excerpt}
                            onChange={(event) => form.setData('excerpt', event.target.value)}
                        />
                    </div>

                    <div className="mt-6">
                        <label className="text-sm font-semibold text-slate-700">Konten</label>
                        <div className="mt-2">
                            <CkeditorField
                                value={form.data.content}
                                onChange={(value) => form.setData('content', value)}
                                minHeightClassName="min-h-[260px]"
                            />
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Cover Image</label>
                            {post.cover_image_url && (
                                <img src={post.cover_image_url} alt={post.title} className="mt-2 h-32 w-full rounded-lg object-cover" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="mt-2 block w-full text-sm"
                                onChange={(event) => form.setData('cover_image', event.target.files?.[0] ?? null)}
                            />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                <span>Status</span>
                                <select
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={form.data.status}
                                    onChange={(event) => form.setData('status', event.target.value)}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </label>
                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                <span>Waktu publikasi</span>
                                <input
                                    type="datetime-local"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={form.data.published_at ?? ''}
                                    onChange={(event) => form.setData('published_at', event.target.value)}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Meta title (SEO)</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Meta title (SEO)"
                                value={form.data.meta_title}
                                onChange={(event) => form.setData('meta_title', event.target.value)}
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Meta description</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Meta description"
                                value={form.data.meta_description}
                                onChange={(event) => form.setData('meta_description', event.target.value)}
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Meta keywords</span>
                            <input
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Meta keywords (pisahkan koma)"
                                value={form.data.meta_keywords}
                                onChange={(event) => form.setData('meta_keywords', event.target.value)}
                            />
                        </label>
                    </div>

                    <div className="mt-6">
                        <Button className="bg-sky-600 text-white hover:bg-sky-700" type="button" onClick={submit}>
                            Simpan Perubahan
                        </Button>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
