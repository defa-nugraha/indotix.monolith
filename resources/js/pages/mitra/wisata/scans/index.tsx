import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CalendarDays,
    CircleCheck,
    Download,
    Globe2,
    Printer,
    QrCode,
    ScanLine,
    Search,
    ShieldCheck,
    Ticket,
} from 'lucide-react';

type ScanRow = {
    id: number;
    scanned_at: string;
    officer_name: string | null;
    location: string | null;
    is_anomaly: boolean;
    quantity?: number | null;
    booking?: {
        booking_code?: string | null;
        visit_date?: string | null;
        ticket_name?: string | null;
    };
};

type Props = {
    destination: {
        id: number;
        destination_name: string | null;
        address?: string | null;
    };
    qrImage: string;
    qrTemplate: {
        scan_label?: string | null;
        lead_text?: string | null;
        main_title?: string | null;
        main_description?: string | null;
        website_label?: string | null;
        footer_step_one?: string | null;
        footer_step_two?: string | null;
        footer_step_three?: string | null;
        top_logo_urls?: string[];
        qr_logo_url?: string | null;
        background_image_url?: string | null;
        playstore_image_url?: string | null;
    };
    qrPdfUrl: string;
    scans: {
        data: ScanRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { date?: string; search?: string; tab?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'QR Masuk Wisata', href: '/mitra/wisata/scans' },
];

const paginationLabel = (label: string) =>
    label
        .replace(/&laquo;/g, '‹')
        .replace(/&raquo;/g, '›')
        .replace(/&lsaquo;/g, '‹')
        .replace(/&rsaquo;/g, '›');

export default function MitraWisataScansIndex({
    destination,
    qrImage,
    qrTemplate,
    qrPdfUrl,
    scans,
    filters,
}: Props) {
    const submitFilters = (formEl: HTMLFormElement) => {
        const data = new FormData(formEl);
        router.get(
            '/mitra/wisata/scans',
            { ...Object.fromEntries(data.entries()), tab: 'history' },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const destinationName =
        destination.destination_name?.trim() || 'Destinasi Wisata';
    const topLogoUrls =
        qrTemplate.top_logo_urls && qrTemplate.top_logo_urls.length > 0
            ? qrTemplate.top_logo_urls.slice(0, 3)
            : ['/logo.png'];
    const activeTab = filters.tab === 'history' ? 'history' : 'qr';
    const switchTab = (tab: 'qr' | 'history') => {
        router.get(
            '/mitra/wisata/scans',
            {
                tab,
                date: filters.date ?? '',
                search: filters.search ?? '',
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="QR Masuk Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        .printable-entry-qr, .printable-entry-qr * { visibility: visible; }
                        .printable-entry-qr {
                            position: fixed;
                            inset: 0;
                            margin: auto;
                            width: 210mm;
                            height: 297mm;
                            box-shadow: none !important;
                            transform: none !important;
                        }
                    }
                `}</style>
                <div
                    className="flex flex-wrap gap-2 rounded-2xl border border-sky-100 bg-white/90 p-2 shadow-sm"
                    data-coach="mitra-scan-tabs"
                >
                    <button
                        type="button"
                        onClick={() => switchTab('qr')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            activeTab === 'qr'
                                ? 'bg-sky-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                        }`}
                    >
                        <QrCode className="h-4 w-4" />
                        QR Tiket
                    </button>
                    <button
                        type="button"
                        onClick={() => switchTab('history')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            activeTab === 'history'
                                ? 'bg-sky-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                        }`}
                    >
                        <Search className="h-4 w-4" />
                        Data Scan
                    </button>
                </div>

                {activeTab === 'qr' && (
                    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div
                        className="overflow-x-auto pb-2"
                        data-coach="mitra-entry-qr-preview"
                    >
                        <div className="printable-entry-qr relative mx-auto aspect-[1086/1536] w-[min(390px,calc(100vw-2rem))] min-w-0 max-w-[390px] overflow-hidden rounded-[26px] border-[6px] border-[#116fd4] bg-white shadow-[0_28px_70px_-42px_rgba(15,23,42,0.5)]">
                            <div className="absolute inset-0 bg-white" />
                            <div className="absolute inset-x-0 top-0 h-[40%] overflow-hidden bg-gradient-to-br from-[#0b55c7] via-[#0487df] to-[#23d4e4]">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_28%,rgba(255,255,255,0.38),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.09),transparent_48%)]" />
                                {qrTemplate.background_image_url && (
                                    <img
                                        src={qrTemplate.background_image_url}
                                        alt=""
                                        aria-hidden="true"
                                        className="absolute inset-x-0 top-[4%] h-full w-full object-cover"
                                    />
                                )}
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_48%)]" />

                                <div className="absolute top-0 left-0 flex h-[16%] w-[34%] items-center justify-center gap-2 rounded-br-[56px] bg-white px-4 shadow-sm">
                                    {topLogoUrls.map((logoUrl, index) => (
                                        <img
                                            key={`${logoUrl}-${index}`}
                                            src={logoUrl}
                                            alt={index === 0 ? 'Logo QR masuk' : ''}
                                            className={`h-[60%] w-auto object-contain ${topLogoUrls.length > 1 ? 'max-w-[30%]' : 'max-w-full'}`}
                                        />
                                    ))}
                                </div>

                                <div className="absolute top-[3.7%] right-[4%] inline-flex items-center gap-2 rounded-full border border-white/70 bg-[#145ccf]/88 px-4 py-2.5 text-sm font-bold text-white shadow-[0_14px_30px_-20px_rgba(0,0,0,0.5)]">
                                    <ScanLine className="h-5 w-5" />
                                    <span>
                                        {qrTemplate.scan_label ||
                                            'Scan untuk Masuk'}
                                    </span>
                                </div>

                                <div className="absolute top-[20.2%] left-[6%] max-w-[78%] text-white">
                                    <h1
                                        className="text-[29px] leading-[1.04] font-black tracking-wide break-words uppercase drop-shadow-[0_8px_14px_rgba(0,20,70,0.22)]"
                                        title={destinationName}
                                        style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {destinationName}
                                    </h1>
                                    <div className="mt-4 h-1.5 w-14 rounded-full bg-cyan-200" />
                                    <p className="mt-4 max-w-[300px] text-[14px] leading-snug font-medium text-white">
                                        {qrTemplate.lead_text ||
                                            'Scan QR ini melalui menu Scan Tiket Indotix untuk memvalidasi tiket kunjungan Anda.'}
                                    </p>
                                </div>
                            </div>

                            <div className="absolute inset-x-0 top-[35.5%] bottom-0 rounded-t-[46px] bg-white px-[7%] text-center">
                                <div className="absolute top-[15%] left-[17%] h-[21%] w-[12%] [background-image:radial-gradient(#7ac4f0_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-40" />
                                <div className="absolute top-[15%] right-[17%] h-[21%] w-[12%] [background-image:radial-gradient(#7ac4f0_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-40" />
                                <div className="absolute bottom-[14%] -left-[8%] h-[19%] w-[22%] rounded-full border-[14px] border-sky-100/70" />
                                <div className="absolute right-[-10%] bottom-[3%] h-[21%] w-[25%] rounded-full bg-cyan-300/40" />
                                <div className="absolute right-[-7%] bottom-[8%] h-[17%] w-[19%] rounded-full bg-cyan-200/60" />

                                <div className="absolute top-[3.6%] left-1/2 w-[32%] max-w-[125px] -translate-x-1/2">
                                    <span className="absolute -top-2.5 -left-2.5 h-8 w-8 rounded-tl-2xl border-t-4 border-l-4 border-[#1687e8]" />
                                    <span className="absolute -top-2.5 -right-2.5 h-8 w-8 rounded-tr-2xl border-t-4 border-r-4 border-[#1687e8]" />
                                    <span className="absolute -bottom-2.5 -left-2.5 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-[#1687e8]" />
                                    <span className="absolute -right-2.5 -bottom-2.5 h-8 w-8 rounded-br-2xl border-r-4 border-b-4 border-[#1687e8]" />
                                    <div className="relative rounded-[20px] bg-white p-3 shadow-[0_18px_36px_-18px_rgba(15,23,42,0.55)] ring-1 ring-slate-100">
                                        <img
                                            src={qrImage}
                                            alt="QR masuk wisata"
                                            className="mx-auto aspect-square w-full"
                                        />
                                        {qrTemplate.qr_logo_url && (
                                            <span className="absolute top-1/2 left-1/2 flex h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-white p-0.5 shadow-sm ring-1 ring-slate-100">
                                                <img
                                                    src={qrTemplate.qr_logo_url}
                                                    alt=""
                                                    aria-hidden="true"
                                                    className="h-full w-full object-contain"
                                                />
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#66cdf6] to-[#0e85dc] text-white shadow-[0_14px_24px_-14px_rgba(15,23,42,0.55)]">
                                        <CircleCheck className="h-6 w-6 fill-white/10" />
                                    </div>
                                </div>

                                <div className="absolute inset-x-[7%] bottom-[36.8%] text-center">
                                    <div className="flex items-center justify-center gap-1 text-[11px] leading-tight font-black tracking-wide text-[#123a75] uppercase">
                                        <span className="text-[#1598e8]">
                                            &gt;
                                        </span>
                                        <span className="text-[#1598e8]">
                                            &gt;
                                        </span>
                                        <span>
                                            {qrTemplate.main_title ||
                                                'SATU QR UNTUK VALIDASI TIKET WISATA'}
                                        </span>
                                        <span className="text-[#1598e8]">
                                            &lt;
                                        </span>
                                        <span className="text-[#1598e8]">
                                            &lt;
                                        </span>
                                    </div>
                                    <p className="mx-auto mt-2.5 max-w-[300px] text-[9.5px] leading-snug text-[#263b67]">
                                        {qrTemplate.main_description ||
                                            'Tempel QR ini di loket atau pintu masuk. User memilih tiket paid miliknya setelah scan.'}
                                    </p>
                                    <div className="mx-auto mt-2.5 h-1.5 w-20 rounded-full bg-cyan-300" />
                                </div>

                                <div className="absolute inset-x-[8%] bottom-[21%] flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-white/90 px-3 py-2 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.55)]">
                                    <div className="flex min-w-0 items-center gap-2 text-left text-[#123a75]">
                                        <Globe2 className="h-4 w-4 shrink-0 text-sky-600" />
                                        <div className="min-w-0">
                                            <div className="truncate text-[10px] font-black">
                                                {qrTemplate.website_label ||
                                                    'indotix.co.id'}
                                            </div>
                                            <div className="text-[8px] font-semibold text-slate-500">
                                                Download aplikasi Indotix
                                            </div>
                                        </div>
                                    </div>
                                    {qrTemplate.playstore_image_url && (
                                        <img
                                            src={qrTemplate.playstore_image_url}
                                            alt="Google Play"
                                            className="h-6 w-auto shrink-0 object-contain"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="absolute inset-x-0 bottom-0 h-[12.5%] overflow-hidden rounded-b-[24px] bg-gradient-to-r from-[#0c55be] via-[#078ee4] to-[#2bd8df] px-[6%] text-white">
                                <div className="absolute -bottom-[42%] -left-[2%] h-[95%] w-[24%] rounded-full bg-white/12" />
                                <div className="relative z-10 flex h-full items-center justify-between gap-1 text-[9.5px] font-bold">
                                    <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/15">
                                            <QrCode className="h-3.5 w-3.5" />
                                        </span>
                                        <span className="truncate">
                                            {qrTemplate.footer_step_one ||
                                                'Scan QR'}
                                        </span>
                                    </div>
                                    <div className="h-[48%] w-px bg-white/70" />
                                    <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/15">
                                            <Ticket className="h-3.5 w-3.5" />
                                        </span>
                                        <span className="truncate">
                                            {qrTemplate.footer_step_two ||
                                                'Pilih Tiket'}
                                        </span>
                                    </div>
                                    <div className="h-[48%] w-px bg-white/70" />
                                    <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/15">
                                            <CircleCheck className="h-3.5 w-3.5" />
                                        </span>
                                        <span className="truncate">
                                            {qrTemplate.footer_step_three ||
                                                'Validasi'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold text-sky-600 uppercase">
                                    QR Masuk Wisata
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                    Cetak QR untuk validasi tiket
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                    Mitra tidak perlu scan tiket user. Cetak QR
                                    ini, letakkan di area masuk, lalu user akan
                                    scan QR dan memilih tiket yang akan
                                    digunakan.
                                </p>
                            </div>
                            <div
                                className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap"
                                data-coach="mitra-entry-qr-actions"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full border-sky-200 text-sky-700 hover:bg-sky-50 sm:w-auto"
                                    asChild
                                >
                                    <a href={qrPdfUrl}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Unduh PDF
                                    </a>
                                </Button>
                                <Button
                                    className="w-full bg-sky-600 text-white hover:bg-sky-700 sm:w-auto"
                                    asChild
                                >
                                    <a
                                        href={`${qrPdfUrl}?inline=1`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Printer className="mr-2 h-4 w-4" />
                                        Cetak QR
                                    </a>
                                </Button>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 md:grid-cols-3">
                            {[
                                {
                                    icon: QrCode,
                                    title: 'QR milik destinasi',
                                    text: 'QR ini bukan QRIS dan tidak memproses pembayaran.',
                                },
                                {
                                    icon: ShieldCheck,
                                    title: 'Validasi server',
                                    text: 'Sistem mengecek tiket paid dan sisa pemakaian.',
                                },
                                {
                                    icon: CalendarDays,
                                    title: 'Sesuai tanggal',
                                    text: 'Tiket hanya bisa dipakai pada tanggal kunjungan.',
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                                >
                                    <item.icon className="h-5 w-5 text-sky-600" />
                                    <div className="mt-3 text-sm font-bold text-slate-900">
                                        {item.title}
                                    </div>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        {item.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    </section>
                )}

                {activeTab === 'history' && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form
                        className="mb-4 flex flex-wrap items-end gap-3"
                        data-coach="mitra-scan-history-filter"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitFilters(event.currentTarget);
                        }}
                    >
                        <label className="grid min-w-0 flex-1 gap-1 text-xs font-medium text-slate-600 sm:min-w-[260px]">
                            <span>Pencarian</span>
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Cari kode booking, nama tamu, tiket, petugas, atau lokasi"
                                    className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm"
                                />
                            </div>
                        </label>
                        <label className="grid w-full gap-1 text-xs font-medium text-slate-600 sm:w-auto">
                            <span>Tanggal scan</span>
                            <input
                                type="date"
                                name="date"
                                defaultValue={filters.date ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <Button
                            type="submit"
                            variant="outline"
                            className="w-full border-sky-200 text-sky-700 hover:bg-sky-50 sm:w-auto"
                        >
                            Filter
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 sm:w-auto"
                            asChild
                        >
                            <Link href="/mitra/wisata/scans?tab=history">
                                Reset
                            </Link>
                        </Button>
                    </form>
                    <div
                        className="overflow-hidden rounded-2xl border border-slate-100"
                        data-coach="mitra-scan-history-table"
                    >
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Waktu Scan
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Kode Booking
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Tiket
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Jumlah
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {scans.data.map((scan) => (
                                    <tr
                                        key={scan.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3">
                                            {scan.scanned_at}
                                        </td>
                                        <td className="px-4 py-3">
                                            {scan.booking?.booking_code ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {scan.booking?.ticket_name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {scan.quantity ?? 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={
                                                    scan.is_anomaly
                                                        ? 'bg-rose-50 text-rose-600'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                }
                                            >
                                                {scan.is_anomaly
                                                    ? 'Gagal/Anomali'
                                                    : 'Berhasil'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {scans.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-8 text-center text-sm text-slate-500"
                                        >
                                            Belum ada scan tiket dari user.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {scans.links?.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                            {scans.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url ?? '#'}
                                    className={`rounded-lg border px-3 py-1 text-sm ${
                                        link.active
                                            ? 'border-sky-600 bg-sky-600 text-white'
                                            : 'border-slate-200 text-slate-600'
                                    } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                >
                                    {paginationLabel(link.label)}
                                </Link>
                            ))}
                        </div>
                    )}
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
