import { Head } from '@inertiajs/react';
import {
    Activity,
    CalendarCheck,
    CreditCard,
    ShieldCheck,
    Ticket,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard">
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
                                Admin Indotix
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl font-['Space_Grotesk']">
                                Ringkasan operasional hari ini
                            </h1>
                            <p className="text-sm text-slate-600">
                                Pantau performa tiket, aktivitas pengguna, dan
                                transaksi terbaru dalam satu tempat.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button className="bg-sky-600 text-white hover:bg-sky-700">
                                Buat event baru
                            </Button>
                            <Button
                                variant="outline"
                                className="border-sky-200 text-slate-700 hover:bg-sky-50"
                            >
                                Lihat laporan
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                        {[
                            {
                                title: 'Transaksi Hari Ini',
                                value: '1.248',
                                detail: '+12% dari kemarin',
                                icon: CreditCard,
                                accent: 'bg-sky-50 text-sky-600',
                            },
                            {
                                title: 'Tiket Terjual',
                                value: '18.402',
                                detail: '7 event aktif',
                                icon: Ticket,
                                accent: 'bg-amber-50 text-amber-600',
                            },
                            {
                                title: 'Mitra Aktif',
                                value: '320',
                                detail: '14 mitra baru minggu ini',
                                icon: Users,
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
                                    Aktivitas Terkini
                                </p>
                                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                                    Aktivitas terakhir di platform
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
                                    title: 'Validasi tiket “Konser Nusantara”',
                                    meta: '37 tiket tervalidasi • 10 menit lalu',
                                    icon: ShieldCheck,
                                },
                                {
                                    title: 'Pencairan dana Mitra Prisma',
                                    meta: 'Rp 18.500.000 • 45 menit lalu',
                                    icon: CreditCard,
                                },
                                {
                                    title: 'Event baru “Festival Pantai” aktif',
                                    meta: 'Mulai 3 Feb 2026 • 2 jam lalu',
                                    icon: CalendarCheck,
                                },
                                {
                                    title: 'Pengguna baru terdaftar',
                                    meta: '124 akun baru hari ini',
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
                                Status Sistem
                            </p>
                            <h2 className="mt-2 text-lg font-semibold text-slate-900">
                                Kesehatan platform
                            </h2>
                        </div>

                        <div className="mt-6 space-y-4">
                            {[
                                {
                                    title: 'Validasi Gate',
                                    value: 'Stabil',
                                    note: 'Rata-rata 1.2 detik',
                                    accent: 'bg-emerald-50 text-emerald-600',
                                },
                                {
                                    title: 'Pembayaran',
                                    value: 'Normal',
                                    note: '98.7% sukses',
                                    accent: 'bg-sky-50 text-sky-600',
                                },
                                {
                                    title: 'Akun Mitra',
                                    value: 'Terverifikasi',
                                    note: '12 antrian review',
                                    accent: 'bg-amber-50 text-amber-600',
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3"
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

                            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                                        <Activity className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Trafik puncak
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Diperkirakan pukul 19.00 - 21.00 WIB
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
