import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    CalendarCheck,
    MapPinned,
    ShoppingBag,
    Star,
    Ticket,
    Bell,
    MessageCircle,
    History as HistoryIcon,
    UserCircle,
    MapPin,
    Clock,
    Users,
    ShoppingCart,
    BookOpen,
    BadgePercent,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import PublicLayout from '@/layouts/public-layout';
import ReviewSection from '@/components/reviews/review-section';
import { guardPurchaseByRole } from '@/lib/purchase-guard';
import SaleCountdown from '@/components/sale-countdown';

type AcademyDetail = {
    id: number;
    encrypted_id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    duration_minutes?: number | null;
    location_type?: string | null;
    location_detail?: string | null;
    capacity_total?: number | null;
    capacity_sold?: number | null;
    images?: string[];
};

type TicketItem = {
    id: number;
    name: string;
    price: number;
    quota?: number | null;
    sold_count?: number | null;
    available: number;
    ticket_type?: string | null;
    refundable?: boolean;
    sales_start_at?: string | null;
    sales_end_at?: string | null;
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

export default function AcademyShow({
    class: academyClass,
    tickets,
    reviews,
    userReview,
    canReview,
}: {
    class: AcademyDetail;
    tickets: TicketItem[];
    reviews: ReviewItem[];
    userReview?: UserReview | null;
    canReview?: boolean;
}) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_menu } =
        usePage().props as {
            auth?: { user?: any };
            unread_notifications?: number;
            souvenir_cart_count?: number;
            affiliate_menu?: boolean;
        };
    const role = (auth?.user as any)?.role as string | undefined;
    const [selectedTicket, setSelectedTicket] = useState<string>(
        tickets[0]?.id?.toString() ?? '',
    );
    const form = useForm({
        class_id: academyClass.id,
        ticket_id: tickets[0]?.id ?? 0,
        quantity: 1,
    });
    const activeTicket =
        tickets.find((ticket) => ticket.id === Number(selectedTicket)) ??
        tickets[0];
    const countdownTarget = (() => {
        if (!activeTicket) return null;
        const now = new Date();
        const endAt = activeTicket.sales_end_at
            ? new Date(activeTicket.sales_end_at.replace(' ', 'T'))
            : null;
        const startAt = activeTicket.sales_start_at
            ? new Date(activeTicket.sales_start_at.replace(' ', 'T'))
            : null;
        if (endAt && endAt > now) {
            return { label: 'Berakhir', value: activeTicket.sales_end_at };
        }
        if (startAt && startAt > now) {
            return { label: 'Dibuka', value: activeTicket.sales_start_at };
        }
        return null;
    })();

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Retail Shop', icon: ShoppingBag, href: '/retail-shop' },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Academy', icon: BookOpen, href: '/academy' },
        { label: 'Hotel', icon: Ticket, href: '/stay' },
    ];

    const submitBooking = () => {
        if (guardPurchaseByRole(role)) {
            return;
        }
        form.post('/academy/booking/prepare', {
            preserveScroll: true,
            onError: (errors) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text:
                        errors.quantity ??
                        errors.ticket_id ??
                        'Tidak dapat melanjutkan pemesanan.',
                    confirmButtonText: 'OK',
                });
            },
        });
    };

    const gallery =
        academyClass.images && academyClass.images.length > 0
            ? academyClass.images
            : [
                  `https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop&sig=${academyClass.id}`,
              ];

    return (
        <PublicLayout categories={categories}>
            <Head title={academyClass.title}>
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <section className="rounded-3xl bg-white p-6 shadow-sm">
                        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
                            <div className="h-56 overflow-hidden rounded-2xl">
                                <img
                                    src={gallery[0]}
                                    alt={academyClass.title}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="grid gap-3">
                                {gallery.slice(1, 3).map((img) => (
                                    <div
                                        key={img}
                                        className="h-[108px] overflow-hidden rounded-2xl"
                                    >
                                        <img
                                            src={img}
                                            alt="Kelas"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6">
                            <h1 className="text-2xl font-semibold text-slate-900">
                                {academyClass.title}
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">
                                {academyClass.description ??
                                    'Kelas pilihan Indotix Academy.'}
                            </p>
                            <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-sky-500" />
                                    {academyClass.category ?? 'Kelas Academy'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-sky-500" />
                                    {academyClass.location_detail ??
                                        'Lokasi kelas'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="h-4 w-4 text-sky-500" />
                                    {academyClass.start_at ?? '-'}{' '}
                                    {academyClass.end_at
                                        ? `- ${academyClass.end_at}`
                                        : ''}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-sky-500" />
                                    Durasi {academyClass.duration_minutes ??
                                        0}{' '}
                                    menit
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-sky-500" />
                                    Kapasitas {academyClass.capacity_total ??
                                        0}{' '}
                                    · Terjual {academyClass.capacity_sold ?? 0}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Pemesanan Tiket
                        </h2>
                        <p className="text-sm text-slate-500">
                            Pilih tiket dan jumlah yang kamu inginkan.
                        </p>
                        <div className="mt-4 space-y-3">
                            {countdownTarget && (
                                <SaleCountdown
                                    target={countdownTarget.value}
                                    label={countdownTarget.label}
                                    className="w-fit"
                                />
                            )}
                            {tickets.length === 0 && (
                                <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    Tiket kelas belum tersedia.
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-semibold text-slate-600">
                                    Pilih Tiket
                                </label>
                                <select
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={selectedTicket}
                                    onChange={(event) => {
                                        setSelectedTicket(event.target.value);
                                        form.setData(
                                            'ticket_id',
                                            Number(event.target.value),
                                        );
                                    }}
                                    disabled={tickets.length === 0}
                                >
                                    {tickets.map((ticket) => (
                                        <option
                                            key={ticket.id}
                                            value={ticket.id}
                                        >
                                            {ticket.name} · Rp{' '}
                                            {ticket.price.toLocaleString(
                                                'id-ID',
                                            )}{' '}
                                            · Tersedia {ticket.available}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">
                                    Jumlah Tiket
                                </label>
                                <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                    <button
                                        type="button"
                                        className="h-8 w-8 rounded-full bg-slate-100 text-slate-600"
                                        onClick={() =>
                                            form.setData(
                                                'quantity',
                                                Math.max(
                                                    1,
                                                    form.data.quantity - 1,
                                                ),
                                            )
                                        }
                                        disabled={tickets.length === 0}
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        className="w-16 bg-transparent text-center outline-none"
                                        value={form.data.quantity}
                                        onChange={(event) =>
                                            form.setData(
                                                'quantity',
                                                Number(event.target.value),
                                            )
                                        }
                                        disabled={tickets.length === 0}
                                    />
                                    <button
                                        type="button"
                                        className="h-8 w-8 rounded-full bg-sky-100 text-sky-700"
                                        onClick={() =>
                                            form.setData(
                                                'quantity',
                                                Math.min(
                                                    20,
                                                    form.data.quantity + 1,
                                                ),
                                            )
                                        }
                                        disabled={tickets.length === 0}
                                    >
                                        +
                                    </button>
                                    <span className="text-slate-500">
                                        tiket
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={submitBooking}
                                className="mt-2 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                disabled={tickets.length === 0}
                            >
                                Lanjutkan Pemesanan
                            </button>
                            <Link
                                href={`/chat/start/academy/${academyClass.id}`}
                                className="mt-3 block w-full rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Chat Admin
                            </Link>
                        </div>
                    </section>
                </div>

                <ReviewSection
                    productType="academy"
                    productId={academyClass.id}
                    reviews={reviews}
                    userReview={userReview}
                    canReview={canReview}
                />
            </main>
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
                            <li>Academy</li>
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
