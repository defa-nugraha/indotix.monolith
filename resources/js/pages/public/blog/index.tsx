import { Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import { PublicSeo } from '@/components/public-seo';
import {
    PublicFooter,
    PublicTrustSection,
    type PublicContact,
    type PublicTrustContent,
} from '@/components/public-page-sections';

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

const paginationLabel = (label: string) =>
    label
        .replace('&laquo;', '‹')
        .replace('&raquo;', '›')
        .replace('Previous', 'Sebelumnya')
        .replace('Next', 'Berikutnya');

const mobileBlogGridClass =
    'grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6';

export default function BlogIndex({
    posts,
    homeContent,
    contact,
}: {
    posts: {
        data: Post[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    homeContent?: PublicTrustContent | null;
    contact?: PublicContact | null;
}) {
    return (
        <PublicLayout>
            <PublicSeo
                title="Jelajah Indotix - Inspirasi Wisata dan Perjalanan"
                description="Baca inspirasi perjalanan, rekomendasi destinasi, panduan event, hotel, dan pengalaman pilihan dari Indotix."
                canonicalPath="/jelajah"
                image={
                    posts.data.find((post) => post.cover_image_url)
                        ?.cover_image_url
                }
                keywords={[
                    'blog wisata',
                    'inspirasi perjalanan',
                    'rekomendasi destinasi',
                    'Jelajah Indotix',
                ]}
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    name: 'Artikel Jelajah Indotix',
                    itemListElement: posts.data.map((post, index) => ({
                        '@type': 'ListItem',
                        position: index + 1,
                        name: post.title,
                        url: `/jelajah/${post.slug}`,
                    })),
                }}
            />
            <main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-10 md:px-8">
                <div className="mb-5 sm:mb-8">
                    <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                        Jelajah Indotix
                    </h1>
                    <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                        Inspirasi perjalanan, rekomendasi destinasi, dan cerita
                        terbaik.
                    </p>
                </div>

                <div className={mobileBlogGridClass}>
                    {posts.data.map((post) => (
                        <div
                            key={post.id}
                            className="min-w-0 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm sm:rounded-2xl"
                        >
                            <div className="aspect-[4/3] bg-slate-100">
                                {post.cover_image_url ? (
                                    <img
                                        src={post.cover_image_url}
                                        alt={post.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-sky-200 to-sky-50" />
                                )}
                            </div>
                            <div className="p-2.5 sm:p-4">
                                <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] text-slate-500 sm:gap-2 sm:text-xs">
                                    {post.category && (
                                        <span className="truncate">
                                            {post.category}
                                        </span>
                                    )}
                                    {post.label && (
                                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-600">
                                            {post.label}
                                        </span>
                                    )}
                                </div>
                                <h3 className="mt-2 line-clamp-2 text-xs leading-snug font-semibold text-slate-900 sm:text-sm">
                                    {post.title}
                                </h3>
                                {post.excerpt && (
                                    <p className="mt-1.5 line-clamp-2 text-[11px] text-slate-500 sm:mt-2 sm:line-clamp-3 sm:text-xs">
                                        {post.excerpt}
                                    </p>
                                )}
                                <Link
                                    href={`/jelajah/${post.slug}`}
                                    className="mt-3 inline-flex text-xs font-semibold text-sky-600 sm:mt-4 sm:text-sm"
                                >
                                    Baca Selengkapnya
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

                {posts.links.length > 3 && (
                    <nav
                        className="mt-8 flex flex-wrap items-center justify-center gap-2"
                        aria-label="Pagination artikel"
                    >
                        {posts.links.map((link, index) => {
                            const label = paginationLabel(link.label);
                            const commonClass =
                                'inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition';

                            if (!link.url) {
                                return (
                                    <span
                                        key={`${link.label}-${index}`}
                                        className={`${commonClass} cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400`}
                                    >
                                        {label}
                                    </span>
                                );
                            }

                            return (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url}
                                    preserveScroll
                                    className={
                                        link.active
                                            ? `${commonClass} border-sky-600 bg-sky-600 text-white shadow-sm`
                                            : `${commonClass} border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700`
                                    }
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </main>
            <PublicTrustSection homeContent={homeContent} contact={contact} />
            <PublicFooter contact={contact} />
        </PublicLayout>
    );
}
