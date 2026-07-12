import { Link } from '@inertiajs/react';
import {
    BookOpen,
    CalendarCheck,
    MapPinned,
    ShoppingBag,
    Star,
    Ticket,
} from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { FooterDownloadSocial } from '@/components/footer-download-social';
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
}: {
    policy: Policy | null;
}) {
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
                title={`${policy?.title ?? 'Kebijakan Privasi'} - Indotix`}
                description="Kebijakan privasi Indotix mengenai pengumpulan, penggunaan, penyimpanan, dan perlindungan data pribadi pengguna."
                canonicalPath="/privacy-policy"
                keywords={[
                    'kebijakan privasi Indotix',
                    'perlindungan data pengguna',
                ]}
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'WebPage',
                    name: policy?.title ?? 'Kebijakan Privasi Indotix',
                    url: '/privacy-policy',
                    dateModified: policy?.effective_at ?? undefined,
                }}
            />
            <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <nav className="text-xs text-slate-500">
                        <Link
                            href="/"
                            className="transition hover:text-sky-600"
                        >
                            Beranda
                        </Link>
                        <span className="mx-2">/</span>
                        <span className="text-slate-700">
                            Kebijakan Privasi
                        </span>
                    </nav>
                    <h1 className="text-3xl font-semibold text-slate-900">
                        {policy?.title ?? 'Kebijakan Privasi'}
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

                    <div className="mt-6 flex flex-wrap gap-2 text-xs">
                        <a
                            href="#privacy-policy"
                            className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-sky-200 hover:text-sky-600"
                        >
                            Kebijakan Privasi
                        </a>
                        <a
                            href="#terms"
                            className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-sky-200 hover:text-sky-600"
                        >
                            Syarat &amp; Ketentuan
                        </a>
                    </div>

                    {policy ? (
                        <div className="mt-8 space-y-10">
                            <section
                                id="privacy-policy"
                                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6"
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
                            <section
                                id="terms"
                                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6"
                            >
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Syarat &amp; Ketentuan
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
                                        Syarat &amp; ketentuan belum tersedia.
                                    </div>
                                )}
                            </section>
                        </div>
                    ) : (
                        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                            Kebijakan privasi belum tersedia.
                        </div>
                    )}
                </div>
            </div>

            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <Link href="/">
                            <img
                                src="/logo.png"
                                alt="Indotix"
                                className="h-11 w-36 object-contain"
                            />
                        </Link>
                        <p className="mt-3 text-sm text-slate-600">
                            Neo Soho Capital 40th Floor
                            <br />
                            Jl. Tanjung Duren Raya No 1<br />
                            Jakarta Barat, DKI Jakarta 11470
                        </p>
                        <p className="mt-4 text-sm text-slate-600">
                            0812 9205 9888
                        </p>
                        <p className="text-sm text-slate-600">
                            info@indotix.co.id
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                            Layanan
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Wisata</li>
                            <li>Special Program</li>
                            <li>Event</li>
                            <li>Hotel</li>
                            <li>Retail Shop</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                            Perusahaan
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>
                                <Link
                                    href="/about"
                                    className="transition hover:text-sky-600"
                                >
                                    Tentang Kami
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/jelajah"
                                    className="transition hover:text-sky-600"
                                >
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/faq"
                                    className="transition hover:text-sky-600"
                                >
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy-policy"
                                    className="transition hover:text-sky-600"
                                >
                                    Kebijakan Privasi
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <FooterDownloadSocial />
                </div>
                <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Indotix. All rights reserved.
                </div>
            </footer>
        </PublicLayout>
    );
}
