import { Head, usePage } from '@inertiajs/react';

type PublicSeoProps = {
    title: string;
    description?: string | null;
    image?: string | null;
    canonicalPath?: string;
    type?: 'website' | 'product' | 'event';
    structuredData?: Record<string, unknown>;
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
    structuredData,
}: PublicSeoProps) {
    const { app_url: appUrl } = usePage().props as { app_url?: string };
    const baseUrl = (appUrl ?? 'https://indotix.co.id').replace(/\/$/, '');
    const canonicalUrl = canonicalPath
        ? `${baseUrl}/${canonicalPath.replace(/^\//, '')}`
        : baseUrl;
    const imageUrl = image
        ? image.startsWith('http')
            ? image
            : `${baseUrl}/${image.replace(/^\//, '')}`
        : `${baseUrl}/logo.png`;
    const metaDescription = cleanDescription(description);

    return (
        <Head title={title}>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={canonicalUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={imageUrl} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={imageUrl} />
            {structuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(structuredData),
                    }}
                />
            )}
        </Head>
    );
}
