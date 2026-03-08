import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AffiliateLayout from '@/layouts/affiliate-layout';

type Destination = {
    destination_name: string;
    destination_type?: string | null;
    address_full?: string | null;
    photo_area_url?: string | null;
    slug?: string | null;
    encrypted_id: string;
};

type Ticket = {
    id: number;
    name: string;
    price: number;
    ticket_type?: string | null;
};

export default function AffiliateCatalog({
    destination,
    tickets,
    commission,
}: {
    destination?: Destination | null;
    tickets: Ticket[];
    commission?: { type: string; value: number; source: string } | null;
}) {
    return (
        <>
            <Head title="Katalog Wisata" />
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Katalog Wisata</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">Produk yang bisa kamu promosikan</h1>
                    <p className="mt-1 text-sm text-slate-500">Gunakan materi ini sebagai referensi promosi.</p>
                </div>

                {!destination && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                        Destinasi belum ditentukan. Hubungi admin untuk mengaktifkan wisata afiliasi.
                    </div>
                )}

                {destination && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row">
                            {destination.photo_area_url && (
                                <img
                                    src={destination.photo_area_url}
                                    alt={destination.destination_name}
                                    className="h-40 w-full rounded-xl object-cover md:w-64"
                                />
                            )}
                            <div className="flex-1 space-y-2">
                                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Destinasi</div>
                                <h2 className="text-xl font-semibold text-slate-900">{destination.destination_name}</h2>
                                <p className="text-sm text-slate-500">{destination.address_full ?? '-'}</p>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                    <span className="rounded-full bg-slate-100 px-3 py-1">{destination.destination_type ?? 'Wisata'}</span>
                                </div>
                                <Link
                                    href={`/wisata/${destination.slug ?? destination.encrypted_id}`}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700"
                                >
                                    Lihat halaman publik
                                </Link>
                                {commission && (
                                    <div className="mt-3 text-xs text-slate-500">
                                        Komisi: {commission.type === 'percentage' ? `${commission.value}%` : `Rp ${commission.value.toLocaleString('id-ID')}`} ·
                                        Sumber: {commission.source === 'platform' ? 'Platform' : 'Subsidi promo'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {tickets.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-sm font-semibold text-slate-900">{ticket.name}</p>
                                <p className="mt-1 text-xs text-slate-500">{ticket.ticket_type ?? 'Reguler'}</p>
                                <p className="mt-3 text-lg font-semibold text-slate-900">
                                    Rp {ticket.price.toLocaleString('id-ID')}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

AffiliateCatalog.layout = (page: ReactNode) => <AffiliateLayout active="catalog">{page}</AffiliateLayout>;
