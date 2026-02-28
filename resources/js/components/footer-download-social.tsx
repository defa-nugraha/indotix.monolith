import { cn } from '@/lib/utils';

const SOCIAL_ICONS = {
    facebook: 'https://cdn.simpleicons.org/facebook/1877F2',
    instagram: 'https://cdn.simpleicons.org/instagram/E4405F',
    twitter: 'https://cdn.simpleicons.org/x/000000',
    tiktok: 'https://cdn.simpleicons.org/tiktok/000000',
    youtube: 'https://cdn.simpleicons.org/youtube/FF0000',
};

type FooterDownloadSocialProps = {
    downloadUrl?: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    twitterUrl?: string | null;
    tiktokUrl?: string | null;
    youtubeUrl?: string | null;
    className?: string;
};

const sanitizeUrl = (value?: string | null) => {
    if (!value) return '#';
    return value.trim() === '' ? '#' : value;
};

const shouldOpenNewTab = (value?: string | null) => {
    if (!value) return false;
    const trimmed = value.trim();
    return trimmed !== '' && trimmed !== '#';
};

export function FooterDownloadSocial({
    downloadUrl,
    facebookUrl,
    instagramUrl,
    twitterUrl,
    tiktokUrl,
    youtubeUrl,
    className,
}: FooterDownloadSocialProps) {
    const links = [
        { key: 'facebook', label: 'Facebook', href: sanitizeUrl(facebookUrl), icon: SOCIAL_ICONS.facebook },
        { key: 'instagram', label: 'Instagram', href: sanitizeUrl(instagramUrl), icon: SOCIAL_ICONS.instagram },
        { key: 'twitter', label: 'X', href: sanitizeUrl(twitterUrl), icon: SOCIAL_ICONS.twitter },
        { key: 'tiktok', label: 'TikTok', href: sanitizeUrl(tiktokUrl), icon: SOCIAL_ICONS.tiktok },
        { key: 'youtube', label: 'YouTube', href: sanitizeUrl(youtubeUrl), icon: SOCIAL_ICONS.youtube },
    ];

    return (
        <div className={cn(className)}>
            <h4 className="text-sm font-semibold text-slate-900">Download Indotix</h4>
            <a
                href={sanitizeUrl(downloadUrl)}
                className="mt-3 inline-flex items-center"
                {...(shouldOpenNewTab(downloadUrl) ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
                <img
                    src="/images/playstore.png"
                    alt="Get it on Google Play"
                    className="h-12 w-auto object-contain"
                    loading="lazy"
                />
            </a>
            <h4 className="mt-6 text-sm font-semibold text-slate-900">Ikuti Kami</h4>
            <div className="mt-3 flex flex-wrap gap-2">
                {links.map((link) => (
                    <a
                        key={link.key}
                        href={link.href}
                        aria-label={link.label}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 transition hover:bg-slate-200"
                        {...(shouldOpenNewTab(link.href) ? { target: '_blank', rel: 'noreferrer' } : {})}
                    >
                        <img src={link.icon} alt={link.label} className="h-4 w-4" loading="lazy" />
                    </a>
                ))}
            </div>
        </div>
    );
}
