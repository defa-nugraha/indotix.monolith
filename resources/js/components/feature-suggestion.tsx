import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { Lightbulb, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Suggestion = {
    key: string;
    match: string[];
    title: string;
    message: string;
    actionLabel: string;
    actionHref: string;
};

const adminSuggestions: Suggestion[] = [
    {
        key: 'admin-rbac',
        match: ['/admin/system/roles'],
        title: 'Atur akses dengan lebih rapi',
        message:
            'Sudah cek permission tiap sub fitur? Pastikan role hanya mendapat akses yang memang dibutuhkan.',
        actionLabel: 'Kelola role',
        actionHref: '/admin/system/roles',
    },
    {
        key: 'admin-users',
        match: ['/admin/users'],
        title: 'Lengkapi akses user',
        message:
            'Setelah membuat user admin, jangan lupa pilih role yang sesuai agar produk dan pengaturannya terpisah.',
        actionLabel: 'Kelola role',
        actionHref: '/admin/system/roles',
    },
    {
        key: 'admin-hotels',
        match: ['/hotels'],
        title: 'Sudah membuat tipe kamar?',
        message:
            'Jika belum ada tipe kamar, hotel akan terlihat belum siap dipesan. Yuk buat tipe kamar setelah data hotel selesai.',
        actionLabel: 'Buat tipe kamar',
        actionHref: '/room-types/create',
    },
    {
        key: 'admin-room-types',
        match: ['/room-types'],
        title: 'Atur stok dan harga harian',
        message:
            'Tipe kamar sudah dibuat? Tambahkan inventory supaya tanggal menginap punya kuota dan harga yang bisa dipesan.',
        actionLabel: 'Atur inventory',
        actionHref: '/room-inventories/create',
    },
    {
        key: 'admin-room-inventories',
        match: ['/room-inventories'],
        title: 'Cek tanggal ramai',
        message:
            'Gunakan inventory untuk menyesuaikan harga, stok, dan status tutup kamar pada tanggal tertentu.',
        actionLabel: 'Lihat hotel',
        actionHref: '/hotels',
    },
    {
        key: 'admin-mitra-hotel',
        match: ['/admin/mitra'],
        title: 'Periksa dokumen dan payout mitra',
        message:
            'Mitra baru bisa berjalan lancar setelah dokumen dan payout diverifikasi. Buka detail mitra untuk mengeceknya.',
        actionLabel: 'Kelola mitra',
        actionHref: '/admin/mitra',
    },
    {
        key: 'admin-mitra-wisata',
        match: ['/admin/mitra-wisata', '/admin/wisata/destinations'],
        title: 'Destinasi perlu tiket aktif',
        message:
            'Setelah destinasi wisata diverifikasi, tambahkan tiket agar user bisa mulai melakukan pemesanan.',
        actionLabel: 'Buat tiket wisata',
        actionHref: '/admin/wisata/tickets/create',
    },
    {
        key: 'admin-wisata-tickets',
        match: ['/admin/wisata/tickets'],
        title: 'Pastikan tiket siap dijual',
        message:
            'Cek status aktif, kuota, dan harga tiket. Tiket yang belum aktif tidak akan muncul untuk user.',
        actionLabel: 'Lihat destinasi',
        actionHref: '/admin/wisata/destinations',
    },
    {
        key: 'admin-wisata-bookings',
        match: ['/admin/wisata/bookings', '/admin/wisata/scans'],
        title: 'Pantau pemesanan dan scan',
        message:
            'Gunakan data booking dan scan untuk memastikan tiket yang sudah dibayar bisa divalidasi di lokasi.',
        actionLabel: 'Lihat tiket',
        actionHref: '/admin/wisata/tickets',
    },
    {
        key: 'admin-wisata-finance',
        match: ['/admin/wisata/finance'],
        title: 'Cek komisi sebelum payout',
        message:
            'Pastikan aturan komisi wisata sudah benar sebelum laporan dan payout diproses.',
        actionLabel: 'Atur komisi',
        actionHref: '/admin/wisata/finance/commissions',
    },
    {
        key: 'admin-events',
        match: ['/admin/events'],
        title: 'Event butuh tiket aktif',
        message:
            'Setelah event dibuat, pastikan tiket, jadwal, dan kuota sudah siap agar event bisa dijual.',
        actionLabel: 'Kelola tiket',
        actionHref: '/admin/events/tickets',
    },
    {
        key: 'admin-events-organizers',
        match: ['/admin/events/organizers'],
        title: 'Verifikasi organizer dulu',
        message:
            'Organizer yang dokumen dan payout-nya lengkap akan lebih siap menerima transaksi dan pencairan.',
        actionLabel: 'Lihat event',
        actionHref: '/admin/events',
    },
    {
        key: 'admin-events-finance',
        match: ['/admin/events/finance'],
        title: 'Komisi event sudah sesuai?',
        message:
            'Sebelum settlement berjalan, cek kembali periode berlaku dan nilai komisi event.',
        actionLabel: 'Atur komisi',
        actionHref: '/admin/events/finance/commissions',
    },
    {
        key: 'admin-bookings',
        match: ['/admin/bookings', '/admin/finance'],
        title: 'Cek pembayaran dan payout',
        message:
            'Booking yang sudah dibayar perlu dipantau sampai masuk laporan dan siap diproses ke mitra.',
        actionLabel: 'Lihat payout',
        actionHref: '/admin/finance/payouts',
    },
    {
        key: 'admin-vouchers',
        match: ['/admin/marketing/vouchers'],
        title: 'Voucher perlu batas yang jelas',
        message:
            'Tambahkan periode, kuota, dan syarat voucher supaya promo tetap terkendali.',
        actionLabel: 'Lihat laporan',
        actionHref: '/admin/finance/reports',
    },
    {
        key: 'admin-academy',
        match: ['/admin/academy'],
        title: 'Kelas perlu tiket dan jadwal',
        message:
            'Setelah kelas Academy dibuat, cek tiket dan kapasitas agar peserta bisa melakukan pemesanan.',
        actionLabel: 'Kelola tiket',
        actionHref: '/admin/academy/tickets',
    },
    {
        key: 'admin-souvenir',
        match: ['/admin/souvenir', '/admin/retail-shop'],
        title: 'Produk retail perlu stok',
        message:
            'Pastikan varian dan inventory sudah lengkap supaya produk bisa dibeli tanpa kendala.',
        actionLabel: 'Kelola inventory',
        actionHref: '/admin/retail-shop/inventory',
    },
    {
        key: 'admin-special-programs',
        match: ['/admin/special-programs'],
        title: 'Special program perlu paket aktif',
        message:
            'Setelah program dibuat, tambahkan tiket atau paket supaya user bisa melihat pilihan pembeliannya.',
        actionLabel: 'Kelola paket',
        actionHref: '/admin/special-programs/tickets',
    },
    {
        key: 'admin-blog',
        match: ['/admin/blog'],
        title: 'Konten lebih mudah ditemukan',
        message:
            'Gunakan kategori dan tag yang konsisten agar artikel Jelajah Indotix lebih mudah dicari.',
        actionLabel: 'Kelola kategori',
        actionHref: '/admin/blog/categories',
    },
    {
        key: 'admin-public-content',
        match: ['/admin/public'],
        title: 'Cek tampilan publik setelah update',
        message:
            'Setelah mengubah banner, FAQ, partner, atau halaman informasi, buka halaman publik untuk memastikan tampilannya rapi.',
        actionLabel: 'Lihat beranda',
        actionHref: '/',
    },
    {
        key: 'admin-chat-reviews',
        match: ['/admin/chat', '/admin/reviews'],
        title: 'Respon cepat bikin user tenang',
        message:
            'Balasan yang jelas membantu user dan mitra menyelesaikan kendala tanpa menunggu terlalu lama.',
        actionLabel: 'Buka dashboard',
        actionHref: '/dashboard',
    },
    {
        key: 'admin-system',
        match: ['/admin/system', '/admin/audit-logs'],
        title: 'Gunakan pengaturan sistem dengan hati-hati',
        message:
            'Perubahan sistem bisa berdampak luas. Cek audit log setelah update pengaturan penting.',
        actionLabel: 'Lihat audit log',
        actionHref: '/admin/system/audit-logs',
    },
    {
        key: 'admin-default',
        match: ['/admin', '/dashboard'],
        title: 'Mulai dari data yang paling berdampak',
        message:
            'Cek data utama, transaksi, dan verifikasi mitra secara berkala agar operasional tetap lancar.',
        actionLabel: 'Kelola mitra',
        actionHref: '/admin/mitra',
    },
];

const mitraSuggestions: Suggestion[] = [
    {
        key: 'mitra-dashboard',
        match: ['/mitra/dashboard'],
        title: 'Lengkapi langkah awal mitra',
        message:
            'Pastikan dokumen, payout, dan produk utama sudah siap supaya transaksi bisa berjalan lancar.',
        actionLabel: 'Cek keuangan',
        actionHref: '/mitra/finance/summary',
    },
    {
        key: 'mitra-hotel',
        match: ['/mitra/hotels'],
        title: 'Sudah membuat tipe kamar?',
        message:
            'Hotel belum bisa dipesan kalau belum ada tipe kamar dan inventory. Lengkapi setelah data hotel selesai.',
        actionLabel: 'Buat tipe kamar',
        actionHref: '/mitra/room-types/create',
    },
    {
        key: 'mitra-room-types',
        match: ['/mitra/room-types'],
        title: 'Tambahkan inventory kamar',
        message:
            'Setiap tipe kamar butuh stok dan harga per tanggal agar user bisa memilih jadwal menginap.',
        actionLabel: 'Atur inventory',
        actionHref: '/mitra/room-inventories/create',
    },
    {
        key: 'mitra-room-inventories',
        match: ['/mitra/room-inventories', '/mitra/occupancy'],
        title: 'Update stok saat kondisi berubah',
        message:
            'Jika kamar penuh atau harga berubah, perbarui inventory supaya ketersediaan tetap akurat.',
        actionLabel: 'Lihat booking',
        actionHref: '/mitra/bookings',
    },
    {
        key: 'mitra-wisata-profile',
        match: ['/mitra/wisata/destination', '/mitra/wisata-onboarding'],
        title: 'Destinasi yang lengkap lebih meyakinkan',
        message:
            'Lengkapi foto, jam operasional, alamat, dan dokumen agar destinasi lebih siap diverifikasi.',
        actionLabel: 'Kelola tiket',
        actionHref: '/mitra/wisata/tickets',
    },
    {
        key: 'mitra-wisata-tickets',
        match: ['/mitra/wisata/tickets'],
        title: 'Tiket aktif membuat destinasi bisa dipesan',
        message:
            'Pastikan harga, kuota, dan status tiket sudah benar sebelum destinasi dipromosikan.',
        actionLabel: 'Buat tiket',
        actionHref: '/mitra/wisata/tickets/create',
    },
    {
        key: 'mitra-wisata-ops',
        match: ['/mitra/wisata/bookings', '/mitra/wisata/scans', '/mitra/wisata/staff'],
        title: 'Siapkan validasi di lokasi',
        message:
            'Pantau booking dan scan tiket agar kunjungan user bisa divalidasi dengan cepat.',
        actionLabel: 'Buka scan',
        actionHref: '/mitra/wisata/scans',
    },
    {
        key: 'mitra-events',
        match: ['/mitra/events'],
        title: 'Event perlu tiket dan jadwal yang jelas',
        message:
            'Setelah membuat event, lengkapi tiket, kuota, dan jadwal supaya user bisa langsung membeli.',
        actionLabel: 'Kelola tiket',
        actionHref: '/mitra/events/tickets',
    },
    {
        key: 'mitra-event-tickets',
        match: ['/mitra/events/tickets'],
        title: 'Tiket event sudah siap dijual?',
        message:
            'Cek kembali harga, kuota, dan status aktif. Tiket yang belum aktif tidak akan tampil untuk user.',
        actionLabel: 'Lihat event',
        actionHref: '/mitra/events',
    },
    {
        key: 'mitra-event-ops',
        match: ['/mitra/events/bookings', '/mitra/events/scans', '/mitra/events/attendees', '/mitra/events/staff'],
        title: 'Pantau peserta secara rutin',
        message:
            'Gunakan data booking, peserta, dan scan untuk memastikan alur masuk event berjalan tertib.',
        actionLabel: 'Buka scan',
        actionHref: '/mitra/events/scans',
    },
    {
        key: 'mitra-finance',
        match: ['/mitra/finance', '/mitra/wisata/finance', '/mitra/events/finance'],
        title: 'Cek saldo sebelum mengajukan payout',
        message:
            'Pastikan data bank dan riwayat transaksi sudah benar sebelum membuat pengajuan pencairan.',
        actionLabel: 'Kelola bank',
        actionHref: '/mitra/finance/bank',
    },
    {
        key: 'mitra-support',
        match: ['/mitra/chat', '/mitra/reviews', '/mitra/wisata/disputes', '/mitra/events/disputes'],
        title: 'Tanggapi pesan dengan jelas',
        message:
            'Balasan yang ramah dan cepat membantu user menyelesaikan pertanyaan sebelum transaksi.',
        actionLabel: 'Buka chat',
        actionHref: '/mitra/chat',
    },
    {
        key: 'mitra-default',
        match: ['/mitra'],
        title: 'Jaga data produk tetap lengkap',
        message:
            'Produk dengan foto, harga, kuota, dan dokumen yang jelas lebih siap diproses oleh user.',
        actionLabel: 'Buka dashboard',
        actionHref: '/mitra/dashboard',
    },
];

function normalizePath(url: string): string {
    const path = url.split('?')[0]?.replace(/\/+$/, '') || '/';
    return path === '' ? '/' : path;
}

function findSuggestion(url: string, context: 'admin' | 'mitra'): Suggestion | null {
    const path = normalizePath(url);
    const suggestions = context === 'mitra' ? mitraSuggestions : adminSuggestions;

    return (
        suggestions
            .flatMap((suggestion) =>
                suggestion.match.map((prefix) => ({
                    suggestion,
                    prefix: normalizePath(prefix),
                })),
            )
            .filter(({ prefix }) => path === prefix || path.startsWith(`${prefix}/`))
            .sort((a, b) => b.prefix.length - a.prefix.length)[0]?.suggestion ?? null
    );
}

export default function FeatureSuggestion({ context }: { context: 'admin' | 'mitra' }) {
    const { url } = usePage();
    const suggestion = useMemo(() => findSuggestion(url, context), [context, url]);
    const storageKey = suggestion
        ? `indotix-feature-suggestion:${context}:${suggestion.key}:${normalizePath(url)}`
        : null;
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!storageKey) {
            setDismissed(false);
            return;
        }

        setDismissed(window.localStorage.getItem(storageKey) === 'dismissed');
    }, [storageKey]);

    if (!suggestion || dismissed) {
        return null;
    }

    const dismiss = () => {
        if (storageKey) {
            window.localStorage.setItem(storageKey, 'dismissed');
        }
        setDismissed(true);
    };

    return (
        <div className="relative z-10 bg-[#f6fbff] px-6 pt-6 -mb-2">
            <aside
                className={cn(
                    'flex flex-col gap-3 rounded-2xl border border-sky-100 bg-white/85 px-5 py-4 text-slate-800 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur',
                    'sm:flex-row sm:items-center sm:justify-between',
                )}
                aria-label="Saran fitur"
            >
                <div className="flex min-w-0 gap-3">
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                        <Lightbulb className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-slate-950">
                            {suggestion.title}
                        </p>
                        <p className="text-sm leading-6 text-slate-600">
                            {suggestion.message}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                    <Button asChild size="sm" className="bg-sky-600 text-white hover:bg-sky-700">
                        <Link href={suggestion.actionHref}>{suggestion.actionLabel}</Link>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-500 hover:text-slate-900"
                        onClick={dismiss}
                        aria-label="Tutup saran"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </Button>
                </div>
            </aside>
        </div>
    );
}
