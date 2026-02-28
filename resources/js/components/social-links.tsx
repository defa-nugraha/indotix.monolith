type SocialLinksProps = {
    links?: {
        facebook?: string | null;
        instagram?: string | null;
        twitter?: string | null;
        tiktok?: string | null;
        youtube?: string | null;
    };
    className?: string;
};

const iconClass = "h-4 w-4";

export default function SocialLinks({ links, className }: SocialLinksProps) {
    const items = [
        {
            key: 'facebook',
            label: 'Facebook',
            href: links?.facebook ?? '#',
            icon: (
                <svg viewBox="0 0 20 20" className={iconClass} fill="currentColor" aria-hidden="true">
                    <path d="M18.896 0H1.104C.494 0 0 .494 0 1.104v17.792C0 19.506.494 20 1.104 20h9.581v-7.745H8.077V9.237h2.608V7.078c0-2.583 1.576-3.99 3.878-3.99 1.104 0 2.052.082 2.329.118v2.7h-1.598c-1.252 0-1.494.595-1.494 1.468v1.925h2.988l-.389 3.018h-2.599V20h5.098C19.506 20 20 19.506 20 18.896V1.104C20 .494 19.506 0 18.896 0z" />
                </svg>
            ),
        },
        {
            key: 'instagram',
            label: 'Instagram',
            href: links?.instagram ?? '#',
            icon: (
                <svg viewBox="0 0 20 20" className={iconClass} fill="currentColor" aria-hidden="true">
                    <path d="M10 2.7c2.084 0 2.332.008 3.154.046.82.038 1.374.176 1.695.294.426.166.73.365 1.05.685.32.32.519.624.685 1.05.118.321.256.875.294 1.695.038.822.046 1.07.046 3.154s-.008 2.332-.046 3.154c-.038.82-.176 1.374-.294 1.695a2.89 2.89 0 0 1-.685 1.05c-.32.32-.624.519-1.05.685-.321.118-.875.256-1.695.294-.822.038-1.07.046-3.154.046s-2.332-.008-3.154-.046c-.82-.038-1.374-.176-1.695-.294a2.89 2.89 0 0 1-1.05-.685 2.89 2.89 0 0 1-.685-1.05c-.118-.321-.256-.875-.294-1.695C2.708 12.332 2.7 12.084 2.7 10s.008-2.332.046-3.154c.038-.82.176-1.374.294-1.695.166-.426.365-.73.685-1.05.32-.32.624-.519 1.05-.685.321-.118.875-.256 1.695-.294C7.668 2.708 7.916 2.7 10 2.7M10 0C7.856 0 7.563.009 6.72.047c-.843.039-1.42.172-1.927.368a4.55 4.55 0 0 0-1.645 1.07A4.55 4.55 0 0 0 2.078 3.13c-.196.507-.329 1.084-.368 1.927C1.009 7.563 1 7.856 1 10s.009 2.437.047 3.28c.039.843.172 1.42.368 1.927.232.6.54 1.113 1.07 1.645.532.53 1.046.838 1.645 1.07.507.196 1.084.329 1.927.368.843.038 1.136.047 3.28.047s2.437-.009 3.28-.047c.843-.039 1.42-.172 1.927-.368.6-.232 1.113-.54 1.645-1.07.53-.532.838-1.046 1.07-1.645.196-.507.329-1.084.368-1.927.038-.843.047-1.136.047-3.28s-.009-2.437-.047-3.28c-.039-.843-.172-1.42-.368-1.927a4.55 4.55 0 0 0-1.07-1.645A4.55 4.55 0 0 0 15.134.415c-.507-.196-1.084-.329-1.927-.368C12.437.009 12.144 0 10 0zm0 4.865A5.135 5.135 0 1 0 10 15.135 5.135 5.135 0 0 0 10 4.865zm0 8.468A3.333 3.333 0 1 1 10 6.667a3.333 3.333 0 0 1 0 6.666zm5.337-8.995a1.2 1.2 0 1 1-1.2-1.2 1.2 1.2 0 0 1 1.2 1.2z" />
                </svg>
            ),
        },
        {
            key: 'twitter',
            label: 'X',
            href: links?.twitter ?? '#',
            icon: (
                <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2H21l-6.52 7.455L22 22h-6.828l-4.214-5.2L5.6 22H2l6.99-7.987L2 2h6.915l3.81 4.702L18.244 2zm-1.195 18h1.87L8.02 3.905H6.015L17.05 20z" />
                </svg>
            ),
        },
        {
            key: 'tiktok',
            label: 'TikTok',
            href: links?.tiktok ?? '#',
            icon: (
                <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
                    <path d="M16.5 3a4.5 4.5 0 0 0 4.5 4.5v3a7.5 7.5 0 0 1-4.5-1.5v6.5a5.5 5.5 0 1 1-5.5-5.5c.5 0 1 .07 1.5.2v3.1a2.5 2.5 0 1 0 1.5 2.3V3h2.5z" />
                </svg>
            ),
        },
        {
            key: 'youtube',
            label: 'YouTube',
            href: links?.youtube ?? '#',
            icon: (
                <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
                    <path d="M23 7.2s-.2-1.7-.8-2.4c-.8-.9-1.7-.9-2.1-1C16.9 3.5 12 3.5 12 3.5h0s-4.9 0-8.1.3c-.4.1-1.3.1-2.1 1C1.2 5.5 1 7.2 1 7.2S.8 9.1.8 11v1.9c0 1.9.2 3.8.2 3.8s.2 1.7.8 2.4c.8.9 1.9.9 2.4 1 1.7.2 7.8.3 7.8.3s4.9 0 8.1-.3c.4-.1 1.3-.1 2.1-1 .6-.7.8-2.4.8-2.4s.2-1.9.2-3.8V11c0-1.9-.2-3.8-.2-3.8zM9.8 15.1V8.9l6 3.1-6 3.1z" />
                </svg>
            ),
        },
    ];

    return (
        <div className={className ?? "mt-3 flex gap-2"}>
            {items.map((item) => (
                <a
                    key={item.key}
                    href={item.href}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-sky-200 hover:text-sky-600"
                    aria-label={item.label}
                >
                    {item.icon}
                </a>
            ))}
        </div>
    );
}
