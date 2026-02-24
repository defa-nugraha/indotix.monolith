import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { loadCkeditor } from '@/lib/ckeditor-loader';

type Category = { id: number; name: string };
type Tag = { id: number; name: string };

declare global {
    interface Window {
        ClassicEditor?: any;
    }
}

export default function BlogPostCreate({ categories = [], tags = [] }: { categories: Category[]; tags: Tag[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Jelajah Indotix', href: '/admin/blog/posts' },
        { title: 'Tambah Artikel', href: '/admin/blog/posts/create' },
    ];

    const editorRef = useRef<HTMLTextAreaElement | null>(null);
    const editorInstanceRef = useRef<any>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [editorError, setEditorError] = useState<string | null>(null);

    const form = useForm({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        label: '',
        category_id: '',
        tags: '',
        status: 'draft',
        published_at: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        cover_image: null as File | null,
    });

    const initEditor = async () => {
        if (editorInstanceRef.current) return;
        setEditorError(null);
        try {
            await loadCkeditor();
            if (!editorRef.current || !window.ClassicEditor) {
                setEditorError('Editor belum tersedia.');
                return;
            }
            editorInstanceRef.current = await window.ClassicEditor.create(editorRef.current, {
                toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'undo', 'redo'],
            });
            editorInstanceRef.current.model.document.on('change:data', () => {
                form.setData('content', editorInstanceRef.current.getData());
            });
            setIsEditorReady(true);
        } catch (error) {
            setEditorError('Gagal memuat editor. Coba muat ulang.');
        }
    };

    useEffect(() => {
        initEditor();
        return () => {
            if (editorInstanceRef.current) {
                editorInstanceRef.current.destroy();
                editorInstanceRef.current = null;
            }
        };
    }, []);

    const submit = () => {
        form.post('/admin/blog/posts', {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Artikel Jelajah Indotix" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Tambah Artikel</h1>
                            <p className="text-sm text-slate-500">Buat konten Jelajah Indotix dengan editor visual.</p>
                        </div>
                        <Link href="/admin/blog/posts" className="text-sm font-semibold text-slate-600">
                            Kembali
                        </Link>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Judul artikel"
                            value={form.data.title}
                            onChange={(event) => form.setData('title', event.target.value)}
                        />
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Slug (opsional)"
                            value={form.data.slug}
                            onChange={(event) => form.setData('slug', event.target.value)}
                        />
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
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Label (contoh: Highlight, Trending)"
                            value={form.data.label}
                            onChange={(event) => form.setData('label', event.target.value)}
                        />
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                            placeholder="Tags (pisahkan dengan koma)"
                            value={form.data.tags}
                            onChange={(event) => form.setData('tags', event.target.value)}
                        />
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
                        <textarea ref={editorRef} className="mt-2 h-64 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        {!isEditorReady && !editorError && <div className="mt-2 text-xs text-slate-400">Memuat editor...</div>}
                        {editorError && (
                            <div className="mt-2 flex items-center gap-3 text-xs text-rose-500">
                                <span>{editorError}</span>
                                <button type="button" className="font-semibold text-sky-600" onClick={initEditor}>
                                    Coba lagi
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Cover Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="mt-2 block w-full text-sm"
                                onChange={(event) => form.setData('cover_image', event.target.files?.[0] ?? null)}
                            />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <select
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.status}
                                onChange={(event) => form.setData('status', event.target.value)}
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                            <input
                                type="datetime-local"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.published_at}
                                onChange={(event) => form.setData('published_at', event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Meta title (SEO)"
                            value={form.data.meta_title}
                            onChange={(event) => form.setData('meta_title', event.target.value)}
                        />
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Meta description"
                            value={form.data.meta_description}
                            onChange={(event) => form.setData('meta_description', event.target.value)}
                        />
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Meta keywords (pisahkan koma)"
                            value={form.data.meta_keywords}
                            onChange={(event) => form.setData('meta_keywords', event.target.value)}
                        />
                    </div>

                    <div className="mt-6">
                        <Button className="bg-sky-600 text-white hover:bg-sky-700" type="button" onClick={submit}>
                            Simpan Artikel
                        </Button>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
