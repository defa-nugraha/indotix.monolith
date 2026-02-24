import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';

type Post = {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    label?: string | null;
    category?: string | null;
    cover_image_url?: string | null;
    published_at?: string | null;
    author?: string | null;
    tags?: string[];
};

export default function BlogIndex({ posts }: { posts: { data: Post[]; links: { url: string | null; label: string; active: boolean }[] } }) {
    const { unread_notifications, souvenir_cart_count } = usePage().props as { unread_notifications?: number; souvenir_cart_count?: number };

    return (
        <PublicLayout>
            <Head title="Jelajah Indotix" />
            <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-slate-900">Jelajah Indotix</h1>
                    <p className="mt-2 text-sm text-slate-500">Inspirasi perjalanan, rekomendasi destinasi, dan cerita terbaik.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.data.map((post) => (
                        <div key={post.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                            <div className="h-44 bg-slate-100">
                                {post.cover_image_url ? (
                                    <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-sky-200 to-sky-50" />
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    {post.category && <span>{post.category}</span>}
                                    {post.label && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-600">{post.label}</span>}
                                </div>
                                <h3 className="mt-2 text-sm font-semibold text-slate-900">{post.title}</h3>
                                {post.excerpt && <p className="mt-2 text-xs text-slate-500 line-clamp-3">{post.excerpt}</p>}
                                <Link
                                    href={`/jelajah/${post.slug}`}
                                    className="mt-4 inline-flex text-sm font-semibold text-sky-600"
                                >
                                    Baca Selengkapnya →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {posts.data.length === 0 && (
                    <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                        Belum ada artikel.
                    </div>
                )}
            </main>
        </PublicLayout>
    );
}
