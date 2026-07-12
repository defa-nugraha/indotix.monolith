import { Head } from '@inertiajs/react';
import {
    Activity,
    CreditCard,
    ShieldCheck,
    Ticket,
    Users,
    ShoppingBag,
    BookOpen,
    Sparkles,
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

type ActivityItem = {
    title: string;
    meta: string;
};

type Props = {
    scope?: 'admin' | 'academy' | 'retail' | 'special' | 'custom';
    summary: {
        transactions_today: number;
        tickets_sold: number;
        active_partners: number;
    };
    system: {
        pending_reviews: number;
        pending_payouts: number;
        pending_payments: number;
    };
    activities: ActivityItem[];
};

export default function Dashboard({
    summary,
    system,
    activities,
    scope = 'admin',
}: Props) {
    const isAdmin = scope === 'admin';
    const isAcademy = scope === 'academy';
    const isRetail = scope === 'retail';
    const isSpecial = scope === 'special';
    const isCustom = scope === 'custom';

    const headerBadge = isAcademy
        ? 'Admin Academy'
        : isRetail
          ? 'Admin Retail Shop'
          : isSpecial
            ? 'Admin Special Program'
            : isCustom
              ? 'Admin RBAC'
              : 'Admin Indotix';

    const headline = isAcademy
        ? 'Ringkasan Academy hari ini'
        : isRetail
          ? 'Ringkasan Retail Shop hari ini'
          : isSpecial
            ? 'Ringkasan Special Program hari ini'
            : isCustom
              ? 'Ringkasan sesuai akses role Anda'
              : 'Ringkasan operasional hari ini';

    const description = isAcademy
        ? 'Pantau booking kelas, tiket terjual, dan kelas aktif.'
        : isRetail
          ? 'Pantau order retail, item terjual, dan produk aktif.'
          : isSpecial
            ? 'Pantau booking special program, tiket terjual, dan program aktif.'
            : isCustom
              ? 'Pantau transaksi, produk, dan tindak lanjut dari fitur yang dapat Anda akses.'
              : 'Pantau performa tiket, aktivitas pengguna, dan transaksi terbaru dalam satu tempat.';

    const summaryCards = isAcademy
        ? [
              {
                  title: 'Booking Hari Ini',
                  value: summary.transactions_today.toLocaleString('id-ID'),
                  detail: 'Total booking kelas berhasil hari ini',
                  icon: CreditCard,
                  accent: 'bg-sky-50 text-sky-600',
              },
              {
                  title: 'Tiket Terjual',
                  value: summary.tickets_sold.toLocaleString('id-ID'),
                  detail: 'Total tiket kelas terjual hari ini',
                  icon: Ticket,
                  accent: 'bg-amber-50 text-amber-600',
              },
              {
                  title: 'Kelas Aktif',
                  value: summary.active_partners.toLocaleString('id-ID'),
                  detail: 'Jumlah kelas aktif saat ini',
                  icon: BookOpen,
                  accent: 'bg-emerald-50 text-emerald-600',
              },
          ]
        : isRetail
          ? [
                {
                    title: 'Order Hari Ini',
                    value: summary.transactions_today.toLocaleString('id-ID'),
                    detail: 'Total order retail berhasil hari ini',
                    icon: CreditCard,
                    accent: 'bg-sky-50 text-sky-600',
                },
                {
                    title: 'Item Terjual',
                    value: summary.tickets_sold.toLocaleString('id-ID'),
                    detail: 'Total item retail terjual hari ini',
                    icon: ShoppingBag,
                    accent: 'bg-amber-50 text-amber-600',
                },
                {
                    title: 'Produk Aktif',
                    value: summary.active_partners.toLocaleString('id-ID'),
                    detail: 'Jumlah produk retail aktif',
                    icon: Users,
                    accent: 'bg-emerald-50 text-emerald-600',
                },
            ]
          : isSpecial
            ? [
                  {
                      title: 'Booking Hari Ini',
                      value: summary.transactions_today.toLocaleString('id-ID'),
                      detail: 'Total booking special program hari ini',
                      icon: CreditCard,
                      accent: 'bg-sky-50 text-sky-600',
                  },
                  {
                      title: 'Tiket Terjual',
                      value: summary.tickets_sold.toLocaleString('id-ID'),
                      detail: 'Total tiket special program terjual hari ini',
                      icon: Ticket,
                      accent: 'bg-amber-50 text-amber-600',
                  },
                  {
                      title: 'Program Aktif',
                      value: summary.active_partners.toLocaleString('id-ID'),
                      detail: 'Jumlah special program aktif',
                      icon: Sparkles,
                      accent: 'bg-emerald-50 text-emerald-600',
                  },
              ]
            : [
                  {
                      title: 'Transaksi Hari Ini',
                      value: summary.transactions_today.toLocaleString('id-ID'),
                      detail: 'Total transaksi berhasil hari ini',
                      icon: CreditCard,
                      accent: 'bg-sky-50 text-sky-600',
                  },
                  {
                      title: 'Tiket Terjual',
                      value: summary.tickets_sold.toLocaleString('id-ID'),
                      detail: 'Total tiket terjual hari ini',
                      icon: Ticket,
                      accent: 'bg-amber-50 text-amber-600',
                  },
                  {
                      title: 'Mitra Aktif',
                      value: summary.active_partners.toLocaleString('id-ID'),
                      detail: 'Mitra terverifikasi saat ini',
                      icon: Users,
                      accent: 'bg-emerald-50 text-emerald-600',
                  },
              ];

    const systemCards = isAdmin
        ? [
              {
                  title: 'Review Mitra',
                  value: `${system.pending_reviews} pending`,
                  note: 'Perlu verifikasi admin',
                  accent:
                      system.pending_reviews > 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700',
              },
              {
                  title: 'Pembayaran Pending',
                  value: `${system.pending_payments} transaksi`,
                  note: 'Menunggu pembayaran',
                  accent:
                      system.pending_payments > 0
                          ? 'bg-sky-50 text-sky-700'
                          : 'bg-emerald-50 text-emerald-700',
              },
              {
                  title: 'Payout Pending',
                  value: `${system.pending_payouts} mitra`,
                  note: 'Perlu persetujuan',
                  accent:
                      system.pending_payouts > 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700',
              },
          ]
        : [
              {
                  title: 'Pembayaran Pending',
                  value: `${system.pending_payments} transaksi`,
                  note: 'Menunggu pembayaran',
                  accent:
                      system.pending_payments > 0
                          ? 'bg-sky-50 text-sky-700'
                          : 'bg-emerald-50 text-emerald-700',
              },
              {
                  title: isRetail ? 'Refund Pending' : 'Review/Refund Pending',
                  value: `${system.pending_reviews} pending`,
                  note: 'Butuh tindak lanjut',
                  accent:
                      system.pending_reviews > 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700',
              },
          ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isAdmin ? 'Admin Dashboard' : 'Dashboard'}>
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-x-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <div className="pointer-events-none absolute top-12 -left-32 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
                <div className="pointer-events-none absolute top-0 right-[-10%] h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />
                <div className="pointer-events-none absolute bottom-[-15%] left-[20%] h-80 w-80 rounded-full bg-amber-300/20 blur-[140px]" />

                <section
                    data-coach="dashboard-hero"
                    className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/85 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur"
                >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                {headerBadge}
                            </p>
                            <h1 className="font-['Space_Grotesk'] text-2xl font-semibold text-slate-900 sm:text-3xl">
                                {headline}
                            </h1>
                            <p className="text-sm text-slate-600">
                                {description}
                            </p>
                        </div>
                    </div>

                    <div
                        data-coach="dashboard-metrics"
                        className="mt-6 grid gap-4 lg:grid-cols-3"
                    >
                        {summaryCards.map((item) => (
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
                                    <p className="text-xs font-semibold text-slate-400 uppercase">
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
                    <section
                        data-coach="dashboard-activity"
                        className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold text-sky-600 uppercase">
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
                            {(activities?.length
                                ? activities
                                : [
                                      {
                                          title: 'Belum ada aktivitas terbaru',
                                          meta: 'Aktivitas terbaru akan muncul di sini.',
                                          icon: ShieldCheck,
                                      },
                                  ]
                            ).map((item) => (
                                <div
                                    key={item.title}
                                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xs"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                                        <ShieldCheck className="h-4 w-4" />
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

                    <section
                        data-coach="dashboard-status"
                        className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                    >
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Status Sistem
                            </p>
                            <h2 className="mt-2 text-lg font-semibold text-slate-900">
                                Kesehatan platform
                            </h2>
                        </div>

                        <div className="mt-6 space-y-4">
                            {systemCards.map((item) => (
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
                                            Pantau real-time
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Data disinkronkan dari transaksi
                                            terbaru.
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
