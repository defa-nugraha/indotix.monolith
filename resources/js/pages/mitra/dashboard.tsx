import { Head } from '@inertiajs/react';
import {
    CalendarCheck,
    CreditCard,
    MapPin,
    ShieldCheck,
    Ticket,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Mitra',
        href: '/mitra/dashboard',
    },
];

export default function MitraDashboard({
    onboarding,
    stats,
}: {
    onboarding: {
        verification_status: 'draft' | 'pending' | 'verified' | 'rejected';
        payout_status: 'draft' | 'pending' | 'verified' | 'rejected';
        verification_reason?: string | null;
        payout_reason?: string | null;
    };
    stats: {
        reservations_today: number;
        monthly_revenue: number;
        available_rooms: number;
    };
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Mitra">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-x-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <div className="pointer-events-none absolute -left-32 top-12 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
                <div className="pointer-events-none absolute right-[-10%] top-0 h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />
                <div className="pointer-events-none absolute bottom-[-15%] left-[20%] h-80 w-80 rounded-full bg-amber-300/20 blur-[140px]" />

                <section className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/85 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                                Mitra Indotix
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl font-['Space_Grotesk']">
                                Ringkasan performa properti Anda
                            </h1>
                            <p className="text-sm text-slate-600">
                                Pantau pemesanan, pendapatan, dan ketersediaan
                                kamar dalam satu tempat.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                asChild
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                <Link href="/mitra/onboarding">
                                    Lengkapi dokumen
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="border-sky-200 text-slate-700 hover:bg-sky-50"
                            >
                                Lihat laporan
                            </Button>
                        </div>
                    </div>

                    {onboarding.verification_status !== 'verified' && (
                        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            Dokumen pendaftaran Anda belum terverifikasi. Fitur dashboard terbatas sampai
                            proses review selesai.
                        </div>
                    )}
                    {onboarding.verification_status === 'rejected' && onboarding.verification_reason && (
                        <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                            Ditolak: {onboarding.verification_reason}
                        </div>
                    )}
                    {onboarding.payout_status === 'rejected' && onboarding.payout_reason && (
                        <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                            Payout ditolak: {onboarding.payout_reason}
                        </div>
                    )}

                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                        {[
                            {
                                title: 'Reservasi Hari Ini',
                                value: stats.reservations_today.toString(),
                                detail: 'Booking aktif hari ini',
                                icon: Ticket,
                                accent: 'bg-sky-50 text-sky-600',
                            },
                            {
                                title: 'Pendapatan Bulan Ini',
                                value: `Rp ${stats.monthly_revenue.toLocaleString('id-ID')}`,
                                detail: 'Total booking selesai/paid',
                                icon: CreditCard,
                                accent: 'bg-amber-50 text-amber-600',
                            },
                            {
                                title: 'Kamar Tersedia',
                                value: stats.available_rooms.toString(),
                                detail: 'Kamar siap dijual',
                                icon: MapPin,
                                accent: 'bg-emerald-50 text-emerald-600',
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                            >
                                <div
                                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.accent}`}
                                >
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                        {item.title}
                                    </p>
                                    <p className="text-2xl font-semibold text-slate-900">
                                        {item.value}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {item.detail}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                                    Aktivitas Properti
                                </p>
                                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                                    Aktivitas terbaru di properti Anda
                                </h2>
                            </div>
                            <Button
                                variant="ghost"
                                className="text-sky-600 hover:bg-sky-50"
                            >
                                Lihat semua
                            </Button>
                        </div>

                        <div className="mt-6 space-y-4">
                            {[
                                {
                                    title: 'Booking baru “Hotel Prisma”',
                                    meta: '3 kamar • 15 menit lalu',
                                    icon: Ticket,
                                },
                                {
                                    title: 'Pembayaran masuk',
                                    meta: 'Rp 4.500.000 • 1 jam lalu',
                                    icon: CreditCard,
                                },
                                {
                                    title: 'Update inventori berhasil',
                                    meta: 'Tipe Kamar Deluxe • 2 jam lalu',
                                    icon: CalendarCheck,
                                },
                                {
                                    title: 'Review tamu terbaru',
                                    meta: 'Rating 4.8 • 3 jam lalu',
                                    icon: Users,
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xs"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {item.meta}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                                Status Operasional
                            </p>
                            <h2 className="mt-2 text-lg font-semibold text-slate-900">
                                Kesehatan operasional mitra
                            </h2>
                        </div>

                        <div className="mt-6 space-y-4">
                            {[
                                {
                                    title: 'Validasi Check-in',
                                    value: 'Stabil',
                                    note: 'Rata-rata 1.1 detik',
                                    accent: 'bg-emerald-50 text-emerald-600',
                                },
                                {
                                    title: 'Pembayaran',
                                    value: 'Normal',
                                    note: '97.9% sukses',
                                    accent: 'bg-sky-50 text-sky-600',
                                },
                                {
                                    title: 'Konten Properti',
                                    value: 'Lengkap',
                                    note: '9 properti siap jual',
                                    accent: 'bg-amber-50 text-amber-600',
                                },
                                {
                                    title: 'Akun Mitra',
                                    value: 'Terverifikasi',
                                    note: 'Dokumen valid',
                                    accent: 'bg-emerald-50 text-emerald-600',
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xs"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {item.note}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${item.accent}`}
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
