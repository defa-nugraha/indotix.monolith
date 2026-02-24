import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';

type Post = {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    label?: string | null;
    category?: string | null;
    cover_image_url?: string | null;
    published_at?: string | null;
    author?: string | null;
    tags?: string[];
};

type Suggestion = {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    label?: string | null;
    cover_image_url?: string | null;
    published_at?: string | null;
    category?: string | null;
    tags?: string[];
};

export default function BlogShow({ post, prevPost, nextPost, relatedPosts = [] }: { post: Post; prevPost?: Suggestion | null; nextPost?: Suggestion | null; relatedPosts?: Suggestion[] }) {
    const { unread_notifications, souvenir_cart_count } = usePage().props as { unread_notifications?: number; souvenir_cart_count?: number };

    return (
        <PublicLayout>
            <Head title={`${post.title} - Jelajah Indotix`} />
            <main className="mx-auto w-full max-w-none px-[10%] py-10">
                <div className="mb-6">
                    <Link href="/jelajah" className="text-sm font-semibold text-sky-600">
                        ← Kembali ke Jelajah Indotix
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_2.2fr_1fr]">
                    <aside className="space-y-4">
                        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                            <div className="px-4 pt-4">
                                <h3 className="text-sm font-semibold text-slate-900">Artikel Berikutnya</h3>
                            </div>
                            {nextPost ? (
                                <Link href={`/jelajah/${nextPost.slug}`} className="mt-3 block">
                                    {nextPost.cover_image_url ? (
                                        <img
                                            src={nextPost.cover_image_url}
                                            alt={nextPost.title}
                                            className="h-32 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-32 w-full bg-gradient-to-br from-sky-200 to-sky-50" />
                                    )}
                                    <div className="px-4 pb-4">
                                        <div className="mt-3 text-xs text-slate-500">{nextPost.published_at ?? ''}</div>
                                        <div className="mt-1 text-sm font-semibold text-slate-900">{nextPost.title}</div>
                                        {nextPost.excerpt && <div className="mt-2 text-xs text-slate-500 line-clamp-2">{nextPost.excerpt}</div>}
                                    </div>
                                </Link>
                            ) : (
                                <div className="px-4 pb-4 pt-3 text-xs text-slate-500">Belum ada artikel berikutnya.</div>
                            )}
                        </div>
                    </aside>

                    <article className="rounded-3xl bg-white p-6 shadow-sm">
                        {post.cover_image_url && (
                            <img src={post.cover_image_url} alt={post.title} className="mb-6 h-60 w-full rounded-2xl object-cover" />
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {post.category && <span>{post.category}</span>}
                            {post.label && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-600">{post.label}</span>}
                            {post.published_at && <span>{post.published_at}</span>}
                        </div>
                        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{post.title}</h1>
                        {post.excerpt && <p className="mt-3 text-sm text-slate-600">{post.excerpt}</p>}
                        <div className="prose prose-slate mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
                        {post.tags && post.tags.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-2">
                                {post.tags.map((tag) => (
                                    <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </article>

                    <aside className="space-y-4">
                        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                            <div className="px-4 pt-4">
                                <h3 className="text-sm font-semibold text-slate-900">Artikel Terkait</h3>
                            </div>
                            <div className="mt-4 space-y-4 px-4 pb-4">
                                {relatedPosts.map((item) => (
                                    <Link key={item.id} href={`/jelajah/${item.slug}`} className="block">
                                        <div className="flex gap-3">
                                            {item.cover_image_url ? (
                                                <img
                                                    src={item.cover_image_url}
                                                    alt={item.title}
                                                    className="h-16 w-16 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-sky-200 to-sky-50" />
                                            )}
                                            <div>
                                                <div className="text-xs text-slate-500">{item.category ?? 'Artikel'}</div>
                                                <div className="text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</div>
                                                {item.tags && item.tags.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {item.tags.slice(0, 3).map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600"
                                                            >
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {relatedPosts.length === 0 && (
                                    <div className="text-xs text-slate-500">Belum ada artikel terkait.</div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </PublicLayout>
    );
}
