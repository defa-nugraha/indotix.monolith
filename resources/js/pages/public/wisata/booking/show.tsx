import { Head, Link, usePage } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';

type Booking = {
    encrypted_id: string;
    booking_code: string;
    visit_date: string;
    quantity: number;
    unit_price: number;
    total: number;
    status: string;
    payment_status?: string | null;
    ticket: { name: string };
    destination: { name: string; address?: string | null };
    guest: { name: string; email: string; phone: string };
};

export default function WisataBookingShow({ booking }: { booking: Booking }) {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Detail Booking Wisata" />
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Indotix" className="h-8" />
                    </div>
                    <div className="flex flex-1 items-center">
                        <input
                            type="text"
                            placeholder="Cari kota/hotel/wisata/event..."
                            className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm shadow-sm focus:border-sky-400 focus:outline-none"
                        />
                    </div>
                    {auth?.user ? (
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
            </header>

            <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-8">
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Booking</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{booking.booking_code}</h1>
                            <p className="text-sm text-slate-500">{booking.destination.name}</p>
                        </div>
                        <Badge className="bg-slate-100 text-slate-600">{booking.status}</Badge>
                    </div>
                    <div className="mt-6 grid gap-3 text-sm text-slate-600">
                        <div className="flex justify-between">
                            <span>Tiket</span>
                            <span className="font-semibold">{booking.ticket.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tanggal</span>
                            <span className="font-semibold">{booking.visit_date}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Jumlah</span>
                            <span className="font-semibold">{booking.quantity} tiket</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total</span>
                            <span className="font-semibold text-sky-600">Rp {booking.total.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
