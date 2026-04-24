import {
    ArrowRight,
    ArrowUpRight,
    Clock3,
    MapPinned,
    Sparkles,
    Star,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DiscoveryExperienceItem = {
    id: string;
    title?: string | null;
    name?: string | null;
    image?: string | null;
    image_url?: string | null;
    badge?: string | null;
    price_label?: string | null;
    tags?: string[];
    metadata?: {
        city?: string | null;
        location?: string | null;
        date?: string | null;
        category?: string | null;
        rating?: number | null;
    };
    cta?: {
        label?: string | null;
        url?: string | null;
    };
};

export type DiscoveryExperienceSection = {
    key: string;
    title: string;
    description?: string | null;
    items: DiscoveryExperienceItem[];
};

export type DiscoveryIntentChip = {
    label: string;
    query?: string | null;
    filters?: Record<string, string> | null;
};

export type DiscoveryEditorial = {
    eyebrow?: string | null;
    title?: string | null;
    description?: string | null;
};

export type DiscoveryExperiencePayload = {
    editorial?: DiscoveryEditorial | null;
    intent_chips?: DiscoveryIntentChip[];
    quick_categories?: Array<{ label: string; value?: string }>;
    featured?: {
        title?: string | null;
        description?: string | null;
        items?: DiscoveryExperienceItem[];
    } | null;
    sections?: DiscoveryExperienceSection[];
    popular_keywords?: string[];
    empty_state?: {
        title?: string | null;
        message?: string | null;
        recommended_keywords?: string[];
    } | null;
};

export type DiscoveryTheme = {
    badge: string;
    title: string;
    description: string;
    accent: string;
    icon: LucideIcon;
    gradientClassName: string;
    surfaceClassName?: string;
};

function itemTitle(item: DiscoveryExperienceItem): string {
    return item.title ?? item.name ?? 'Produk pilihan';
}

function itemImage(item: DiscoveryExperienceItem): string {
    return item.image_url ?? item.image ?? '/images/placeholder-card.jpg';
}

function itemMeta(item: DiscoveryExperienceItem): string[] {
    return [
        item.metadata?.city,
        item.metadata?.location,
        item.metadata?.date,
        item.metadata?.category,
    ].filter((value): value is string => Boolean(value));
}

export function DiscoveryStoryHero({
    theme,
    editorial,
    quickCategories,
    totalLabel,
}: {
    theme: DiscoveryTheme;
    editorial?: DiscoveryEditorial | null;
    quickCategories?: Array<{ label: string; value?: string }>;
    totalLabel?: string;
}) {
    const Icon = theme.icon;
    const pills = (quickCategories ?? []).slice(0, 5);

    return (
        <section
            className={cn(
                'relative overflow-hidden rounded-[32px] border border-white/20 p-6 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] md:p-8',
                theme.gradientClassName,
            )}
        >
            <div className="pointer-events-none absolute -top-12 right-8 h-40 w-40 rounded-full bg-white/12 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-4 h-36 w-36 rounded-full bg-black/10 blur-3xl" />
            <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.18em] uppercase text-white/90">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{editorial?.eyebrow ?? theme.badge}</span>
                    </div>
                    <h1 className="mt-4 max-w-3xl font-['Space_Grotesk'] text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
                        {editorial?.title ?? theme.title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/86 sm:text-base">
                        {editorial?.description ?? theme.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {pills.map((item) => (
                            <span
                                key={item.label}
                                className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/92"
                            >
                                {item.label}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-3xl border border-white/18 bg-white/10 p-4 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14 text-white">
                                <Icon className="h-6 w-6" />
                            </div>
                            <Star className="h-5 w-5 text-white/75" />
                        </div>
                        <p className="mt-4 text-sm font-bold">Discovery lebih hidup</p>
                        <p className="mt-1 text-xs leading-5 text-white/80">
                            Gunakan spotlight, intent, dan koleksi tematik untuk mulai eksplorasi.
                        </p>
                    </div>
                    <div className="rounded-3xl border border-white/18 bg-black/10 p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-white/85">
                            <Clock3 className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                                Contextual
                            </span>
                        </div>
                        <p className="mt-3 text-sm font-bold">Masuk dari kebutuhan</p>
                        <p className="mt-1 text-xs leading-5 text-white/80">
                            Bukan hanya keyword: mulai dari gratis, populer, kota, atau momen terdekat.
                        </p>
                    </div>
                    <div className="rounded-3xl border border-white/18 bg-white/8 p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-white/85">
                            <MapPinned className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                                Pilihan Saat Ini
                            </span>
                        </div>
                        <p className="mt-3 text-xl font-semibold">
                            {totalLabel ?? 'Discovery mode aktif'}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-white/80">
                            Hasil, rekomendasi, dan koleksi tetap terasa terarah tanpa membuat halaman terasa seperti katalog datar.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function DiscoveryIntentRow({
    chips,
    onSelect,
    className,
}: {
    chips: DiscoveryIntentChip[];
    onSelect: (chip: DiscoveryIntentChip) => void;
    className?: string;
}) {
    if (chips.length === 0) return null;

    return (
        <section className={cn('space-y-3', className)}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-bold text-slate-900">Mulai dari intent</p>
                    <p className="text-xs text-slate-500">
                        Bantu user masuk dari kebutuhan, bukan dari keyword teknis.
                    </p>
                </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {chips.map((chip) => (
                    <button
                        key={chip.label}
                        type="button"
                        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                        onClick={() => onSelect(chip)}
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>{chip.label}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}

export function DiscoveryFeaturedShowcase({
    section,
    theme,
}: {
    section?: {
        title?: string | null;
        description?: string | null;
        items?: DiscoveryExperienceItem[];
    } | null;
    theme: DiscoveryTheme;
}) {
    const featured = section?.items?.[0];
    if (!featured) return null;
    const meta = itemMeta(featured).slice(0, 3);
    const spotlightCards = [
        ...(featured.badge
            ? [
                  {
                      label: 'Highlight',
                      value: featured.badge,
                      tone: theme.surfaceClassName ?? 'bg-sky-50 text-sky-700',
                  },
              ]
            : []),
        ...meta.map((entry, index) => ({
            label: index === 0 ? 'Konteks' : index === 1 ? 'Detail' : 'Info',
            value: entry,
            tone: 'bg-slate-50 text-slate-700',
        })),
    ].slice(0, 3);

    return (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-start">
            <div className="flex h-fit flex-col gap-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.28)] sm:p-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-slate-400 uppercase">
                        <Sparkles className="h-4 w-4" />
                        <span>{section?.title ?? 'Pilihan utama'}</span>
                    </div>
                    <h2 className="mt-3 font-['Space_Grotesk'] text-2xl font-semibold text-slate-900 sm:text-3xl">
                        {itemTitle(featured)}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        {section?.description ?? 'Mulai eksplorasi dari item yang paling kuat membuka minat user.'}
                    </p>
                </div>

                {spotlightCards.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-3">
                        {spotlightCards.map((card) => (
                            <div
                                key={`${card.label}-${card.value}`}
                                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                            >
                                <p className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                                    {card.label}
                                </p>
                                <div className="mt-2">
                                    <span
                                        className={cn(
                                            'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                                            card.tone,
                                        )}
                                    >
                                        {card.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {(featured.tags ?? []).slice(0, 4).map((tag) => (
                        <span
                            key={tag}
                            className={cn(
                                'rounded-full px-3 py-1 text-xs font-semibold',
                                theme.surfaceClassName ?? 'bg-sky-50 text-sky-700',
                            )}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
                    <div>
                        <p className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                            Mulai dari
                        </p>
                        <span className="mt-2 block text-lg font-semibold text-slate-900 sm:text-[1.75rem]">
                            {featured.price_label ?? 'Lihat detail'}
                        </span>
                    </div>
                    {featured.cta?.url && (
                        <a
                            href={featured.cta.url}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-105',
                                theme.accent,
                            )}
                        >
                            <span>{featured.cta?.label ?? 'Lihat Detail'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </a>
                    )}
                </div>
            </div>
            <div className="relative min-h-[360px] overflow-hidden rounded-[30px] border border-slate-200 bg-slate-900 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.4)] sm:min-h-[440px] xl:min-h-[560px]">
                <img
                    src={itemImage(featured)}
                    alt={itemTitle(featured)}
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/26 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 rounded-[28px] border border-white/14 bg-black/32 p-4 text-white backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold tracking-[0.16em] text-white/70 uppercase">
                                Spotlight
                            </p>
                            <p className="mt-2 line-clamp-2 text-lg font-semibold leading-tight sm:text-xl">
                                {itemTitle(featured)}
                            </p>
                            {meta.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {meta.slice(0, 2).map((entry) => (
                                        <span
                                            key={entry}
                                            className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/88"
                                        >
                                            {entry}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        {featured.badge && (
                            <span className="rounded-full border border-white/14 bg-white/12 px-3 py-1 text-xs font-semibold text-white/90">
                                {featured.badge}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export function DiscoveryCollectionRail({
    section,
    theme,
}: {
    section: DiscoveryExperienceSection;
    theme: DiscoveryTheme;
}) {
    if (!section.items.length) return null;

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-lg font-bold text-slate-900">{section.title}</p>
                    {section.description && (
                        <p className="mt-1 text-sm text-slate-500">
                            {section.description}
                        </p>
                    )}
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.items.slice(0, 6).map((item) => (
                    <DiscoveryMiniCard
                        key={`${section.key}-${item.id}`}
                        item={item}
                        theme={theme}
                    />
                ))}
            </div>
        </section>
    );
}

export function DiscoveryMiniCard({
    item,
    theme,
}: {
    item: DiscoveryExperienceItem;
    theme: DiscoveryTheme;
}) {
    const meta = itemMeta(item);

    return (
        <a
            href={item.cta?.url ?? '#'}
            className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
            <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                    src={itemImage(item)}
                    alt={itemTitle(item)}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                {item.badge && (
                    <span className="absolute top-3 left-3 rounded-full border border-white/30 bg-black/35 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                        {item.badge}
                    </span>
                )}
            </div>
            <div className="space-y-3 p-4">
                <div>
                    <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
                        {itemTitle(item)}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {meta.slice(0, 2).map((entry) => (
                            <span
                                key={entry}
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                            >
                                {entry}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Mulai dari
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                            {item.price_label ?? 'Lihat detail'}
                        </p>
                    </div>
                    <span
                        className={cn(
                            'inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white transition group-hover:translate-x-0.5',
                            theme.accent,
                        )}
                    >
                        <span>{item.cta?.label ?? 'Buka'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                </div>
            </div>
        </a>
    );
}
