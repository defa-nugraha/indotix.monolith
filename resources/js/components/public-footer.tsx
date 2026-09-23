import { Link } from '@inertiajs/react';
import { FooterAddress } from '@/components/footer-address';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import { cn } from '@/lib/utils';

export type PublicFooterContact = {
    company_name?: string | null;
    address?: string | null;
    address_html?: string | null;
    phone?: string | null;
    email?: string | null;
    download_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    twitter_url?: string | null;
    tiktok_url?: string | null;
    youtube_url?: string | null;
};

type Props = {
    contact?: PublicFooterContact | null;
    className?: string;
};

const footerLinkClass =
    'inline-flex min-h-9 items-center rounded-md py-1 text-sm text-slate-600 transition hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600';

export function PublicFooter({ contact, className }: Props) {
    const year = new Date().getFullYear();

    return (
        <footer
            className={cn(
                'mt-10 border-t border-slate-200 bg-white',
                className,
            )}
        >
            <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
                <div className="sm:col-span-2 lg:col-span-1">
                    <Link
                        href="/"
                        className="inline-flex min-h-11 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
                    >
                        <img
                            src="/logo.png"
                            alt="Indotix"
                            className="h-11 w-36 object-contain"
                        />
                    </Link>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                        {contact?.company_name ?? 'Indotix'}
                    </p>
                    <FooterAddress contact={contact} />
                    <div className="mt-4 space-y-1 text-sm text-slate-600">
                        <p>{contact?.phone ?? '0812 9205 9888'}</p>
                        <p className="break-all">
                            {contact?.email ?? 'info@indotix.co.id'}
                        </p>
                    </div>
                </div>

                <nav aria-label="Layanan Indotix">
                    <h4 className="text-sm font-semibold text-slate-900">
                        Layanan
                    </h4>
                    <ul className="mt-2 space-y-1">
                        <li>
                            <Link href="/wisata" className={footerLinkClass}>
                                Tiket Wisata
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/wisata?ticket_kind=package"
                                className={footerLinkClass}
                            >
                                Paket Wisata
                            </Link>
                        </li>
                        <li>
                            <Link href="/promo" className={footerLinkClass}>
                                Promo
                            </Link>
                        </li>
                        <li>
                            <Link href="/jelajah" className={footerLinkClass}>
                                Jelajah
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/panduan/mitra"
                                className={footerLinkClass}
                            >
                                Panduan Mitra
                            </Link>
                        </li>
                    </ul>
                </nav>

                <nav aria-label="Informasi perusahaan">
                    <h4 className="text-sm font-semibold text-slate-900">
                        Perusahaan
                    </h4>
                    <ul className="mt-2 space-y-1">
                        <li>
                            <Link href="/about" className={footerLinkClass}>
                                Tentang Kami
                            </Link>
                        </li>
                        <li>
                            <Link href="/faq" className={footerLinkClass}>
                                FAQ
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/terms-and-conditions"
                                className={footerLinkClass}
                            >
                                Syarat dan Ketentuan
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/privacy-policy"
                                className={footerLinkClass}
                            >
                                Kebijakan Privasi
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/delete-account"
                                className={footerLinkClass}
                            >
                                Penghapusan Akun
                            </Link>
                        </li>
                    </ul>
                </nav>

                <FooterDownloadSocial
                    downloadUrl={contact?.download_url}
                    facebookUrl={contact?.facebook_url}
                    instagramUrl={contact?.instagram_url}
                    twitterUrl={contact?.twitter_url}
                    tiktokUrl={contact?.tiktok_url}
                    youtubeUrl={contact?.youtube_url}
                />
            </div>
            <div className="border-t border-slate-200 px-4 py-4 text-center text-xs leading-5 text-slate-500">
                © {year} Indotix. All rights reserved.
            </div>
        </footer>
    );
}
