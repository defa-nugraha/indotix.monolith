import { Link } from '@inertiajs/react';
import {
    Award,
    BadgePercent,
    Bell,
    BookOpen,
    Compass,
    Download,
    Droplets,
    Gift,
    Globe,
    GraduationCap,
    Home as HomeIcon,
    Landmark,
    MapPin,
    Mountain,
    Navigation,
    RefreshCcw,
    ShieldCheck,
    Sparkles,
    Ticket,
    Trees,
    Utensils,
    Users,
    Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FooterDownloadSocial } from '@/components/footer-download-social';

export type PublicContact = {
    company_name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    download_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    twitter_url?: string | null;
    tiktok_url?: string | null;
    youtube_url?: string | null;
};

export type PublicTrustContent = {
    trust?: {
        eyebrow?: string;
        title?: string;
        badges?: { icon?: string | null; text: string }[];
        cta_label?: string;
        cards?: { icon?: string | null; title: string; description: string }[];
    };
    part_of?: {
        eyebrow?: string;
        title?: string;
        description?: string;
        logos?: PublicPartner[];
        stats?: { icon?: string | null; value: string; label: string }[];
    };
};

export type PublicPartner = {
    id: number | string;
    name?: string | null;
    image_url?: string | null;
    link_url?: string | null;
};

const iconMap = {
    BadgePercent,
    Gift,
    Navigation,
    BookOpen,
    ShieldCheck,
    Ticket,
    Bell,
    RefreshCcw,
    MapPin,
    Sparkles,
    Mountain,
    Landmark,
    GraduationCap,
    Utensils,
    HomeIcon,
    Waves,
    Trees,
    Droplets,
    Compass,
    Users,
    Globe,
    Award,
} satisfies Record<string, LucideIcon>;

const defaultTrust = {
    eyebrow: 'Kenapa pesan di Indotix?',
    title: 'Tiket wisata lebih mudah, aman, dan praktis',
    badges: [
        { icon: 'ShieldCheck', text: 'Transaksi aman' },
        { icon: 'Ticket', text: 'E-tiket praktis' },
    ],
    cta_label: 'Download Aplikasi Indotix',
    cards: [
        {
            icon: 'BadgePercent',
            title: 'Promo khusus aplikasi',
            description:
                'Dapatkan info promo dan voucher aktif langsung dari aplikasi Indotix.',
        },
        {
            icon: 'RefreshCcw',
            title: 'Bantuan pesanan lebih mudah',
            description:
                'Pantau status tiket dan kebutuhan perjalanan dalam satu tempat.',
        },
        {
            icon: 'Bell',
            title: 'Notifikasi instan',
            description:
                'Terima update pesanan, e-tiket, dan informasi penting secara langsung.',
        },
    ],
};

const resolveIcon = (icon: string | null | undefined, fallback: LucideIcon) =>
    iconMap[icon as keyof typeof iconMap] ?? fallback;

const normalizePublicLinkUrl = (value: string | null | undefined) => {
    const path = value?.trim();
    if (!path) {
        return null;
    }

    if (path.startsWith('http') || path.startsWith('/')) {
        return path;
    }

    return `/${path}`;
};

export function PublicPartnerSection({
    partners = [],
}: {
    partners?: PublicPartner[];
}) {
    if (partners.length === 0) {
        return null;
    }

    const minimumRepeatCount = Math.max(2, Math.ceil(10 / partners.length));
    const repeatCount =
        minimumRepeatCount % 2 === 0
            ? minimumRepeatCount
            : minimumRepeatCount + 1;
    const marqueeItems = Array.from({ length: repeatCount }).flatMap(
        () => partners,
    );

    return (
        <section
            className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-sky-100/70 bg-gradient-to-b from-white via-sky-50/70 to-white py-8 sm:py-10"
            aria-label="Partner Kami"
        >
            <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
                <h2 className="font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    Partner Kami
                </h2>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                    Bersama mitra pilihan untuk menghadirkan pengalaman wisata
                    yang lebih mudah, aman, dan nyaman.
                </p>
            </div>
            <div className="relative mt-7 overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-sky-50 via-sky-50/80 to-transparent sm:w-36" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-sky-50 via-sky-50/80 to-transparent sm:w-36" />
                <div className="partner-logo-marquee flex min-w-max items-center gap-10 pr-10 sm:gap-14 sm:pr-14">
                    {marqueeItems.map((partner, index) => {
                        const logo = partner.image_url ? (
                            <img
                                src={partner.image_url}
                                alt={partner.name ?? 'Partner Indotix'}
                                className="h-14 w-auto max-w-[13rem] object-contain opacity-90 grayscale-[20%] transition duration-200 hover:opacity-100 hover:grayscale-0 sm:h-16 sm:max-w-[15rem]"
                                loading="lazy"
                            />
                        ) : (
                            <span className="text-2xl font-black tracking-tight whitespace-nowrap text-slate-600 opacity-90 sm:text-3xl">
                                {partner.name ?? 'Partner Indotix'}
                            </span>
                        );

                        if (partner.link_url) {
                            return (
                                <a
                                    key={`${partner.id}-${index}`}
                                    href={
                                        normalizePublicLinkUrl(
                                            partner.link_url,
                                        ) ?? '#'
                                    }
                                    target={
                                        partner.link_url.startsWith('http')
                                            ? '_blank'
                                            : undefined
                                    }
                                    rel={
                                        partner.link_url.startsWith('http')
                                            ? 'noreferrer'
                                            : undefined
                                    }
                                    className="flex h-24 min-w-[12rem] shrink-0 items-center justify-center rounded-[1.75rem] border border-white/80 bg-white/90 px-6 shadow-sm ring-1 ring-sky-100/70 transition hover:-translate-y-0.5 hover:shadow-md sm:min-w-[14rem]"
                                >
                                    {logo}
                                </a>
                            );
                        }

                        return (
                            <div
                                key={`${partner.id}-${index}`}
                                className="flex h-24 min-w-[12rem] shrink-0 items-center justify-center rounded-[1.75rem] border border-white/80 bg-white/90 px-6 shadow-sm ring-1 ring-sky-100/70 sm:min-w-[14rem]"
                            >
                                {logo}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

const repeatedPartnerRow = (items: PublicPartner[], minimum = 8) => {
    if (items.length === 0) {
        return [];
    }

    const minimumRepeatCount = Math.max(2, Math.ceil(minimum / items.length));
    const repeatCount =
        minimumRepeatCount % 2 === 0
            ? minimumRepeatCount
            : minimumRepeatCount + 1;

    return Array.from({ length: repeatCount }).flatMap(() => items);
};

export function PublicPartOfSection({
    homeContent,
}: {
    homeContent?: PublicTrustContent | null;
}) {
    const partOf = {
        eyebrow: 'Part of',
        title: 'El John Group',
        description:
            'Indotix adalah bagian dari ekosistem El John Group di berbagai industri.',
        ...(homeContent?.part_of ?? {}),
    };
    const logos = homeContent?.part_of?.logos ?? [];

    if (logos.length === 0) {
        return null;
    }

    const topRow = repeatedPartnerRow(logos);
    const renderLogo = (partner: PublicPartner, index: number) => {
        const logo = partner.image_url ? (
            <img
                src={partner.image_url}
                alt={partner.name ?? 'Logo El John Group'}
                className="h-12 w-auto max-w-[10rem] object-contain sm:h-14 sm:max-w-[12rem]"
                loading="lazy"
            />
        ) : (
            <span className="text-base font-black tracking-tight text-slate-600 sm:text-lg">
                {partner.name ?? 'El John Group'}
            </span>
        );

        return (
            <div
                key={`${partner.id}-${index}`}
                className="flex h-16 min-w-[10.5rem] shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-white px-5 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.65)] sm:h-20 sm:min-w-[12.5rem]"
            >
                {logo}
            </div>
        );
    };

    return (
        <section
            className="relative mx-auto mt-6 max-w-7xl overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/70 to-white px-4 py-7 shadow-sm sm:px-8 sm:py-9"
            aria-label={partOf.title}
        >
            <div className="pointer-events-none absolute inset-y-8 right-0 hidden w-72 opacity-45 lg:block">
                <div className="absolute right-6 bottom-14 h-44 w-44 rotate-45 border border-sky-200/80" />
                <div className="absolute right-20 bottom-20 h-52 w-28 rotate-12 border border-sky-100 bg-sky-100/30" />
                <div className="absolute right-0 bottom-0 h-28 w-72 bg-gradient-to-t from-sky-100/70 to-transparent" />
            </div>

            <div className="relative text-center">
                <div className="mx-auto flex w-fit items-center gap-3 text-sm font-black text-sky-500">
                    <span className="h-px w-8 bg-sky-200" />
                    {partOf.eyebrow}
                    <span className="h-px w-8 bg-sky-200" />
                </div>
                <h2 className="mt-2 font-['Space_Grotesk'] text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    {partOf.title}
                </h2>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 font-medium text-slate-600 sm:text-base">
                    {partOf.description}
                </p>
            </div>

            <div className="relative mt-6 overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-sky-50 to-transparent sm:w-28" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-sky-50 to-transparent sm:w-28" />
                <div className="part-of-logo-marquee flex min-w-max items-center gap-4 pr-4 sm:gap-5 sm:pr-5">
                    {topRow.map(renderLogo)}
                </div>
            </div>

        </section>
    );
}

export function PublicTrustSection({
    homeContent,
    contact,
}: {
    homeContent?: PublicTrustContent | null;
    contact?: PublicContact | null;
}) {
    const trust = {
        ...defaultTrust,
        ...(homeContent?.trust ?? {}),
        badges: homeContent?.trust?.badges?.length
            ? homeContent.trust.badges
            : defaultTrust.badges,
        cards: homeContent?.trust?.cards?.length
            ? homeContent.trust.cards
            : defaultTrust.cards,
    };
    const downloadAppUrl = contact?.download_url?.trim() || '#';
    const downloadLinkAttributes =
        downloadAppUrl !== '#' ? { target: '_blank', rel: 'noreferrer' } : {};

    return (
        <section className="relative left-1/2 w-screen -translate-x-1/2 bg-[url('/images/backgroun-section.png')] bg-[length:calc(100%+96px)_calc(100%+48px)] bg-center bg-no-repeat py-8 sm:py-10">
            <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.85fr_2fr] lg:items-center lg:px-8">
                <div>
                    <p className="text-base font-black text-slate-950 sm:text-lg">
                        {trust.eyebrow}
                    </p>
                    <h2 className="mt-5 font-['Space_Grotesk'] text-2xl leading-tight font-black tracking-tight text-slate-950 sm:text-3xl">
                        {trust.title}
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
                        {trust.badges.map((badge) => {
                            const BadgeIcon = resolveIcon(
                                badge.icon,
                                ShieldCheck,
                            );

                            return (
                                <span
                                    key={`${badge.icon}-${badge.text}`}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm ring-1 ring-sky-100"
                                >
                                    <BadgeIcon className="h-4 w-4 text-sky-600" />
                                    {badge.text}
                                </span>
                            );
                        })}
                    </div>
                    <a
                        href={downloadAppUrl}
                        {...downloadLinkAttributes}
                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-sky-700"
                    >
                        {trust.cta_label}
                        <Download className="h-4 w-4" />
                    </a>
                </div>

                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] md:grid md:snap-none md:grid-cols-3 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
                    {trust.cards.map((item) => {
                        const Icon = resolveIcon(item.icon, BadgePercent);

                        return (
                            <article
                                key={item.title}
                                className="flex w-[72vw] max-w-[20rem] min-w-[16rem] shrink-0 snap-start gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5 md:w-auto md:max-w-none md:min-w-0"
                            >
                                <Icon className="mt-1 h-9 w-9 shrink-0 text-sky-600" />
                                <div>
                                    <h3 className="text-sm font-black text-slate-950">
                                        {item.title}
                                    </h3>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                        {item.description}
                                    </p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export function PublicFooter({ contact }: { contact?: PublicContact | null }) {
    const companyName = contact?.company_name?.trim() || 'Indotix';
    const addressText =
        contact?.address ??
        'Neo Soho Capital 40th Floor\nJl. Tanjung Duren Raya No 1\nJakarta Barat, DKI Jakarta 11470';
    const addressLines = addressText.split('\n');

    return (
        <footer className="mt-0 border-t border-slate-200 bg-white">
            <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                <div>
                    <Link href="/">
                        <img
                            src="/logo.png"
                            alt="Indotix"
                            className="h-11 w-36 object-contain"
                        />
                    </Link>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                        {companyName}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                        {addressLines.map((line, index) => (
                            <span key={line}>
                                {line}
                                {index < addressLines.length - 1 && <br />}
                            </span>
                        ))}
                    </p>
                    <p className="mt-4 text-sm text-slate-600">
                        {contact?.phone ?? '0812 9205 9888'}
                    </p>
                    <p className="text-sm text-slate-600">
                        {contact?.email ?? 'info@indotix.co.id'}
                    </p>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                        Layanan
                    </h4>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        <li>Wisata</li>
                        <li>Tiket destinasi</li>
                        <li>Taman hiburan</li>
                        <li>Wisata keluarga</li>
                        <li>Wisata edukasi</li>
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
                                href="/terms-and-conditions"
                                className="transition hover:text-sky-600"
                            >
                                Syarat dan Ketentuan
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
                <FooterDownloadSocial
                    downloadUrl={contact?.download_url}
                    facebookUrl={contact?.facebook_url}
                    instagramUrl={contact?.instagram_url}
                    twitterUrl={contact?.twitter_url}
                    tiktokUrl={contact?.tiktok_url}
                    youtubeUrl={contact?.youtube_url}
                />
            </div>
            <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                © 2025 Indotix. All rights reserved.
            </div>
        </footer>
    );
}
