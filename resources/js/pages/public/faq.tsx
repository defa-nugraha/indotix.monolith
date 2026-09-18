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

type Faq = {
    id: number;
    question: string;
    answer: string;
    category: string | null;
};

export default function FaqPage({ faqs = [] }: { faqs: Faq[] }) {
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

    const grouped = faqs.reduce<Record<string, Faq[]>>((acc, item) => {
        const key = item.category?.trim() || 'Umum';
        acc[key] = acc[key] ?? [];
        acc[key].push(item);
        return acc;
    }, {});

    return (
        <PublicLayout categories={categories} chips={chips}>
            <PublicSeo
                title="Pertanyaan Umum (FAQ) - Indotix"
                description="Jawaban cepat untuk pertanyaan yang sering diajukan pengguna Indotix seputar booking, pembayaran, tiket, dan layanan."
                canonicalPath="/faq"
                keywords={[
                    'FAQ Indotix',
                    'bantuan booking tiket',
                    'bantuan pembayaran',
                ]}
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: faqs.map((faq) => ({
                        '@type': 'Question',
                        name: faq.question,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: faq.answer,
                        },
                    })),
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
                        <span className="text-slate-700">FAQ</span>
                    </nav>
                    <h1 className="text-3xl font-semibold text-slate-900">
                        FAQ
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Jawaban cepat untuk pertanyaan yang sering diajukan
                        pengguna Indotix.
                    </p>

                    <div className="mt-8 space-y-8">
                        {Object.keys(grouped).length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                Belum ada FAQ yang tersedia.
                            </div>
                        )}
                        {Object.entries(grouped).map(([category, items]) => (
                            <div key={category} className="space-y-4">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {category}
                                </h2>
                                <div className="space-y-3">
                                    {items.map((faq) => (
                                        <details
                                            key={faq.id}
                                            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                                        >
                                            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                                                {faq.question}
                                            </summary>
                                            <div
                                                className="prose prose-sm mt-3 max-w-none text-slate-700"
                                                dangerouslySetInnerHTML={{
                                                    __html: faq.answer,
                                                }}
                                            />
                                        </details>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <PublicFooter />
        </PublicLayout>
    );
}
