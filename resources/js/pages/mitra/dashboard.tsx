import { Head } from '@inertiajs/react';
import {
    CheckCircle2,
    CreditCard,
    FileText,
    MapPin,
    Ticket,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Mitra',
        href: '/mitra/dashboard',
    },
];

type OnboardingStatus = {
    verification_status: 'draft' | 'pending' | 'verified' | 'rejected';
    payout_status?: 'draft' | 'pending' | 'verified' | 'rejected';
    verification_reason?: string | null;
    payout_reason?: string | null;
};

export default function MitraDashboard({
    wisataOnboarding,
    onboardingType,
    metrics,
    activities,
    statusCards,
    termsRequirement,
}: {
    wisataOnboarding: OnboardingStatus | null;
    onboardingType?: 'wisata' | null;
    metrics: {
        title: string;
        value: string | number;
        detail: string;
        icon: string;
    }[];
    activities: { title: string; meta: string }[];
    statusCards: {
        title: string;
        value: string | number;
        note: string;
        accent: string;
    }[];
    termsRequirement?: {
        required: boolean;
        signed_at?: string | null;
        business_type: 'wisata';
        title: string;
        file_url: string;
    } | null;
}) {
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const isChoosingType = onboardingType !== 'wisata';
    const activeOnboarding = wisataOnboarding;
    const safeOnboarding: Required<OnboardingStatus> = {
        verification_status: 'draft',
        verification_reason: null,
        payout_status: 'draft',
        payout_reason: null,
        ...(activeOnboarding ?? {}),
    };
    const iconMap: Record<string, typeof Ticket> = {
        ticket: Ticket,
        credit: CreditCard,
        map: MapPin,
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Mitra">
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
                                Mitra Indotix
                            </p>
                            <h1 className="font-['Space_Grotesk'] text-2xl font-semibold text-slate-900 sm:text-3xl">
                                {isChoosingType
                                    ? 'Mulai kelola destinasi wisata Anda'
                                    : 'Ringkasan performa destinasi Anda'}
                            </h1>
                            <p className="text-sm text-slate-600">
                                Pantau penjualan tiket, kuota, pendapatan, dan operasional wisata dalam satu dashboard.
                            </p>
                        </div>
                        {!isChoosingType && (
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    asChild
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                >
                                    <Link
                                        href="/mitra/wisata/onboarding"
                                    >
                                        Lengkapi dokumen
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {!isChoosingType && safeOnboarding.verification_status !== 'verified' && (
                        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            Dokumen pendaftaran Anda belum terverifikasi. Fitur
                            dashboard terbatas sampai proses review selesai.
                        </div>
                    )}
                    {safeOnboarding.verification_status === 'rejected' &&
                        safeOnboarding.verification_reason && (
                            <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                Ditolak: {safeOnboarding.verification_reason}
                            </div>
                        )}
                    {'payout_status' in safeOnboarding &&
                        safeOnboarding.payout_status === 'rejected' &&
                        safeOnboarding.payout_reason && (
                            <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                Payout ditolak: {safeOnboarding.payout_reason}
                            </div>
                        )}

                    <div
                        data-coach="dashboard-metrics"
                        className="mt-6 grid gap-4 lg:grid-cols-3"
                    >
                        {(metrics ?? []).map((item) => {
                            const Icon = iconMap[item.icon] ?? Ticket;
                            return (
                                <div
                                    key={item.title}
                                    className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                                >
                                    <div
                                        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                                            item.icon === 'credit'
                                                ? 'bg-amber-50 text-amber-600'
                                                : item.icon === 'map'
                                                  ? 'bg-emerald-50 text-emerald-600'
                                                  : item.icon === 'calendar'
                                                    ? 'bg-sky-50 text-sky-600'
                                                    : item.icon === 'users'
                                                      ? 'bg-emerald-50 text-emerald-600'
                                                      : 'bg-sky-50 text-sky-600'
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
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
                            );
                        })}
                    </div>
                </section>

                {termsRequirement && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                                    {termsRequirement.required ? (
                                        <FileText className="size-5" />
                                    ) : (
                                        <CheckCircle2 className="size-5" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-sky-600">
                                        Syarat & Ketentuan Mitra
                                    </p>
                                    <h2 className="mt-1 text-lg font-semibold text-slate-900">
                                        {termsRequirement.required
                                            ? 'Tanda tangani dokumen kerja sama'
                                            : 'Dokumen kerja sama sudah disetujui'}
                                    </h2>
                                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                                        {termsRequirement.required
                                            ? `Baca dokumen ${termsRequirement.title}, lalu centang persetujuan di bawah. Setelah dikirim, salinan PDF akan dikirim ke email Anda.`
                                            : `Persetujuan untuk ${termsRequirement.title} sudah tercatat pada ${termsRequirement.signed_at ?? '-'}.`}
                                    </p>
                                </div>
                            </div>
                            <Button asChild variant="outline" className="border-sky-200">
                                <a href={termsRequirement.file_url} target="_blank" rel="noreferrer">
                                    Buka PDF
                                </a>
                            </Button>
                        </div>

                        {termsRequirement.required && (
                            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <iframe
                                    src={termsRequirement.file_url}
                                    title={termsRequirement.title}
                                    className="h-[420px] w-full rounded-xl border border-slate-200 bg-white"
                                />
                                <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={(event) => setAcceptedTerms(event.target.checked)}
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        <span>
                                            Saya sudah membaca dan menyetujui dokumen syarat dan ketentuan mitra Indotix.
                                        </span>
                                    </label>
                                    <Button
                                        type="button"
                                        disabled={!acceptedTerms}
                                        className="bg-sky-600 text-white hover:bg-sky-700"
                                        onClick={() =>
                                            router.post('/mitra/terms/sign', { accepted: acceptedTerms }, { preserveScroll: true })
                                        }
                                    >
                                        Kirim tanda tangan
                                    </Button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {isChoosingType && (
                    <section
                        data-coach="dashboard-onboarding"
                        className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                    >
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Pendaftaran Mitra Wisata
                            </p>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Fokuskan akun Mitra untuk operasional wisata
                            </h2>
                            <p className="text-sm text-slate-500">
                                Indotix saat ini memprioritaskan pengelolaan destinasi wisata. Mulai lengkapi data destinasi, dokumen, tiket, dan payout wisata Anda.
                            </p>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="text-sm font-semibold text-slate-900">
                                    Mitra Wisata
                                </div>
                                <p className="mt-2 text-sm text-slate-500">
                                    Cocok untuk destinasi wisata, atraksi, atau
                                    wahana.
                                </p>
                                <Button
                                    type="button"
                                    className="mt-4 bg-sky-600 text-white hover:bg-sky-700"
                                    onClick={() =>
                                        router.post('/mitra/onboarding/type', {
                                            type: 'wisata',
                                        })
                                    }
                                >
                                    Daftar Wisata
                                </Button>
                            </div>
                            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 text-sm leading-6 text-slate-600">
                                Setelah pendaftaran wisata diverifikasi, menu tiket, booking, QR masuk, ulasan, laporan masalah, dan pendapatan wisata akan tersedia sesuai data destinasi Anda.
                            </div>
                        </div>
                    </section>
                )}

                {onboardingType === 'wisata' && (
                    <section
                        data-coach="dashboard-verification"
                        className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                    >
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Status Pendaftaran Wisata
                            </p>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Pantau status verifikasi destinasi kamu
                            </h2>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold text-slate-400 uppercase">
                                    Verifikasi
                                </p>
                                <div className="mt-2">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            safeOnboarding.verification_status ===
                                            'verified'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : safeOnboarding.verification_status ===
                                                    'pending'
                                                  ? 'bg-amber-50 text-amber-700'
                                                  : safeOnboarding.verification_status ===
                                                      'rejected'
                                                    ? 'bg-red-50 text-red-700'
                                                    : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {safeOnboarding.verification_status}
                                    </span>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold text-slate-400 uppercase">
                                    Payout
                                </p>
                                <div className="mt-2">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            safeOnboarding.payout_status ===
                                            'verified'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : safeOnboarding.payout_status ===
                                                    'pending'
                                                  ? 'bg-amber-50 text-amber-700'
                                                  : safeOnboarding.payout_status ===
                                                      'rejected'
                                                    ? 'bg-red-50 text-red-700'
                                                    : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {safeOnboarding.payout_status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <section
                        data-coach="dashboard-activity"
                        className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold text-sky-600 uppercase">
                                    Aktivitas Destinasi
                                </p>
                                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                                    Aktivitas terbaru di destinasi kamu
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
                                      },
                                  ]
                            ).map((item) => (
                                <div
                                    key={item.title}
                                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xs"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                                        <Ticket className="h-4 w-4" />
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
                                Status Operasional
                            </p>
                            <h2 className="mt-2 text-lg font-semibold text-slate-900">
                                Kesehatan operasional mitra
                            </h2>
                        </div>

                        <div className="mt-6 space-y-4">
                            {(statusCards ?? []).map((item) => (
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
