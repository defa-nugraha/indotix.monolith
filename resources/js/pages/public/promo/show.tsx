import { Link } from '@inertiajs/react';
import {
    BadgePercent,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Gift,
    ShieldCheck,
} from 'lucide-react';
import { PublicSeo } from '@/components/public-seo';
import PublicLayout from '@/layouts/public-layout';

type Promo = {
    id: number;
    title?: string | null;
    slug?: string | null;
    category?: string | null;
    category_label?: string | null;
    excerpt?: string | null;
    description?: string | null;
    terms?: string | null;
    image_url: string;
    link_url?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
};

const formatDate = (value?: string | null) => {
    if (!value) {
        return null;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(value));
};

const promoPeriod = (promo: Promo) => {
    const start = formatDate(promo.starts_at);
    const end = formatDate(promo.ends_at);

    if (start && end) {
        return `${start} - ${end}`;
    }

    if (end) {
        return `Berlaku sampai ${end}`;
    }

    return 'Berlaku selama promo aktif';
};

const paragraphLines = (value?: string | null) =>
    (value ?? '')
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

export default function PromoShow({
    promo,
    relatedPromos = [],
}: {
    promo: Promo;
    relatedPromos?: Promo[];
}) {
    const title = promo.title ?? 'Promo Indotix';
    const description =
        promo.excerpt ??
        promo.description ??
        'Lihat detail promo dan penawaran aktif dari Indotix.';
    const ctaUrl = promo.link_url?.trim() || '/wisata';
    const isExternalCta = /^https?:\/\//i.test(ctaUrl);
    const descriptionLines = paragraphLines(promo.description);
    const termsLines = paragraphLines(promo.terms);

    return (
        <PublicLayout>
            <PublicSeo
                title={`${title} - Promo Indotix`}
                description={description}
                canonicalPath={promo.slug ? `/promo/${promo.slug}` : '/promo'}
                image={promo.image_url}
                keywords={[
                    'promo Indotix',
                    promo.category_label ?? 'promo wisata',
                    title,
                ]}
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'Offer',
                    name: title,
                    description,
                    image: promo.image_url,
                    validFrom: promo.starts_at ?? undefined,
                    validThrough: promo.ends_at ?? undefined,
                    availability: 'https://schema.org/InStock',
                }}
            />

            <main className="bg-[#f4f6f8] pb-16">
                <section className="relative bg-[#f4f6f8] text-white">
                    <div className="absolute inset-x-0 top-0 h-[clamp(190px,22vw,250px)] overflow-hidden rounded-b-[2.75rem] bg-[#06a6d7]">
                        <div className="absolute inset-x-0 top-0 h-full bg-[#008fc8]/45" />
                        <div className="absolute -top-28 -left-24 h-80 w-80 rounded-full bg-sky-800/20" />
                        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-cyan-300/25" />
                        {[
                            ['12%', '58%', '#facc15', '14deg'],
                            ['18%', '21%', '#38d9e6', '-18deg'],
                            ['36%', '17%', '#fde047', '8deg'],
                            ['51%', '16%', '#ec4899', '12deg'],
                            ['60%', '34%', '#fbbf24', '-24deg'],
                            ['78%', '20%', '#fde047', '18deg'],
                            ['88%', '54%', '#f97316', '10deg'],
                        ].map(([left, top, color, rotate]) => (
                            <span
                                key={`${left}-${top}`}
                                className="absolute h-3 w-9 rounded-full opacity-90"
                                style={{
                                    left,
                                    top,
                                    backgroundColor: color,
                                    transform: `rotate(${rotate})`,
                                }}
                            />
                        ))}
                    </div>

                    <div className="relative mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
                        <Link
                            href="/promo"
                            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white ring-1 ring-white/25 transition hover:bg-white/20"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Kembali ke promo
                        </Link>

                        <div className="mt-8 overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.4)]">
                            <div className="grid min-h-[280px] lg:grid-cols-[1.35fr_1fr]">
                                <div className="relative overflow-hidden bg-[#0aa8e8] px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
                                    <div className="absolute -right-28 top-0 h-full w-80 rounded-l-[100%] bg-[#0795cf]" />
                                    <div className="absolute -right-16 bottom-0 h-44 w-80 -rotate-12 bg-[#008b97]/45" />
                                    <div className="relative z-10">
                                        <div className="inline-flex h-14 min-w-24 items-center justify-center rounded-r-full bg-white px-5 text-teal-600 shadow-sm">
                                            <BadgePercent className="h-7 w-7" />
                                        </div>
                                        <p className="mt-7 text-xs font-black tracking-[0.24em] text-white/80 uppercase">
                                            {promo.category_label ??
                                                'Promo Indotix'}
                                        </p>
                                        <h1 className="mt-3 max-w-2xl font-['Space_Grotesk'] text-3xl leading-tight font-black tracking-tight text-white sm:text-5xl">
                                            {title}
                                        </h1>
                                        <p className="mt-5 max-w-2xl text-base leading-7 font-bold text-white/90 sm:text-xl">
                                            {description}
                                        </p>
                                        <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/25 sm:text-sm">
                                            <CalendarDays className="h-4 w-4" />
                                            {promoPeriod(promo)}
                                        </div>
                                    </div>
                                </div>

                                <div className="relative min-h-[230px] overflow-hidden bg-slate-100">
                                    <img
                                        src={promo.image_url}
                                        alt={title}
                                        className="absolute inset-0 h-full w-full object-cover"
                                        loading="eager"
                                        decoding="async"
                                    />
                                    <div className="absolute right-0 bottom-0 h-24 w-72 rounded-tl-[100%] bg-teal-700/80" />
                                    <span className="absolute right-5 bottom-5 text-[10px] font-bold text-white/85">
                                        *S&K berlaku
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto grid max-w-7xl gap-6 px-4 pt-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
                    <div className="space-y-6">
                        <article className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Gift className="h-6 w-6 text-sky-600" />
                                <h2 className="font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950">
                                    Detail promo
                                </h2>
                            </div>
                            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                                {descriptionLines.length > 0 ? (
                                    descriptionLines.map((line) => (
                                        <p key={line}>{line}</p>
                                    ))
                                ) : (
                                    <p>
                                        Promo ini sedang aktif. Pilih destinasi
                                        wisata, lalu gunakan penawaran yang
                                        tersedia sesuai syarat promo.
                                    </p>
                                )}
                            </div>
                        </article>

                        <article className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-6 w-6 text-sky-600" />
                                <h2 className="font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950">
                                    Syarat dan ketentuan
                                </h2>
                            </div>
                            {termsLines.length > 0 ? (
                                <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                                    {termsLines.map((line) => (
                                        <li
                                            key={line}
                                            className="flex gap-3"
                                        >
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600" />
                                            <span>{line}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-5 text-sm leading-7 text-slate-600">
                                    Promo berlaku selama periode aktif, kuota
                                    tersedia, dan mengikuti ketentuan pemesanan
                                    yang berlaku di Indotix.
                                </p>
                            )}
                        </article>
                    </div>

                    <aside className="h-fit rounded-[2rem] border border-sky-100 bg-white p-5 shadow-sm lg:sticky lg:top-28">
                        <p className="text-xs font-black tracking-wider text-sky-600 uppercase">
                            Siap digunakan?
                        </p>
                        <h2 className="mt-2 text-xl font-black text-slate-950">
                            Gunakan promo ini untuk pesan tiket wisata
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Lanjutkan ke produk yang dituju atau mulai dari
                            daftar destinasi wisata Indotix.
                        </p>
                        {isExternalCta ? (
                            <a
                                href={ctaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-700"
                            >
                                Buka promo
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        ) : (
                            <Link
                                href={ctaUrl}
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-700"
                            >
                                Buka promo
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        )}
                        <Link
                            href="/wisata"
                            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                        >
                            Lihat semua wisata
                        </Link>
                    </aside>
                </section>

                {relatedPromos.length > 0 && (
                    <section className="mx-auto max-w-7xl space-y-5 px-4 pt-10 sm:px-6 lg:px-8">
                        <h2 className="font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950">
                            Promo lain di kategori ini
                        </h2>
                        <div className="grid gap-5 md:grid-cols-3">
                            {relatedPromos.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.slug ? `/promo/${item.slug}` : '/promo'}
                                    className="group overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="h-36 bg-slate-100">
                                        <img
                                            src={item.image_url}
                                            alt={item.title ?? 'Promo Indotix'}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <p className="text-[10px] font-black tracking-wider text-sky-600 uppercase">
                                            {item.category_label ??
                                                'Promo Indotix'}
                                        </p>
                                        <h3 className="mt-1 line-clamp-2 text-sm font-black text-slate-950">
                                            {item.title ?? 'Promo Indotix'}
                                        </h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </PublicLayout>
    );
}
