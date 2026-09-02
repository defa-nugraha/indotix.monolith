import { Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    Check,
    ChevronLeft,
    Clock,
    Image as ImageIcon,
    MapPin,
    MapPinned,
    Minus,
    ParkingSquare,
    Plus,
    Ticket,
    Utensils,
    Users,
    Wifi,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import { ProductDescription } from '@/components/product-description';
import { PublicSeo } from '@/components/public-seo';
import ReviewSection from '@/components/reviews/review-section';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import PublicLayout from '@/layouts/public-layout';
import { guardPurchaseByRole } from '@/lib/purchase-guard';

type TicketItem = {
    id: number;
    name: string;
    description?: string | null;
    price: number;
    available: number;
    min_order_quantity?: number | null;
    max_order_quantity?: number | null;
    ticket_type?: string | null;
    ticket_kind?: string | null;
    is_entry_ticket?: boolean;
    package_items?: Array<{
        ticket_id: number;
        quantity: number;
        name?: string | null;
        price?: number | null;
    }>;
    refund_policy?: string | null;
};

type Destination = {
    id: number;
    encrypted_id: string;
    slug?: string | null;
    destination_name: string;
    destination_type?: string | null;
    description?: string | null;
    highlights?: string | null;
    address_full?: string | null;
    city_name?: string | null;
    open_days?: string[] | null;
    open_time?: string | null;
    close_time?: string | null;
    facilities?: string[] | null;
    photo_product_url?: string | null;
    photo_gate_url?: string | null;
    photo_area_url?: string | null;
    photo_ticket_url?: string | null;
    photo_other_urls?: string[] | null;
    maps_pin_url?: string | null;
};

type Filters = {
    visit_date: string;
    quantity: number;
};

type TicketQuantities = Record<number, number>;

type ReviewItem = {
    id: number;
    rating: number;
    comment?: string | null;
    user_name: string;
    created_at?: string | null;
    reply?: string | null;
    reply_by?: string | null;
    reply_at?: string | null;
};

type UserReview = {
    id: number;
    rating: number;
    comment?: string | null;
    created_at?: string | null;
};

type ReviewSummary = {
    total: number;
    average: number;
    distribution: {
        stars: number;
        count: number;
        percentage: number;
    }[];
};

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

const categories = [
    { label: 'Wisata', icon: MapPinned, href: '/wisata', active: true },
];

export default function WisataShow({
    destination,
    tickets,
    filters,
    reviews,
    reviewSummary,
    userReview,
    canReview,
}: {
    destination: Destination;
    tickets: TicketItem[];
    filters: Filters;
    reviews: ReviewItem[];
    reviewSummary?: ReviewSummary | null;
    userReview?: UserReview | null;
    canReview?: boolean;
}) {
    const { auth } = usePage().props as {
        auth?: { user?: { role?: string } };
    };
    const role = auth?.user?.role;
    const [visitDate, setVisitDate] = useState(filters.visit_date);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const minOrderFor = (ticket: TicketItem) =>
        Math.max(1, Number(ticket.min_order_quantity ?? 1));
    const maxOrderFor = (ticket: TicketItem) =>
        Math.max(
            minOrderFor(ticket),
            Math.min(
                ticket.available,
                Number(ticket.max_order_quantity ?? ticket.available),
            ),
        );
    const clampTicketQuantity = (ticket: TicketItem, quantity: number) => {
        if (quantity <= 0) return 0;

        return Math.min(maxOrderFor(ticket), Math.max(minOrderFor(ticket), quantity));
    };
    const [ticketQuantities, setTicketQuantities] = useState<TicketQuantities>(
        () =>
            Object.fromEntries(
                tickets.map((ticket, index) => [
                    ticket.id,
                    index === 0 && ticket.available > 0
                        ? clampTicketQuantity(ticket, filters.quantity ?? 1)
                        : 0,
                ]),
            ),
    );

    useEffect(() => {
        setTicketQuantities((current) => {
            const next = Object.fromEntries(
                tickets.map((ticket, index) => [
                    ticket.id,
                    current[ticket.id] ??
                        (index === 0 && ticket.available > 0
                            ? clampTicketQuantity(ticket, filters.quantity ?? 1)
                            : 0),
                ]),
            );

            return next;
        });
    }, [filters.quantity, tickets]);

    const galleryPhotos = [
        destination.photo_product_url,
        destination.photo_area_url,
        destination.photo_gate_url,
        destination.photo_ticket_url,
        ...(destination.photo_other_urls ?? []),
    ].filter(Boolean) as string[];
    const mainPhoto = galleryPhotos[0] ?? '/images/placeholder-hotel.jpg';
    const facilities = destination.facilities ?? [];
    const startingPrice =
        tickets
            .map((ticket) => Number(ticket.price ?? 0))
            .filter((price) => price > 0)
            .sort((a, b) => a - b)[0] ?? 0;
    const selectedTicketItems = useMemo(
        () =>
            tickets
                .map((ticket) => ({
                    ticket,
                    quantity: ticketQuantities[ticket.id] ?? 0,
                }))
                .filter((item) => item.quantity > 0),
        [ticketQuantities, tickets],
    );
    const totalQuantity = selectedTicketItems.reduce(
        (total, item) => total + item.quantity,
        0,
    );
    const totalPrice = selectedTicketItems.reduce(
        (total, item) => total + item.ticket.price * item.quantity,
        0,
    );
    const selectedHasContinuationTicket = selectedTicketItems.some(
        (item) => item.ticket.is_entry_ticket === false,
    );
    const selectedHasEntryTicket = selectedTicketItems.some(
        (item) => item.ticket.is_entry_ticket !== false,
    );
    const entryTicketRequired =
        selectedHasContinuationTicket && !selectedHasEntryTicket;
    const canBook =
        selectedTicketItems.length > 0 &&
        !entryTicketRequired &&
        selectedTicketItems.every(
            (item) => item.ticket.available >= item.quantity,
        );

    const updateTicketQuantity = (ticket: TicketItem, quantity: number) => {
        setTicketQuantities((current) => ({
            ...current,
            [ticket.id]: clampTicketQuantity(ticket, quantity),
        }));
    };

    const mapEmbedUrl = (() => {
        if (!destination.maps_pin_url) return null;
        if (destination.maps_pin_url.includes('output=embed'))
            return destination.maps_pin_url;
        if (destination.maps_pin_url.includes('google.com/maps')) {
            return `${destination.maps_pin_url}${destination.maps_pin_url.includes('?') ? '&' : '?'}output=embed`;
        }
        return null;
    })();

    const facilityIcon = (facility: string) => {
        const value = facility.toLowerCase();
        if (value.includes('parkir') || value.includes('parking'))
            return ParkingSquare;
        if (value.includes('wifi') || value.includes('internet')) return Wifi;
        if (value.includes('toilet') || value.includes('restroom'))
            return Users;
        if (value.includes('mushola') || value.includes('masjid'))
            return MapPinned;
        if (
            value.includes('warung') ||
            value.includes('makan') ||
            value.includes('kuliner')
        )
            return Utensils;
        return Ticket;
    };

    const submitBooking = () => {
        if (selectedTicketItems.length === 0) {
            return;
        }
        if (guardPurchaseByRole(role)) {
            return;
        }
        router.post('/wisata/booking/prepare', {
            destination_id: destination.id,
            ticket_id: selectedTicketItems[0].ticket.id,
            visit_date: visitDate,
            quantity: totalQuantity,
            items: selectedTicketItems.map((item) => ({
                ticket_id: item.ticket.id,
                quantity: item.quantity,
            })),
        });
    };

    return (
        <PublicLayout
            categories={categories}
            chips={chips}
            showCategories={false}
            showChips={false}
            transparent
        >
            <PublicSeo
                title={`${destination.destination_name} - Wisata Indotix`}
                description={destination.description ?? destination.highlights}
                image={mainPhoto}
                canonicalPath={`/wisata/${destination.slug ?? destination.encrypted_id}`}
                type="product"
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'TouristAttraction',
                    name: destination.destination_name,
                    description: destination.description,
                    image: galleryPhotos,
                    address: destination.address_full,
                }}
            />

            <section
                className="relative h-[420px] w-full overflow-hidden bg-slate-900 sm:h-[480px]"
                data-coach="wisata-detail-gallery"
            >
                <img
                    src={mainPhoto}
                    alt={destination.destination_name}
                    className="h-full w-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-black/60" />

                <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl space-y-3 px-4 pb-10 text-center text-white sm:px-6 sm:pb-12 lg:px-8">
                    <span className="block text-xs font-extrabold tracking-widest text-sky-300 uppercase sm:text-sm">
                        {destination.city_name ?? 'Wisata Indonesia'}
                    </span>
                    <h1 className="mx-auto line-clamp-2 max-w-4xl font-['Space_Grotesk'] text-3xl leading-tight font-black tracking-tight text-white drop-shadow-md sm:text-5xl sm:leading-none md:text-6xl">
                        {destination.destination_name}
                    </h1>
                    <p className="text-sm font-medium text-slate-200 sm:text-lg">
                        {destination.destination_type ??
                            'Destinasi wisata pilihan Indotix'}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2 sm:gap-3">
                        <Link
                            href="/wisata"
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm backdrop-blur-xs transition-colors hover:bg-sky-700 sm:px-5"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Kembali ke pencarian
                        </Link>
                        <button
                            type="button"
                            onClick={() => setGalleryOpen(true)}
                            className="flex min-h-11 items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm backdrop-blur-xs transition-colors hover:bg-sky-700 sm:px-5"
                        >
                            <ImageIcon className="h-3.5 w-3.5" />
                            Lihat Semua Foto
                        </button>
                    </div>
                </div>
            </section>

            <main className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-4 py-10 font-sans text-slate-800 sm:px-6 lg:grid-cols-12 lg:px-8">
                <section className="space-y-10 lg:col-span-7">
                    <article
                        className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs sm:p-8"
                        data-coach="wisata-detail-info"
                    >
                        <h2 className="font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                            Tentang {destination.destination_name}
                        </h2>
                        <ProductDescription
                            text={
                                destination.description ??
                                destination.highlights
                            }
                            fallback="Deskripsi destinasi belum tersedia."
                            lines={4}
                            className="text-xs leading-relaxed font-normal text-slate-600 sm:text-sm"
                        />

                        <div className="border-t border-slate-100 pt-6">
                            {facilities.length > 0 ? (
                                <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                                    {facilities.map((facility) => {
                                        const Icon = facilityIcon(facility);
                                        return (
                                            <div
                                                key={facility}
                                                className="group flex flex-col items-center gap-2 text-center"
                                            >
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600 shadow-xs transition-all group-hover:scale-105">
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <span className="line-clamp-2 text-[10px] font-bold tracking-tight text-slate-500">
                                                    {facility}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs font-medium text-slate-500">
                                    Fasilitas belum tersedia.
                                </div>
                            )}
                        </div>
                    </article>

                    <section
                        className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs"
                        id="location"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 font-['Space_Grotesk'] text-base font-bold text-slate-900">
                                <MapPinned className="h-5 w-5 text-sky-600" />
                                Jelajahi Area
                            </h3>
                            <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-sky-600 uppercase">
                                Lokasi
                            </span>
                        </div>

                        <div className="relative h-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-sky-50">
                            {mapEmbedUrl ? (
                                <iframe
                                    title="Peta lokasi destinasi"
                                    src={mapEmbedUrl}
                                    className="h-full w-full border-0"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                    Lokasi peta belum tersedia.
                                </div>
                            )}
                        </div>

                        <div className="border-slate-150 mt-3.5 rounded-xl border bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                            {destination.address_full ??
                                'Alamat destinasi belum tersedia.'}
                        </div>
                    </section>

                    <ReviewSection
                        productType="wisata"
                        productId={destination.id}
                        reviews={reviews}
                        reviewSummary={reviewSummary}
                        userReview={userReview}
                        canReview={canReview}
                    />
                </section>

                <aside className="lg:sticky lg:top-24 lg:col-span-5">
                    <div
                        className="space-y-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8"
                        id="booking-box-right"
                        data-coach="wisata-ticket-selector"
                    >
                        <div>
                            <h3 className="font-['Space_Grotesk'] text-lg font-black tracking-tight text-slate-950">
                                Paket {destination.destination_name}
                            </h3>
                            <div className="mt-1.5 flex items-baseline gap-1">
                                <span className="text-xs font-semibold text-slate-400">
                                    Mulai
                                </span>
                                <span className="text-2xl font-black tracking-tight text-sky-600">
                                    {startingPrice > 0
                                        ? `Rp ${startingPrice.toLocaleString('id-ID')}`
                                        : 'Tiket belum tersedia'}
                                </span>
                                <span className="text-xs font-semibold text-slate-400">
                                    / orang
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label required className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                Pilih Tanggal
                            </Label>
                            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-sky-500/50">
                                <Calendar className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                <input
                                    required
                                    type="date"
                                    value={visitDate}
                                    onChange={(event) =>
                                        setVisitDate(event.target.value)
                                    }
                                    className="w-full border-none bg-transparent text-xs font-semibold text-slate-700 focus:outline-none sm:text-sm"
                                />
                            </div>
                            <div className="text-[11px] font-medium text-slate-400">
                                Jam operasional: {destination.open_time ?? '-'}{' '}
                                - {destination.close_time ?? '-'}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label required className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                Pilihan Tiket
                            </Label>
                            <div className="space-y-3.5">
                                {tickets.map((ticket) => {
                                    const quantity =
                                        ticketQuantities[ticket.id] ?? 0;
                                    const active = quantity > 0;
                                    const subtotal = ticket.price * quantity;
                                    const minOrder = minOrderFor(ticket);
                                    const maxOrder = maxOrderFor(ticket);

                                    return (
                                        <div
                                            key={ticket.id}
                                            className={`rounded-2xl border p-4 text-xs transition sm:text-sm ${
                                                active
                                                    ? 'border-sky-200 bg-sky-50'
                                                    : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                                <div className="min-w-0">
                                                    <h4 className="line-clamp-1 font-bold text-slate-800">
                                                        {ticket.name}
                                                    </h4>
                                                    <span
                                                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                            ticket.is_entry_ticket ===
                                                            false
                                                                ? 'bg-amber-50 text-amber-700'
                                                                : 'bg-sky-50 text-sky-700'
                                                        }`}
                                                    >
                                                        {ticket.is_entry_ticket ===
                                                        false
                                                            ? 'Tiket terusan'
                                                            : 'Tiket masuk'}
                                                    </span>
                                                    <span className="mt-1 block text-xs font-bold text-slate-500">
                                                        Rp{' '}
                                                        {ticket.price.toLocaleString(
                                                            'id-ID',
                                                        )}{' '}
                                                        · Sisa{' '}
                                                        {ticket.available}
                                                    </span>
                                                    <span className="mt-1 block text-[11px] font-semibold text-slate-500">
                                                        Min. {minOrder} tiket
                                                        {maxOrder
                                                            ? ` · Maks. ${maxOrder} tiket`
                                                            : ''}
                                                    </span>
                                                    {ticket.ticket_kind ===
                                                        'package' &&
                                                        (ticket.package_items
                                                            ?.length ?? 0) >
                                                            0 && (
                                                            <div className="mt-3 rounded-xl border border-sky-100 bg-white/80 p-3 text-[11px] text-slate-600">
                                                                <div className="font-bold text-slate-800">
                                                                    Isi paket
                                                                </div>
                                                                <div className="mt-2 space-y-1.5">
                                                                    {ticket.package_items?.map(
                                                                        (
                                                                            item,
                                                                        ) => (
                                                                            <div
                                                                                key={`${ticket.id}-${item.ticket_id}`}
                                                                                className="flex items-start justify-between gap-3"
                                                                            >
                                                                                <span className="min-w-0">
                                                                                    {item.quantity}
                                                                                    x{' '}
                                                                                    {item.name ??
                                                                                        `Tiket #${item.ticket_id}`}
                                                                                </span>
                                                                                <span className="shrink-0 font-semibold text-slate-700">
                                                                                    Rp{' '}
                                                                                    {Number(
                                                                                        item.price ??
                                                                                            0,
                                                                                    ).toLocaleString(
                                                                                        'id-ID',
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                                <div className="flex w-fit shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateTicketQuantity(
                                                                ticket,
                                                                quantity <=
                                                                    minOrder
                                                                    ? 0
                                                                    : quantity -
                                                                          1,
                                                            )
                                                        }
                                                        disabled={quantity <= 0}
                                                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-extrabold text-slate-800">
                                                        {quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateTicketQuantity(
                                                                ticket,
                                                                quantity + 1,
                                                            )
                                                        }
                                                        disabled={
                                                            quantity >=
                                                            maxOrder
                                                        }
                                                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                                                <span className="text-[11px] font-semibold text-slate-500">
                                                    {quantity > 0
                                                        ? `${quantity} tiket dipilih`
                                                        : 'Belum dipilih'}
                                                </span>
                                                <span className="text-xs font-black text-sky-600">
                                                    {subtotal > 0
                                                        ? `Rp ${subtotal.toLocaleString('id-ID')}`
                                                        : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {tickets.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-500">
                                        Belum ada tiket yang tersedia.
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-xs font-bold text-slate-600 sm:text-sm">
                                    Total Harga ({totalQuantity} tiket):
                                </span>
                                <span className="text-xl leading-tight font-black tracking-tight text-slate-900 sm:text-2xl">
                                    {totalPrice > 0
                                        ? `Rp ${totalPrice.toLocaleString('id-ID')}`
                                        : '-'}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={submitBooking}
                                disabled={!canBook}
                                className="w-full cursor-pointer rounded-2xl bg-sky-600 py-3.5 text-center text-sm font-bold tracking-wide text-white uppercase shadow-md transition-all hover:scale-[1.01] hover:bg-sky-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:scale-100"
                            >
                                {selectedTicketItems.length === 0
                                    ? 'Pilih Tiket'
                                    : canBook
                                      ? 'Pesan Sekarang'
                                      : entryTicketRequired
                                        ? 'Pilih Tiket Masuk'
                                        : 'Kuota Tidak Cukup'}
                            </button>
                            {entryTicketRequired && (
                                <p className="text-center text-xs font-semibold text-amber-700">
                                    Tiket terusan wajib dipesan bersama tiket
                                    masuk.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 text-center text-[10px] font-bold text-slate-400">
                            <div className="flex items-center justify-center gap-1 border-r border-slate-100">
                                <Check className="h-3.5 w-3.5 text-sky-500" />
                                Harga terbaik
                            </div>
                            <div className="flex items-center justify-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-sky-500" />
                                Bantuan aktif
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
                <DialogContent className="max-h-[90vh] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-3xl p-4 sm:max-w-4xl sm:p-6">
                    <DialogHeader>
                        <DialogTitle>
                            Galeri {destination.destination_name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {(galleryPhotos.length > 0
                            ? galleryPhotos
                            : [mainPhoto]
                        ).map((photo, index) => (
                            <img
                                key={`${photo}-${index}`}
                                src={photo}
                                alt={`${destination.destination_name} ${index + 1}`}
                                className="aspect-video w-full rounded-2xl bg-slate-100 object-cover"
                                loading="lazy"
                            />
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <Link href="/">
                            <img
                                src="/logo.png"
                                alt="Indotix"
                                className="h-11 w-36 object-contain"
                            />
                        </Link>
                        <p className="mt-3 text-sm text-slate-600">
                            Neo Soho Capital 40th Floor
                            <br />
                            Jl. Tanjung Duren Raya No 1<br />
                            Jakarta Barat, DKI Jakarta 11470
                        </p>
                        <p className="mt-4 text-sm text-slate-600">
                            0812 9205 9888
                        </p>
                        <p className="text-sm text-slate-600">
                            info@indotix.co.id
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                            Layanan
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Wisata</li>
                            <li>Special Program</li>
                            <li>Event</li>
                            <li>Hotel</li>
                            <li>Retail Shop</li>
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
                                    href="/privacy-policy"
                                    className="transition hover:text-sky-600"
                                >
                                    Kebijakan Privasi
                                </Link>
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
