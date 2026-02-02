import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Mail, Phone, Ticket, User } from 'lucide-react';

type Draft = {
    destination_id: number;
    ticket_id: number;
    visit_date: string;
    quantity: number;
};

type Props = {
    draft: Draft;
    destination: {
        id: number;
        destination_name: string;
        address_full?: string | null;
        city_name?: string | null;
    };
    ticket: {
        id: number;
        name: string;
        price: number;
    };
    pricing: {
        total: number;
    };
};

export default function WisataBookingReview({ draft, destination, ticket, pricing }: Props) {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const form = useForm({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        special_request: '',
    });

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Review Booking Wisata">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
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
                            <Link
                                href="/register"
                                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                            >
                                Gabung Mitra
                            </Link>
                            <Link
                                href="/login"
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                            >
                                Login
                            </Link>
                        </>
                    )}
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
                <section className="flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1 rounded-3xl bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-sky-50 p-2 text-sky-600">
                                <Ticket className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-slate-900">Review Pemesanan Tiket</h1>
                                <p className="text-sm text-slate-500">Lengkapi data untuk konfirmasi booking.</p>
                            </div>
                        </div>
                        <form
                            className="mt-6 space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.post('/wisata/booking/confirm');
                            }}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full text-sm focus:outline-none"
                                            value={form.data.guest_name}
                                            onChange={(event) => form.setData('guest_name', event.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Email</label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full text-sm focus:outline-none"
                                            type="email"
                                            value={form.data.guest_email}
                                            onChange={(event) => form.setData('guest_email', event.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Nomor HP</label>
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full text-sm focus:outline-none"
                                            value={form.data.guest_phone}
                                            onChange={(event) => form.setData('guest_phone', event.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Permintaan Khusus</label>
                                    <textarea
                                        className="mt-2 min-h-[90px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        value={form.data.special_request}
                                        onChange={(event) => form.setData('special_request', event.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white"
                                >
                                    Lanjutkan Pembayaran
                                </button>
                            </div>
                        </form>
                    </div>
                    <aside className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">{destination.destination_name}</h2>
                        <p className="text-sm text-slate-500">{destination.city_name ?? destination.address_full}</p>
                        <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                            <div className="flex justify-between">
                                <span>Tiket</span>
                                <span className="font-semibold">{ticket.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tanggal</span>
                                <span className="font-semibold">{draft.visit_date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Jumlah</span>
                                <span className="font-semibold">{draft.quantity} tiket</span>
                            </div>
                            <div className="flex justify-between text-base font-semibold text-sky-600">
                                <span>Total</span>
                                <span>Rp {pricing.total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </aside>
                </section>
            </main>
        </div>
    );
}
