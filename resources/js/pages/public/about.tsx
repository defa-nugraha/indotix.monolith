import { Head, Link } from '@inertiajs/react';
import { BookOpen, CalendarCheck, MapPinned, ShoppingBag, Star, Ticket } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { FooterDownloadSocial } from '@/components/footer-download-social';

type AboutPage = {
    title: string;
    content: string;
} | null;

export default function AboutPage({ about }: { about: AboutPage }) {
    const categories = [
        { label: 'Wisata', icon: MapPinned, active: true, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Retail Shop', icon: ShoppingBag, href: '/souvenir' },
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
            <Head title="Tentang Kami - Indotix">
                <meta
                    name="description"
                    content="Kenali Indotix sebagai platform pemesanan wisata, hotel, event, special program, academy, dan retail shop di Indonesia."
                />
                <meta property="og:title" content="Tentang Kami - Indotix" />
                <meta
                    property="og:description"
                    content="Kenali Indotix sebagai platform pemesanan wisata, hotel, event, special program, academy, dan retail shop di Indonesia."
                />
                <meta property="og:type" content="website" />
            </Head>

            <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <nav className="text-xs text-slate-500">
                        <Link href="/" className="transition hover:text-sky-600">Beranda</Link>
                        <span className="mx-2">/</span>
                        <span className="text-slate-700">Tentang Kami</span>
                    </nav>
                    <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                        {about?.title ?? 'Tentang Indotix'}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Profil singkat Indotix dan komitmen layanan kami untuk perjalanan, event, dan pengalaman terbaik.
                    </p>

                    <div className="mt-6">
                        {about?.content ? (
                            <div
                                className="prose prose-slate max-w-none"
                                dangerouslySetInnerHTML={{ __html: about.content }}
                            />
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                Konten Tentang Kami belum tersedia.
                            </div>
                        )}
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
