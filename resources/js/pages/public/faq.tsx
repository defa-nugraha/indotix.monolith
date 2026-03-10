import { Head, Link } from '@inertiajs/react';
import { BookOpen, CalendarCheck, MapPinned, ShoppingBag, Star, Ticket } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { FooterDownloadSocial } from '@/components/footer-download-social';

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
            <Head title="FAQ - Indotix">
                <meta
                    name="description"
                    content="Jawaban cepat untuk pertanyaan yang sering diajukan pengguna Indotix seputar booking, pembayaran, tiket, dan layanan."
                />
                <meta property="og:title" content="FAQ - Indotix" />
                <meta
                    property="og:description"
                    content="Jawaban cepat untuk pertanyaan yang sering diajukan pengguna Indotix seputar booking, pembayaran, tiket, dan layanan."
                />
                <meta property="og:type" content="website" />
            </Head>
            <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <nav className="text-xs text-slate-500">
                        <Link href="/" className="transition hover:text-sky-600">Beranda</Link>
                        <span className="mx-2">/</span>
                        <span className="text-slate-700">FAQ</span>
                    </nav>
                    <h1 className="text-3xl font-semibold text-slate-900">FAQ</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Jawaban cepat untuk pertanyaan yang sering diajukan pengguna Indotix.
                    </p>

                    <div className="mt-8 space-y-8">
                        {Object.keys(grouped).length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                Belum ada FAQ yang tersedia.
                            </div>
                        )}
                        {Object.entries(grouped).map(([category, items]) => (
                            <div key={category} className="space-y-4">
                                <h2 className="text-lg font-semibold text-slate-900">{category}</h2>
                                <div className="space-y-3">
                                    {items.map((faq) => (
                                        <details key={faq.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                                            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                                                {faq.question}
                                            </summary>
                                            <div
                                                className="prose prose-sm mt-3 max-w-none text-slate-700"
                                                dangerouslySetInnerHTML={{ __html: faq.answer }}
                                            />
                                        </details>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <Link href="/">
                            <img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" />
                        </Link>
                        <p className="mt-3 text-sm text-slate-600">
                            Neo Soho Capital 40th Floor<br />
                            Jl. Tanjung Duren Raya No 1<br />
                            Jakarta Barat, DKI Jakarta 11470
                        </p>
                        <p className="mt-4 text-sm text-slate-600">0812 9205 9888</p>
                        <p className="text-sm text-slate-600">info@indotix.co.id</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Layanan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Wisata</li>
                            <li>Special Program</li>
                            <li>Event</li>
                            <li>Hotel</li>
                            <li>Retail Shop</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Perusahaan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>
                                <Link href="/about" className="transition hover:text-sky-600">Tentang Kami</Link>
                            </li>
                            <li>
                                <Link href="/jelajah" className="transition hover:text-sky-600">Blog</Link>
                            </li>
                            <li>
                                <Link href="/faq" className="transition hover:text-sky-600">FAQ</Link>
                            </li>
                            <li>
                                <Link href="/privacy-policy" className="transition hover:text-sky-600">Kebijakan Privasi</Link>
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
