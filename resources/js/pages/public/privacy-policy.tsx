import { Link } from '@inertiajs/react';
import {
    BookOpen,
    CalendarCheck,
    MapPinned,
    ShoppingBag,
    Star,
    Ticket,
} from 'lucide-react';
import { PublicFooter } from '@/components/public-footer';
import PublicLayout from '@/layouts/public-layout';
import { PublicSeo } from '@/components/public-seo';

type Policy = {
    id: number;
    title: string;
    content: string;
    terms_content?: string | null;
    version: string | null;
    effective_at: string | null;
};

export default function PrivacyPolicyPage({
    policy,
    initialSection = 'privacy',
    pageTitle,
    canonicalPath = '/privacy-policy',
}: {
    policy: Policy | null;
    initialSection?: 'privacy' | 'terms';
    pageTitle?: string;
    canonicalPath?: string;
}) {
    const isTermsPage = initialSection === 'terms';
    const resolvedTitle =
        pageTitle ??
        (isTermsPage ? 'Syarat dan Ketentuan Indotix' : 'Kebijakan Privasi Indotix');
    const description = isTermsPage
        ? 'Syarat dan ketentuan penggunaan layanan Indotix untuk pemesanan tiket wisata dan layanan digital terkait.'
        : 'Kebijakan privasi Indotix mengenai pengumpulan, penggunaan, penyimpanan, dan perlindungan data pribadi pengguna.';
    const sectionOrder = isTermsPage
        ? ['terms', 'privacy-policy']
        : ['privacy-policy', 'terms'];

    const categories = [
        { label: 'Wisata', icon: MapPinned, active: true, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Retail Shop', icon: ShoppingBag, href: '/retail-shop' },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Academy', icon: BookOpen, href: '/academy' },
        { label: 'Hotel', icon: Ticket, href: '/stay' },
    ];

    const chips = [
        'Alam',
        'Budaya',
        'Edukasi',
        'Kuliner',
        'Desa Wisata',
        'Religi',
        'Pantai',
        'Gunung',
        'Taman Nasional',
        'Air Terjun',
        'Danau',
    ];

    return (
        <PublicLayout categories={categories} chips={chips}>
            <PublicSeo
                title={`${resolvedTitle} - Indotix`}
                description={description}
                canonicalPath={canonicalPath}
                keywords={[
                    isTermsPage
                        ? 'syarat dan ketentuan Indotix'
                        : 'kebijakan privasi Indotix',
                    isTermsPage
                        ? 'ketentuan penggunaan layanan Indotix'
                        : 'perlindungan data pengguna',
                ]}
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'WebPage',
                    name: resolvedTitle,
                    url: canonicalPath,
                    dateModified: policy?.effective_at ?? undefined,
                }}
            />
            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8 md:px-8 lg:py-10">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
                    <nav className="text-xs text-slate-500">
                        <Link
                            href="/"
                            className="transition hover:text-sky-600"
                        >
                            Beranda
                        </Link>
                        <span className="mx-2">/</span>
                        <span className="text-slate-700">
                            {isTermsPage
                                ? 'Syarat dan Ketentuan'
                                : 'Kebijakan Privasi'}
                        </span>
                    </nav>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                        {resolvedTitle}
                    </h1>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        {policy?.version && (
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                                Versi {policy.version}
                            </span>
                        )}
                        {policy?.effective_at && (
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                                Berlaku: {policy.effective_at}
                            </span>
                        )}
                    </div>

                    <div className="sticky top-20 z-10 -mx-2 mt-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-white/95 p-2 text-xs shadow-sm backdrop-blur">
                        <Link
                            href="/privacy-policy"
                            className={`rounded-full border px-3 py-1 transition ${
                                !isTermsPage
                                    ? 'border-sky-200 bg-sky-50 text-sky-700'
                                    : 'border-slate-200 text-slate-600 hover:border-sky-200 hover:text-sky-600'
                            }`}
                        >
                            Kebijakan Privasi
                        </Link>
                        <Link
                            href="/terms-and-conditions"
                            className={`rounded-full border px-3 py-1 transition ${
                                isTermsPage
                                    ? 'border-sky-200 bg-sky-50 text-sky-700'
                                    : 'border-slate-200 text-slate-600 hover:border-sky-200 hover:text-sky-600'
                            }`}
                        >
                            Syarat dan Ketentuan
                        </Link>
                    </div>

                    {policy ? (
                        <div className="mt-8 space-y-10">
                            {sectionOrder.map((section) =>
                                section === 'privacy-policy' ? (
                                    <section
                                        key={section}
                                        id="privacy-policy"
                                        className="scroll-mt-36 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-6"
                                    >
                                        <h2 className="text-xl font-semibold text-slate-900">
                                            Kebijakan Privasi
                                        </h2>
                                        <div
                                            className="prose prose-slate mt-4 max-w-none"
                                            dangerouslySetInnerHTML={{
                                                __html: policy.content,
                                            }}
                                        />
                                    </section>
                                ) : (
                                    <section
                                        key={section}
                                        id="terms"
                                        className="scroll-mt-36 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-6"
                                    >
                                        <h2 className="text-xl font-semibold text-slate-900">
                                            Syarat dan Ketentuan
                                        </h2>
                                        {policy.terms_content ? (
                                            <div
                                                className="prose prose-slate mt-4 max-w-none"
                                                dangerouslySetInnerHTML={{
                                                    __html: policy.terms_content,
                                                }}
                                            />
                                        ) : (
                                            <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                                                Syarat dan ketentuan belum tersedia.
                                            </div>
                                        )}
                                    </section>
                                ),
                            )}
                        </div>
                    ) : (
                        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                            Kebijakan privasi belum tersedia.
                        </div>
                    )}
                </div>
            </div>

            <PublicFooter />
        </PublicLayout>
    );
}
