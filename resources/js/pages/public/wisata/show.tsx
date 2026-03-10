import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import PublicLayout from '@/layouts/public-layout';
import ReviewSection from '@/components/reviews/review-section';
import {
    Bell,
    CalendarCheck,
    CalendarDays,
    History,
    MapPinned,
    MessageCircle,
    ParkingSquare,
    ShoppingBag,
    ShoppingCart,
    Star,
    Ticket,
    UserCircle,
    Utensils,
    Users,
    Wifi,
    BadgePercent,
} from 'lucide-react';
import { guardPurchaseByRole } from '@/lib/purchase-guard';

type TicketItem = {
    id: number;
    name: string;
    description?: string | null;
    price: number;
    available: number;
    ticket_type?: string | null;
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
    photo_gate_url?: string | null;
    photo_area_url?: string | null;
    photo_ticket_url?: string | null;
    maps_pin_url?: string | null;
};

type Filters = {
    visit_date: string;
    quantity: number;
};

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

export default function WisataShow({
    destination,
    tickets,
    filters,
    reviews,
    userReview,
    canReview,
}: {
    destination: Destination;
    tickets: TicketItem[];
    filters: Filters;
    reviews: ReviewItem[];
    userReview?: UserReview | null;
    canReview?: boolean;
}) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_menu, affiliate_referral } = usePage().props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
        affiliate_menu?: boolean;
        affiliate_referral?: { code: string; destination_name?: string | null } | null;
    };
    const role = auth?.user?.role;
    const [visitDate, setVisitDate] = useState(filters.visit_date);
    const [quantity, setQuantity] = useState(filters.quantity ?? 1);
    const affiliateForm = useForm({ code: '' });
    const mapEmbedUrl = (() => {
        if (!destination.maps_pin_url) return null;
        if (destination.maps_pin_url.includes('output=embed')) return destination.maps_pin_url;
        if (destination.maps_pin_url.includes('google.com/maps')) {
            return `${destination.maps_pin_url}${destination.maps_pin_url.includes('?') ? '&' : '?'}output=embed`;
        }
        return null;
    })();

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata', active: true },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Retail Shop', icon: ShoppingBag, href: '/retail-shop' },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
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

    const facilityIcon = (facility: string) => {
        const value = facility.toLowerCase();
        if (value.includes('parkir') || value.includes('parking')) return ParkingSquare;
        if (value.includes('wifi') || value.includes('internet')) return Wifi;
        if (value.includes('toilet') || value.includes('restroom')) return Users;
        if (value.includes('mushola') || value.includes('masjid')) return MapPinned;
        if (value.includes('warung') || value.includes('makan') || value.includes('kuliner')) return Utensils;
        return Ticket;
    };

    const handleFilter = () => {
        router.get(`/wisata/${destination.slug ?? destination.encrypted_id}`, { visit_date: visitDate, quantity }, { preserveState: true });
    };

    return (
        <PublicLayout categories={categories} chips={chips}>
            <Head title={`${destination.destination_name} - INDOTIX`} />

                        <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                <section className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                    {affiliate_referral ? (
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Kamu datang dari rekomendasi partner kami {affiliate_referral.destination_name ? `untuk ${affiliate_referral.destination_name}` : ''}.
                                </p>
                                <p className="mt-1 text-xs text-slate-500">Kode afiliasi aktif: {affiliate_referral.code}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.post('/affiliate/referral/clear', {}, { preserveScroll: true })}
                                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Hapus kode
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                affiliateForm.post('/affiliate/referral/apply', { preserveScroll: true });
                            }}
                            className="flex flex-col gap-3 md:flex-row md:items-end"
                        >
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Punya kode afiliasi?</label>
                                <input
                                    value={affiliateForm.data.code}
                                    onChange={(event) => affiliateForm.setData('code', event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                                    placeholder="Masukkan kode afiliasi"
                                />
                                {affiliateForm.errors.code && <p className="text-xs text-rose-500">{affiliateForm.errors.code}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={affiliateForm.processing}
                                className="h-11 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                            >
                                Terapkan
                            </button>
                        </form>
                    )}
                </section>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 text-xs text-slate-500">
                        <div className="flex flex-wrap gap-2">
                            <span className="text-sky-600">Wisata</span>/
                            <span>Indonesia</span>/
                            <span>{destination.city_name ?? 'Kota'}</span>/
                            <span className="text-slate-700">{destination.destination_name}</span>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                        <div className="grid gap-3">
                            <img
                                src={destination.photo_area_url ?? destination.photo_gate_url ?? destination.photo_ticket_url ?? '/images/placeholder-hotel.jpg'}
                                alt={destination.destination_name}
                                className="h-64 w-full rounded-xl object-cover md:h-full"
                            />
                        </div>
                        <div className="grid gap-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[destination.photo_gate_url, destination.photo_ticket_url]
                                    .filter(Boolean)
                                    .slice(0, 4)
                                    .map((photo, idx) => (
                                        <div key={`${photo}-${idx}`} className="relative">
                                            <img src={photo ?? ''} alt={`Foto ${idx + 2}`} className="h-28 w-full rounded-xl object-cover" />
                                        </div>
                                    ))}
                                {(!destination.photo_gate_url && !destination.photo_ticket_url) && (
                                    <div className="h-28 rounded-xl bg-slate-100" />
                                )}
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                <div className="text-center text-sm font-semibold text-slate-700">Pemesanan Tiket</div>
                                <div className="mt-3 grid gap-3">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold uppercase text-slate-500">Nama destinasi wisata</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                            <span className="text-slate-400">📍</span>
                                            <span className="w-full text-slate-700">{destination.destination_name}</span>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold uppercase text-slate-500">Pilih Jadwal Kunjungan</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                            <input
                                                type="date"
                                                value={visitDate}
                                                onChange={(event) => setVisitDate(event.target.value)}
                                                className="w-full bg-transparent outline-none"
                                            />
                                        </div>
                                        <div className="text-[11px] text-slate-400">Jam operasional: {destination.open_time ?? '-'} - {destination.close_time ?? '-'}</div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold uppercase text-slate-500">Jumlah tiket</label>
                                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                            <button
                                                type="button"
                                                className="h-8 w-8 rounded-full bg-slate-100 text-slate-600"
                                                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                min={1}
                                                value={quantity}
                                                onChange={(event) => setQuantity(Number(event.target.value))}
                                                className="w-16 bg-transparent text-center outline-none"
                                            />
                                            <button
                                                type="button"
                                                className="h-8 w-8 rounded-full bg-sky-100 text-sky-700"
                                                onClick={() => setQuantity((prev) => prev + 1)}
                                            >
                                                +
                                            </button>
                                            <span className="text-slate-500">tiket</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleFilter}
                                        className="h-11 rounded-full bg-sky-600 px-6 text-sm font-semibold text-white shadow-md"
                                    >
                                        Perbarui
                                    </button>
                                    <Link
                                        href={`/chat/start/wisata/${destination.id}`}
                                        className="h-11 rounded-full border border-slate-200 px-6 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Chat Mitra
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">{destination.destination_name}</h1>
                            <p className="text-sm text-slate-500">{destination.city_name} · {destination.address_full ?? '-'}</p>
                            {destination.destination_type && (
                                <div className="mt-2 text-sm font-semibold text-sky-600">{destination.destination_type}</div>
                            )}
                        </div>
                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">
                            <div className="text-xs text-slate-500">Mulai dari</div>
                            <div className="text-lg font-semibold text-orange-500">
                                Rp {tickets[0]?.price?.toLocaleString('id-ID') ?? '-'}
                            </div>
                            <button className="mt-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white">Pilih Tiket</button>
                        </div>
                    </div>
                </div>

                <div className="sticky top-[120px] z-20 mt-6 flex items-center gap-6 border-b border-slate-200 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur">
                    {['Overview', 'Tickets', 'Location', 'Facilities'].map((tab) => (
                        <a key={tab} href={`#${tab.toLowerCase()}`} className="hover:text-slate-900">
                            {tab}
                        </a>
                    ))}
                </div>

                <section id="overview" className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="text-sm font-semibold text-slate-900">Kenapa harus ke sini?</div>
                            <p className="mt-2 text-sm text-slate-600">
                                {destination.highlights ?? 'Destinasi ini cocok untuk liburan singkat yang seru dan berkesan.'}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900">Tentang destinasi</h3>
                                <a href="#location" className="text-xs text-sky-600">Lihat peta</a>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">{destination.description ?? 'Deskripsi destinasi akan tampil di sini.'}</p>
                            <div className="mt-4 grid gap-2 text-sm text-slate-600">
                                <div>Alamat: {destination.address_full ?? '-'}</div>
                                <div>Jam buka: {destination.open_time ?? '-'} · Jam tutup: {destination.close_time ?? '-'}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="tickets" className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-900">Produk Tiket</h2>
                        <span className="text-xs text-slate-500">Pilih tiket sesuai kebutuhanmu</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-slate-900">
                                            <Ticket className="h-4 w-4 text-sky-600" />
                                            <h3 className="text-base font-semibold">{ticket.name}</h3>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-500">{ticket.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-semibold text-sky-600">Rp {ticket.price.toLocaleString('id-ID')}</div>
                                        <div className="text-xs text-slate-500">Sisa kuota: {ticket.available}</div>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                                    <span className="rounded-full bg-slate-100 px-3 py-1">{ticket.ticket_type === 'grup' ? 'Grup' : 'Perorangan'}</span>
                                    {ticket.refund_policy && (
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{ticket.refund_policy}</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    disabled={ticket.available < quantity}
                                    className={`mt-4 w-full rounded-full px-4 py-2 text-sm font-semibold text-white ${
                                        ticket.available < quantity ? 'bg-slate-300' : 'bg-sky-600'
                                    }`}
                                    onClick={() => {
                                        if (guardPurchaseByRole(role)) {
                                            return;
                                        }
                                        router.post('/wisata/booking/prepare', {
                                            destination_id: destination.id,
                                            ticket_id: ticket.id,
                                            visit_date: visitDate,
                                            quantity,
                                        });
                                    }}
                                >
                                    {ticket.available < quantity ? 'Kuota Tidak Cukup' : 'Pesan Tiket'}
                                </button>
                            </div>
                        ))}
                        {tickets.length === 0 && (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                                Belum ada tiket yang tersedia.
                            </div>
                        )}
                    </div>
                </section>

                <section id="location" className="mt-8 grid gap-4 lg:grid-cols-[1.2fr,1fr]">
                    <div className="overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 shadow-sm">
                        {mapEmbedUrl ? (
                            <iframe
                                title="Peta lokasi destinasi"
                                src={mapEmbedUrl}
                                className="h-64 w-full border-0"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        ) : (
                            <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                                Lokasi peta belum tersedia.
                            </div>
                        )}
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Lokasi & Akses</h2>
                        <p className="mt-2 text-sm text-slate-600">{destination.address_full ?? '-'}</p>
                        {destination.maps_pin_url && (
                            <a
                                href={destination.maps_pin_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-600"
                            >
                                Lihat di peta
                                <MapPinned className="h-4 w-4" />
                            </a>
                        )}
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                            Tips: Datang lebih awal untuk menikmati suasana yang lebih santai.
                        </div>
                    </div>
                </section>

                <section id="facilities" className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">Fasilitas Destinasi</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {(destination.facilities ?? []).length > 0 ? (
                            destination.facilities?.map((facility) => {
                                const Icon = facilityIcon(facility);
                                return (
                                    <div key={facility} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-sm text-slate-700">
                                        <span className="rounded-full bg-sky-50 p-2 text-sky-600">
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        {facility}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-xl border border-slate-100 p-4 text-sm text-slate-500">
                                Belum ada data fasilitas.
                            </div>
                        )}
                    </div>
                </section>

                <ReviewSection
                    productType="wisata"
                    productId={destination.id}
                    reviews={reviews}
                    userReview={userReview}
                    canReview={canReview}
                />
            </main>
            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <Link href="/"><img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" /></Link>
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
