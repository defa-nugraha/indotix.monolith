import { Head, usePage } from '@inertiajs/react';

type PublicSeoProps = {
    title: string;
    description?: string | null;
    image?: string | null;
    canonicalPath?: string;
    type?: 'website' | 'product' | 'event' | 'article';
    keywords?: string[] | string;
    robots?: string;
    structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

const cleanDescription = (value?: string | null) => {
    const normalized = (value ?? '').replace(/\s+/g, ' ').trim();

    return normalized.length > 0
        ? normalized.slice(0, 160)
        : 'Temukan dan pesan produk pilihan melalui Indotix.';
};

export function PublicSeo({
    title,
    description,
    image,
    canonicalPath,
    type = 'website',
    keywords,
    robots = 'index,follow,max-image-preview:large',
    structuredData,
}: PublicSeoProps) {
    const page = usePage();
    const { app_url: appUrl } = page.props as { app_url?: string };
    const baseUrl = (appUrl ?? 'https://indotix.co.id').replace(/\/$/, '');
    const currentPath = page.url.split(/[?#]/)[0] || '/';
    const resolvedPath = canonicalPath ?? currentPath;
    const canonicalUrl =
        resolvedPath === '/'
            ? baseUrl
            : `${baseUrl}/${resolvedPath.replace(/^\//, '')}`;
    const imageUrl = image
        ? image.startsWith('http')
            ? image
            : `${baseUrl}/${image.replace(/^\//, '')}`
        : `${baseUrl}/logo.png`;
    const metaDescription = cleanDescription(description);
    const metaKeywords = Array.isArray(keywords)
        ? keywords.filter(Boolean).join(', ')
        : keywords;
    const serializedStructuredData = structuredData
        ? JSON.stringify(structuredData).replace(/</g, '\\u003c')
        : null;

    return (
        <Head title={title}>
            <meta
                head-key="description"
                name="description"
                content={metaDescription}
            />
            <meta head-key="robots" name="robots" content={robots} />
            {metaKeywords && (
                <meta
                    head-key="keywords"
                    name="keywords"
                    content={metaKeywords}
                />
            )}
            <link rel="canonical" href={canonicalUrl} />
            <meta
                head-key="og-site-name"
                property="og:site_name"
                content="Indotix"
            />
            <meta head-key="og-locale" property="og:locale" content="id_ID" />
            <meta head-key="og-title" property="og:title" content={title} />
            <meta
                head-key="og-description"
                property="og:description"
                content={metaDescription}
            />
            <meta head-key="og-type" property="og:type" content={type} />
            <meta head-key="og-url" property="og:url" content={canonicalUrl} />
            <meta head-key="og-image" property="og:image" content={imageUrl} />
            <meta
                head-key="twitter-card"
                name="twitter:card"
                content="summary_large_image"
            />
            <meta
                head-key="twitter-title"
                name="twitter:title"
                content={title}
            />
            <meta
                head-key="twitter-description"
                name="twitter:description"
                content={metaDescription}
            />
            <meta
                head-key="twitter-image"
                name="twitter:image"
                content={imageUrl}
            />
            {serializedStructuredData && (
                <script
                    head-key="structured-data"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: serializedStructuredData,
                    }}
                />
            )}
        </Head>
    );
}
