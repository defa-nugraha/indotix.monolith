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
import { PublicSeo } from '@/components/public-seo';
import {
    PublicFooter,
    PublicPartnerSection,
    PublicTrustSection,
    type PublicContact,
    type PublicPartner,
    type PublicTrustContent,
} from '@/components/public-page-sections';

type AboutPage = {
    title: string;
    content: string;
} | null;

export default function AboutPage({
    about,
    homeContent,
    contact,
    partners = [],
}: {
    about: AboutPage;
    homeContent?: PublicTrustContent | null;
    contact?: PublicContact | null;
    partners?: PublicPartner[];
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
                title={`${about?.title ?? 'Tentang Kami'} - Indotix`}
                description="Kenali Indotix sebagai platform pemesanan wisata, hotel, event, special program, academy, dan retail shop di Indonesia."
                canonicalPath="/about"
                keywords={[
                    'tentang Indotix',
                    'platform tiket Indonesia',
                    'booking wisata',
                ]}
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'AboutPage',
                    name: about?.title ?? 'Tentang Indotix',
                    url: '/about',
                    isPartOf: {
                        '@type': 'WebSite',
                        name: 'Indotix',
                    },
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
                        <span className="text-slate-700">Tentang Kami</span>
                    </nav>
                    <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                        {about?.title ?? 'Tentang Indotix'}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Profil singkat Indotix dan komitmen layanan kami untuk
                        perjalanan, event, dan pengalaman terbaik.
                    </p>

                    <div className="mt-6">
                        {about?.content ? (
                            <div
                                className="prose prose-slate max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: about.content,
                                }}
                            />
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                Konten Tentang Kami belum tersedia.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PublicPartnerSection partners={partners} />
            <PublicTrustSection homeContent={homeContent} contact={contact} />
            <PublicFooter contact={contact} />
        </PublicLayout>
    );
}
