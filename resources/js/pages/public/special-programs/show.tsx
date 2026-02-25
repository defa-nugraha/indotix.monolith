import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarCheck, MapPinned, ShoppingBag, Star, Ticket, Bell, MessageCircle, UserCircle, History as HistoryIcon, Sparkles, ShoppingCart } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import ReviewSection from '@/components/reviews/review-section';
import { guardPurchaseByRole } from '@/lib/purchase-guard';

const navItems = [
    { label: 'Wisata', icon: MapPinned, href: '/wisata' },
    { label: 'Event', icon: CalendarCheck, href: '/events' },
    { label: 'Retail Shop', icon: ShoppingBag, href: '/souvenir' },
    { label: 'Spesial Program', icon: Star, href: '/special-programs', active: true },
    { label: 'Hotel', icon: Ticket, href: '/stay' },
];

type ProgramItem = {
    type: 'hotel' | 'wisata' | 'event';
    id: number;
    encrypted_id: string;
    title: string;
    city_name?: string | null;
    description?: string | null;
    image_url?: string | null;
    price?: number | null;
};

type Program = {
    id: number;
    encrypted_id: string;
    name: string;
    program_type: string;
    status: string;
    starts_at?: string | null;
    ends_at?: string | null;
    highlight_level?: string | null;
    description_internal?: string | null;
    terms?: string | null;
    discount?: Record<string, any> | null;
    rules?: Record<string, any> | null;
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

export default function SpecialProgramShow({
    program,
    items,
    reviews,
    userReview,
    canReview,
}: {
    program: Program;
    items: ProgramItem[];
    reviews: ReviewItem[];
    userReview?: UserReview | null;
    canReview?: boolean;
}) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: { role?: string } }; unread_notifications?: number; souvenir_cart_count?: number };
    const role = auth?.user?.role;
    const [selectedItem, setSelectedItem] = useState<ProgramItem | null>(
        items.find((item) => item.type !== 'hotel') ?? items[0] ?? null,
    );
    const [quantity, setQuantity] = useState(1);
    const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));

    const submitBooking = () => {
        if (!selectedItem) return;
        if (selectedItem.type === 'hotel') {
            window.location.href = `/stay/hotels/${selectedItem.encrypted_id}`;
            return;
        }
        if (guardPurchaseByRole(role)) {
            return;
        }
        router.post('/special-programs/booking/prepare', {
            program_id: program.id,
            item_type: selectedItem.type,
            item_id: selectedItem.id,
            quantity,
            visit_date: selectedItem.type === 'hotel' ? null : visitDate,
        });
    };

    return (
        <PublicLayout categories={navItems}>
            <Head title={program.name} />
                        <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Special Program</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{program.name}</h1>
                            <p className="mt-2 text-sm text-slate-500">{program.program_type} · {program.starts_at ?? '-'} → {program.ends_at ?? '-'}</p>
                        </div>
                        <Sparkles className="h-10 w-10 text-sky-500" />
                    </div>
                    {program.terms && (
                        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                            {program.terms}
                        </div>
                    )}
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Produk dalam program</h2>
                        <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6">
                            {items.map((item) => (
                                <button
                                    key={`${item.type}-${item.id}`}
                                    type="button"
                                    onClick={() => setSelectedItem(item)}
                                    className={`rounded-2xl border px-4 py-3 text-left ${selectedItem?.id === item.id ? 'border-sky-300 bg-sky-50' : 'border-slate-100 bg-white'}`}
                                >
                                    <div className="text-xs text-slate-500">{item.type.toUpperCase()}</div>
                                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                                    <div className="mt-1 text-xs text-slate-500">{item.city_name ?? 'Indonesia'}</div>
                                    {item.price ? (
                                        <div className="mt-2 text-xs font-semibold text-sky-600">Mulai Rp {Number(item.price).toLocaleString('id-ID')}</div>
                                    ) : (
                                        <div className="mt-2 text-[11px] text-slate-400">Harga menyesuaikan</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Pemesanan Program</h2>
                        <p className="text-sm text-slate-500">Pilih produk dan lanjutkan ke pembayaran.</p>
                        <div className="mt-4 grid gap-3">
                            <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                {selectedItem ? selectedItem.title : 'Pilih produk terlebih dahulu'}
                            </div>
                            {selectedItem?.type !== 'hotel' && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Tanggal kunjungan</label>
                                    <input
                                        type="date"
                                        value={visitDate}
                                        onChange={(event) => setVisitDate(event.target.value)}
                                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                            )}
                            {selectedItem?.type !== 'hotel' && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Jumlah tiket</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={(event) => setQuantity(Number(event.target.value))}
                                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                            )}
                            <button className="mt-2 h-11 rounded-full bg-sky-600 px-6 text-sm font-semibold text-white" onClick={submitBooking}>
                                {selectedItem?.type === 'hotel' ? 'Lihat Hotel' : 'Lanjutkan Pembayaran'}
                            </button>
                            <Link
                                href={`/chat/start/special_program/${program.id}`}
                                className="mt-3 block h-11 rounded-full border border-slate-200 px-6 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Chat Admin
                            </Link>
                        </div>
                    </div>
                </section>

                <ReviewSection
                    productType="special_program"
                    productId={program.id}
                    reviews={reviews}
                    userReview={userReview}
                    canReview={canReview}
                />
            </main>
        </PublicLayout>
    );
}
