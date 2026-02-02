import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarDays, MapPinned, Ticket } from 'lucide-react';

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

export default function WisataShow({
    destination,
    tickets,
    filters,
}: {
    destination: Destination;
    tickets: TicketItem[];
    filters: Filters;
}) {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const [visitDate, setVisitDate] = useState(filters.visit_date);
    const [quantity, setQuantity] = useState(filters.quantity ?? 1);

    const handleFilter = () => {
        router.get(`/wisata/${destination.encrypted_id}`, { visit_date: visitDate, quantity }, { preserveState: true });
    };

    return (
        <div className="min-h-screen bg-[#f6fbff] font-['Plus_Jakarta_Sans'] text-slate-900">
            <Head title={`${destination.destination_name} - INDOTIX`} />

            <header className="border-b border-slate-100 bg-white">
                <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
                    <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <img src="/logo.png" alt="Indotix" className="h-9" />
                    </Link>
                    <div className="flex flex-1 items-center gap-4">
                        <div className="flex w-full items-center gap-3 rounded-full border border-slate-200 px-4 py-2 text-sm">
                            <MapPinned className="h-4 w-4 text-slate-400" />
                            <span>{destination.destination_name}</span>
                        </div>
                        {auth?.user?.role === 'user' ? (
                            <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                                <Link href="/settings/profile" className="hover:text-sky-600">Profile</Link>
                                <Link href="/history" className="hover:text-sky-600">Riwayat</Link>
                                <Link href="/?tab=chat" className="hover:text-sky-600">Chat</Link>
                                <Link href="/notifications" className="hover:text-sky-600">Notifikasi</Link>
                            </div>
                        ) : (
                            <>
                                <Link href="/register" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
                                    Gabung Mitra
                                </Link>
                                <Link href="/login" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                                    Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                                Destinasi Wisata
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{destination.destination_name}</h1>
                            <p className="text-sm text-slate-500">{destination.city_name ?? 'Indonesia'}</p>
                            <p className="mt-4 text-sm text-slate-600">{destination.description}</p>
                            {destination.highlights && (
                                <p className="mt-2 text-sm text-slate-500">{destination.highlights}</p>
                            )}
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <CalendarDays className="h-4 w-4" />
                                Jadwal Kunjungan
                            </div>
                            <div className="mt-3 grid gap-3">
                                <input
                                    type="date"
                                    value={visitDate}
                                    onChange={(event) => setVisitDate(event.target.value)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <input
                                    type="number"
                                    min={1}
                                    value={quantity}
                                    onChange={(event) => setQuantity(Number(event.target.value))}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleFilter}
                                    className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Perbarui
                                </button>
                            </div>
                            <div className="mt-4 text-xs text-slate-500">
                                Jam operasional: {destination.open_time ?? '-'} - {destination.close_time ?? '-'}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {[destination.photo_area_url, destination.photo_gate_url, destination.photo_ticket_url].filter(Boolean).map((photo, index) => (
                        <img key={index} src={photo ?? ''} className="h-40 w-full rounded-2xl object-cover" />
                    ))}
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">Produk Tiket</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">{ticket.name}</h3>
                                        <p className="text-sm text-slate-500">{ticket.description}</p>
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

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">Lokasi</h2>
                    <p className="mt-2 text-sm text-slate-600">{destination.address_full ?? '-'}</p>
                    {destination.maps_pin_url && (
                        <a
                            href={destination.maps_pin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-sm font-semibold text-sky-600"
                        >
                            Lihat di peta →
                        </a>
                    )}
                </section>
            </main>
        </div>
    );
}
