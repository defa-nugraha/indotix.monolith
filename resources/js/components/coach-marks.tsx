import { usePage } from '@inertiajs/react';
import { HelpCircle, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type CoachContext = 'admin' | 'mitra' | 'public' | 'affiliate';

type CoachStep = {
    selector: string;
    title: string;
    description: string;
};

type TourDefinition = {
    id: string;
    context: CoachContext;
    match: (path: string, role?: string) => boolean;
    steps: (path: string, role?: string) => CoachStep[];
};

type Props = {
    context: CoachContext;
};

type TargetRect = {
    top: number;
    left: number;
    width: number;
    height: number;
};

type ScrollSnapshot = {
    element: Window | HTMLElement;
    top: number;
    left: number;
};

const guideStoragePrefix = 'indotix.coach-mark.v4.seen';

const pathWithoutQuery = (url: string) => url.split('?')[0] || '/';

const normalizeGuidePath = (path: string) =>
    path
        .replace(/\/\d+(?=\/|$)/g, '/:id')
        .replace(
            /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
            '/:id',
        );

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

const isScrollableElement = (element: Element) => {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;
    return (
        ((overflowY === 'auto' || overflowY === 'scroll') &&
            element.scrollHeight > element.clientHeight) ||
        ((overflowX === 'auto' || overflowX === 'scroll') &&
            element.scrollWidth > element.clientWidth)
    );
};

const captureScrollSnapshot = (): ScrollSnapshot[] => {
    const snapshots: ScrollSnapshot[] = [
        {
            element: window,
            top: window.scrollY,
            left: window.scrollX,
        },
    ];

    document.querySelectorAll<HTMLElement>('body *').forEach((element) => {
        if (!isScrollableElement(element)) return;
        snapshots.push({
            element,
            top: element.scrollTop,
            left: element.scrollLeft,
        });
    });

    return snapshots;
};

const restoreScrollSnapshot = (snapshots: ScrollSnapshot[]) => {
    window.requestAnimationFrame(() => {
        snapshots.forEach((snapshot) => {
            if (snapshot.element === window) {
                window.scrollTo({
                    top: snapshot.top,
                    left: snapshot.left,
                    behavior: 'auto',
                });
                return;
            }

            snapshot.element.scrollTo({
                top: snapshot.top,
                left: snapshot.left,
                behavior: 'auto',
            });
        });
    });
};

const roleLabel = (role?: string) => {
    if (role?.startsWith('admin')) return 'Admin';
    if (role === 'mitra') return 'Mitra';
    if (role === 'user') return 'User';
    return 'Pengguna';
};

const adminDashboardCopy = (role?: string) => {
    return {
        heroTitle: 'Pusat kontrol wisata',
        heroDescription:
            'Bagian ini merangkum operasional wisata INDOTIX: destinasi, tiket, booking, pembayaran, payout, dan review yang perlu dipantau.',
        metricsTitle: 'Angka operasional wisata',
        metricsDescription:
            'Gunakan kartu metrik untuk melihat transaksi hari ini, tiket terjual, dan mitra wisata aktif sebelum membuka modul detail.',
        activityTitle: 'Aktivitas wisata terbaru',
        activityDescription:
            'Area ini membantu admin melihat aktivitas destinasi, booking, pembayaran, atau update mitra wisata terbaru.',
        statusTitle: 'Status sistem yang perlu dicek',
        statusDescription:
            'Pantau verifikasi mitra wisata, pembayaran pending, dan payout pending untuk menentukan pekerjaan prioritas.',
    };
};

const adminDashboardSteps = (role?: string): CoachStep[] => {
    const copy = adminDashboardCopy(role);

    return [
        {
            selector: 'aside a[href="/dashboard"]',
            title: `Dashboard ${roleLabel(role)}`,
            description:
                'Gunakan menu Dashboard untuk kembali ke ringkasan utama sesuai hak akses role Anda.',
        },
        {
            selector: '[data-coach="dashboard-hero"]',
            title: copy.heroTitle,
            description: copy.heroDescription,
        },
        {
            selector: '[data-coach="dashboard-metrics"]',
            title: copy.metricsTitle,
            description: copy.metricsDescription,
        },
        {
            selector: '[data-coach="dashboard-activity"]',
            title: copy.activityTitle,
            description: copy.activityDescription,
        },
        {
            selector: '[data-coach="dashboard-status"]',
            title: copy.statusTitle,
            description: copy.statusDescription,
        },
    ];
};

const mitraDashboardSteps = (): CoachStep[] => [
    {
        selector: 'aside a[href="/mitra/dashboard"]',
        title: 'Dashboard Mitra',
        description:
            'Gunakan menu ini untuk kembali ke ringkasan performa bisnis mitra Anda.',
    },
    {
        selector: '[data-coach="dashboard-hero"]',
        title: 'Ringkasan destinasi Anda',
        description:
            'Bagian ini merangkum status operasional destinasi wisata yang Anda kelola di INDOTIX.',
    },
    {
        selector: '[data-coach="dashboard-onboarding"]',
        title: 'Pilih jenis mitra',
        description:
            'Jika belum memilih jenis mitra, mulai dari kartu ini agar sistem menampilkan alur pendaftaran yang sesuai.',
    },
    {
        selector: '[data-coach="dashboard-verification"]',
        title: 'Status verifikasi mitra',
        description:
            'Pantau status dokumen dan payout. Jika ditolak, perbaiki data dari tombol lengkapi dokumen.',
    },
    {
        selector: '[data-coach="dashboard-metrics"]',
        title: 'Metrik penjualan wisata',
        description:
            'Kartu ini menampilkan booking, tiket terjual, pendapatan, dan status destinasi agar prioritas kerja cepat terlihat.',
    },
    {
        selector: '[data-coach="dashboard-activity"]',
        title: 'Aktivitas tiket terbaru',
        description:
            'Gunakan area ini untuk mengecek booking, pembayaran, validasi QR, atau perubahan terbaru pada destinasi wisata Anda.',
    },
    {
        selector: '[data-coach="dashboard-status"]',
        title: 'Status operasional',
        description:
            'Pantau kondisi yang perlu ditindaklanjuti, seperti verifikasi, pembayaran, payout, atau pekerjaan operasional lain.',
    },
];

const exactPath = (targetPath: string) => (path: string) => path === targetPath;
const startsWithPath = (targetPath: string) => (path: string) =>
    path === targetPath || path.startsWith(`${targetPath}/`);

const affiliateDashboardSteps = (): CoachStep[] => [
    {
        selector: 'aside a[href="/affiliate"]',
        title: 'Dashboard Afiliasi',
        description:
            'Gunakan menu ini untuk kembali ke ringkasan performa afiliasi Anda.',
    },
    {
        selector: '[data-coach="dashboard-hero"]',
        title: 'Ringkasan akun afiliasi',
        description:
            'Bagian ini menampilkan konteks akun afiliasi dan status performa link promosi Anda.',
    },
    {
        selector: '[data-coach="dashboard-metrics"]',
        title: 'Performa link promosi',
        description:
            'Pantau total klik, total booking, dan konversi untuk menilai efektivitas link atau kode afiliasi.',
    },
    {
        selector: '[data-coach="dashboard-status"]',
        title: 'Ringkasan komisi',
        description:
            'Area ini menampilkan total komisi, komisi disetujui, dan komisi pending sebelum Anda membuka menu payout.',
    },
];

const publicHomeSteps = (): CoachStep[] => [
    {
        selector: '[data-coach="public-search"]',
        title: 'Cari tiket wisata',
        description:
            'Masukkan nama destinasi, kota, atau kata kunci wisata untuk langsung menuju pilihan tiket yang relevan.',
    },
    {
        selector: '[data-coach="public-categories"]',
        title: 'Pilih kategori wisata',
        description:
            'Gunakan kategori untuk mempercepat pencarian destinasi seperti alam, budaya, religi, pantai, atau pilihan wisata lain.',
    },
    {
        selector: '[data-coach="home-special-promo"]',
        title: 'Promo Spesial Untukmu',
        description:
            'Video dan gambar promo di bagian ini dapat membawa voucher otomatis ke alur pemesanan ketika pengguna membuka promonya.',
    },
    {
        selector: '[data-coach="home-category-products"]',
        title: 'Produk per kategori',
        description:
            'Destinasi dikelompokkan berdasarkan kategori supaya pengguna bisa membandingkan pilihan wisata tanpa menelusuri semua produk.',
    },
];

const publicWisataSteps = (): CoachStep[] => [
    {
        selector: '[data-coach="public-search"]',
        title: 'Cari destinasi wisata',
        description:
            'Gunakan pencarian untuk menemukan destinasi berdasarkan nama, kota, atau aktivitas yang ingin dikunjungi.',
    },
    {
        selector: '[data-coach="public-categories"]',
        title: 'Saring berdasarkan kategori',
        description:
            'Kategori membantu mempersempit daftar destinasi agar pengguna cepat menemukan tiket wisata yang sesuai minatnya.',
    },
    {
        selector: 'main [data-coach-list], [data-coach="wisata-results"]',
        title: 'Bandingkan pilihan wisata',
        description:
            'Area daftar menampilkan destinasi yang tersedia beserta ringkasan harga atau status tiket sebelum pengguna membuka detail.',
    },
];

const publicWisataDetailSteps = (): CoachStep[] => [
    {
        selector: '[data-coach="wisata-detail-gallery"]',
        title: 'Lihat suasana destinasi',
        description:
            'Galeri membantu calon pengunjung memahami kondisi tempat sebelum memilih tiket.',
    },
    {
        selector: '[data-coach="wisata-detail-info"]',
        title: 'Informasi kunjungan',
        description:
            'Bagian ini memuat deskripsi, alamat, fasilitas, dan informasi penting yang dibutuhkan sebelum memesan.',
    },
    {
        selector: '[data-coach="wisata-ticket-selector"]',
        title: 'Pilih tiket wisata',
        description:
            'Pilih jenis tiket, jumlah, dan tanggal kunjungan dari panel ini sebelum melanjutkan ke checkout.',
    },
];

const publicPromoSteps = (): CoachStep[] => [
    {
        selector: '[data-coach="promo-voucher-list"]',
        title: 'Temukan voucher wisata',
        description:
            'Daftar ini berisi promo yang dapat dipakai untuk mengurangi total pembayaran tiket wisata.',
    },
    {
        selector: '[data-coach="promo-filter"]',
        title: 'Cari promo aktif',
        description:
            'Gunakan pencarian atau filter untuk menemukan kode promo berdasarkan destinasi, kuota, atau masa berlaku.',
    },
];

const publicHistorySteps = (): CoachStep[] => [
    {
        selector: '[data-coach="history-filter"]',
        title: 'Filter status pesanan',
        description:
            'Gunakan filter untuk memisahkan tiket yang masih menunggu pembayaran, sudah lunas, kedaluwarsa, atau dibatalkan.',
    },
    {
        selector: '[data-coach="history-list"]',
        title: 'Riwayat tiket wisata',
        description:
            'Gunakan daftar ini untuk membuka tiket yang sudah dibeli, mengecek status pembayaran, atau melihat detail kunjungan.',
    },
    {
        selector: '[data-coach="public-user-menu"]',
        title: 'Akses akun dan notifikasi',
        description:
            'Menu akun menyimpan akses cepat ke profil, notifikasi, dan riwayat setelah pengguna login.',
    },
];

const adminPublicHomeSteps = (): CoachStep[] => [
    {
        selector: '[data-coach="public-home-tabs"]',
        title: 'Pilih section beranda',
        description:
            'Tab ini memisahkan pengaturan banner mobile, promo spesial, destinasi unggulan, Part of, dan section lain agar konten tidak tercampur.',
    },
    {
        selector: '[data-coach="public-home-active-section"]',
        title: 'Edit konten section aktif',
        description:
            'Area ini hanya menampilkan field untuk tab yang sedang dipilih, sehingga admin bisa fokus mengubah satu bagian beranda.',
    },
    {
        selector: '[data-coach="public-home-special-promo"]',
        title: 'Atur Promo Spesial',
        description:
            'Susun dua video dan tiga gambar promo yang tampil di beranda. Gambar promo bisa diarahkan ke voucher tertentu.',
    },
    {
        selector: '[data-coach="public-home-part-of-logos"]',
        title: 'Kelola logo Part of',
        description:
            'Logo Part of dikelola terpisah dari Partner Kami dan akan berjalan otomatis dalam dua baris pada halaman beranda.',
    },
    {
        selector: '[data-coach="public-home-save"]',
        title: 'Simpan perubahan beranda',
        description:
            'Tekan tombol ini setelah konten, media, atau pengaturan section selesai diubah.',
    },
];

const adminEntryQrSteps = (): CoachStep[] => [
    {
        selector: '[data-coach="entry-qr-text"]',
        title: 'Atur teks poster QR',
        description:
            'Teks di bagian ini digunakan pada poster QR milik mitra. Batas karakter menjaga nama wisata dan instruksi tetap rapi saat dicetak.',
    },
    {
        selector: '[data-coach="entry-qr-images"]',
        title: 'Atur aset visual QR',
        description:
            'Upload logo, background, dan aset pendukung yang akan dipakai pada poster QR masuk seluruh mitra wisata.',
    },
    {
        selector: '[data-coach="entry-qr-save"]',
        title: 'Simpan template QR',
        description:
            'Perubahan template akan dipakai saat mitra membuka preview, mengunduh, atau mencetak QR masuk destinasi.',
    },
];

const adminWisataDestinationSteps = (): CoachStep[] => [
    {
        selector: '[data-coach="admin-wisata-destination-filters"]',
        title: 'Cari destinasi mitra',
        description:
            'Gunakan pencarian, status, dan kota untuk menemukan destinasi yang perlu diverifikasi, dipublish, atau ditinjau.',
    },
    {
        selector: '[data-coach="admin-wisata-destination-table"]',
        title: 'Pantau status destinasi',
        description:
            'Tabel ini memperlihatkan pemilik destinasi, status verifikasi, status live, dan akses detail untuk tindakan admin.',
    },
    {
        selector: '[data-coach="admin-wisata-destination-create"]',
        title: 'Tambahkan destinasi wisata',
        description:
            'Gunakan tombol ini bila admin perlu mendaftarkan destinasi baru atas nama mitra wisata.',
    },
];

const adminWisataTicketSteps = (): CoachStep[] => [
    {
        selector: '[data-coach="admin-wisata-ticket-filters"]',
        title: 'Pilih konteks tiket',
        description:
            'Cari destinasi atau tiket dari sini. Jika destinasi dipilih, halaman berubah menjadi daftar tiket milik destinasi tersebut.',
    },
    {
        selector: '[data-coach="admin-wisata-ticket-destinations"]',
        title: 'Mulai dari destinasi',
        description:
            'Admin memilih destinasi lebih dulu agar pengelolaan tiket tidak tercampur antar mitra wisata.',
    },
    {
        selector: '[data-coach="admin-wisata-ticket-table"]',
        title: 'Kelola tiket destinasi',
        description:
            'Daftar tiket menampilkan harga, kuota, status aktif, dan aksi edit atau hapus untuk destinasi yang sedang dipilih.',
    },
    {
        selector: '[data-coach="admin-wisata-ticket-create"]',
        title: 'Buat tiket wisata',
        description:
            'Gunakan tombol ini untuk menambah tiket biasa atau paket wisata bagi destinasi yang sesuai.',
    },
];

const adminWisataVoucherSteps = (): CoachStep[] => [
    {
        selector: '[data-coach="voucher-create"]',
        title: 'Buat voucher wisata',
        description:
            'Admin dapat membuat voucher untuk semua destinasi atau membatasi pemakaiannya pada produk wisata tertentu.',
    },
    {
        selector: '[data-coach="voucher-list"]',
        title: 'Pantau kuota promo',
        description:
            'Daftar voucher memperlihatkan kode, masa berlaku, kuota, dan status sehingga promo yang tampil di beranda tetap valid.',
    },
];

const mitraDestinationSteps = (): CoachStep[] => [
    {
        selector: '[data-coach="mitra-destination-responsible"]',
        title: 'Kontak operasional',
        description:
            'Isi data penanggung jawab agar admin bisa menghubungi mitra jika ada kebutuhan verifikasi atau kendala tiket.',
    },
    {
        selector: '[data-coach="mitra-destination-info"]',
        title: 'Profil destinasi publik',
        description:
            'Informasi di bagian ini akan dipakai pada halaman destinasi yang dilihat calon pengunjung.',
    },
    {
        selector: '[data-coach="mitra-destination-photo"]',
        title: 'Foto produk wisata',
        description:
            'Foto produk menjadi gambar utama pada kartu wisata di halaman publik, katalog, dan rekomendasi.',
    },
    {
        selector: '[data-coach="mitra-destination-save"]',
        title: 'Ajukan pembaruan',
        description:
            'Simpan perubahan setelah data lengkap. Jika workflow verifikasi aktif, admin akan meninjau data sebelum tampil live.',
    },
];

const mitraTicketSteps = (): CoachStep[] => [
    {
        selector: '[data-coach="mitra-ticket-create"]',
        title: 'Tambah tiket destinasi',
        description:
            'Gunakan tombol ini untuk membuat jenis tiket yang dapat dibeli pengunjung untuk destinasi Anda.',
    },
    {
        selector: '[data-coach="mitra-ticket-table"]',
        title: 'Atur penjualan tiket',
        description:
            'Tabel tiket memuat harga, kuota, batas minimum-maksimum order, dan status aktif untuk setiap produk tiket.',
    },
];

const mitraScanSteps = (): CoachStep[] => [
    {
        selector: '[data-coach="mitra-scan-tabs"]',
        title: 'Pilih QR atau riwayat',
        description:
            'Tab QR dipakai untuk mencetak kode masuk destinasi, sedangkan Data Scan dipakai untuk memantau tiket yang sudah divalidasi pengunjung.',
    },
    {
        selector: '[data-coach="mitra-entry-qr-preview"]',
        title: 'Poster QR masuk',
        description:
            'Cetak dan tempel QR ini di loket atau pintu masuk. Pengunjung akan scan dari aplikasi atau web INDOTIX dan memilih tiket paid miliknya.',
    },
    {
        selector: '[data-coach="mitra-entry-qr-actions"]',
        title: 'Unduh atau cetak QR',
        description:
            'Gunakan tombol PDF atau cetak untuk mendapatkan poster dengan tampilan yang sama seperti preview.',
    },
    {
        selector: '[data-coach="mitra-scan-history-filter"]',
        title: 'Cari riwayat validasi',
        description:
            'Filter riwayat berdasarkan kode booking, nama tamu, tiket, petugas, lokasi, atau tanggal scan.',
    },
    {
        selector: '[data-coach="mitra-scan-history-table"]',
        title: 'Audit scan tiket',
        description:
            'Riwayat scan membantu mitra membedakan tiket yang berhasil divalidasi dan percobaan scan yang gagal atau anomali.',
    },
];

const tourDefinitions: TourDefinition[] = [
    {
        id: 'public.home.v1',
        context: 'public',
        match: exactPath('/'),
        steps: publicHomeSteps,
    },
    {
        id: 'public.wisata.index.v1',
        context: 'public',
        match: exactPath('/wisata'),
        steps: publicWisataSteps,
    },
    {
        id: 'public.wisata.show.v1',
        context: 'public',
        match: (path) =>
            path.startsWith('/wisata/') &&
            !path.startsWith('/wisata/booking'),
        steps: publicWisataDetailSteps,
    },
    {
        id: 'public.promo.v1',
        context: 'public',
        match: startsWithPath('/promo'),
        steps: publicPromoSteps,
    },
    {
        id: 'public.history.v1',
        context: 'public',
        match: startsWithPath('/history'),
        steps: publicHistorySteps,
    },
    {
        id: 'admin.dashboard.v1',
        context: 'admin',
        match: exactPath('/dashboard'),
        steps: (_path, role) => adminDashboardSteps(role),
    },
    {
        id: 'admin.public.home.v1',
        context: 'admin',
        match: exactPath('/admin/public/home'),
        steps: adminPublicHomeSteps,
    },
    {
        id: 'admin.public.entry-qr.v1',
        context: 'admin',
        match: exactPath('/admin/public/entry-qr'),
        steps: adminEntryQrSteps,
    },
    {
        id: 'admin.wisata.destinations.v1',
        context: 'admin',
        match: startsWithPath('/admin/wisata/destinations'),
        steps: adminWisataDestinationSteps,
    },
    {
        id: 'admin.wisata.tickets.v1',
        context: 'admin',
        match: startsWithPath('/admin/wisata/tickets'),
        steps: adminWisataTicketSteps,
    },
    {
        id: 'admin.wisata.vouchers.v1',
        context: 'admin',
        match: exactPath('/admin/wisata/vouchers'),
        steps: adminWisataVoucherSteps,
    },
    {
        id: 'mitra.dashboard.v1',
        context: 'mitra',
        match: exactPath('/mitra/dashboard'),
        steps: mitraDashboardSteps,
    },
    {
        id: 'mitra.wisata.destination.v1',
        context: 'mitra',
        match: exactPath('/mitra/wisata/destination'),
        steps: mitraDestinationSteps,
    },
    {
        id: 'mitra.wisata.tickets.v1',
        context: 'mitra',
        match: startsWithPath('/mitra/wisata/tickets'),
        steps: mitraTicketSteps,
    },
    {
        id: 'mitra.wisata.scans.v1',
        context: 'mitra',
        match: exactPath('/mitra/wisata/scans'),
        steps: mitraScanSteps,
    },
    {
        id: 'affiliate.dashboard.v1',
        context: 'affiliate',
        match: exactPath('/affiliate'),
        steps: affiliateDashboardSteps,
    },
];

const findTourDefinition = (
    context: CoachContext,
    path: string,
    role?: string,
): TourDefinition | undefined => {
    const normalizedPath = normalizeGuidePath(path);
    return tourDefinitions.find(
        (tour) =>
            tour.context === context &&
            (tour.match(path, role) || tour.match(normalizedPath, role)),
    );
};

const buildSteps = (
    context: CoachContext,
    path: string,
    role?: string,
): CoachStep[] => {
    const definition = findTourDefinition(context, path, role);

    return definition?.steps(path, role) ?? [];
};

export default function CoachMarks({ context }: Props) {
    const page = usePage();
    const path = pathWithoutQuery(page.url ?? window.location.pathname);
    const role = (page.props as { auth?: { user?: { role?: string } } }).auth
        ?.user?.role;
    const guidePath = normalizeGuidePath(path);
    const tourDefinition = useMemo(
        () => findTourDefinition(context, path, role),
        [context, path, role],
    );
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [rect, setRect] = useState<TargetRect | null>(null);
    const seenKey = `${guideStoragePrefix}.${context}.${role ?? 'guest'}.${tourDefinition?.id ?? guidePath}`;
    const availableStepsRef = useRef<CoachStep[]>([]);
    const targetUpdateTokenRef = useRef(0);
    const scrollSnapshotRef = useRef<ScrollSnapshot[] | null>(null);

    const steps = useMemo(
        () => buildSteps(context, path, role),
        [context, path, role],
    );

    const resolveAvailableSteps = () =>
        steps.filter((step) => {
            const element = document.querySelector(step.selector);
            if (!element) return false;
            const elementRect = element.getBoundingClientRect();
            return elementRect.width > 0 && elementRect.height > 0;
        });

    const updateTargetRect = (index: number) => {
        const token = targetUpdateTokenRef.current + 1;
        targetUpdateTokenRef.current = token;
        setRect(null);

        const availableSteps = availableStepsRef.current;
        const step = availableSteps[index];
        if (!step) {
            return;
        }

        const element = document.querySelector(step.selector);
        if (!element) {
            return;
        }

        const elementRect = element.getBoundingClientRect();
        const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
        const viewportHeight =
            window.visualViewport?.height ?? window.innerHeight;
        const isFullyVisible =
            elementRect.top >= 12 &&
            elementRect.left >= 12 &&
            elementRect.bottom <= viewportHeight - 12 &&
            elementRect.right <= viewportWidth - 12;

        if (!isFullyVisible) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
            });
        }

        window.setTimeout(() => {
            if (targetUpdateTokenRef.current !== token) return;

            const currentStep = availableStepsRef.current[index];
            const currentElement = currentStep
                ? document.querySelector(currentStep.selector)
                : null;
            if (!currentElement || currentElement !== element) return;

            const elementRect = currentElement.getBoundingClientRect();
            setRect({
                top: elementRect.top,
                left: elementRect.left,
                width: elementRect.width,
                height: elementRect.height,
            });
        }, 220);
    };

    const measureTargetRect = (index: number) => {
        const availableSteps = availableStepsRef.current;
        const step = availableSteps[index];
        if (!step) return;

        const element = document.querySelector(step.selector);
        if (!element) return;

        window.requestAnimationFrame(() => {
            const elementRect = element.getBoundingClientRect();
            setRect({
                top: elementRect.top,
                left: elementRect.left,
                width: elementRect.width,
                height: elementRect.height,
            });
        });
    };

    const startGuide = (force = false) => {
        const availableSteps = resolveAvailableSteps();
        availableStepsRef.current = availableSteps;
        if (availableSteps.length === 0) return;

        if (!force && window.localStorage.getItem(seenKey) === '1') {
            return;
        }

        scrollSnapshotRef.current = captureScrollSnapshot();
        setActiveIndex(0);
        setOpen(true);
        updateTargetRect(0);
    };

    const closeGuide = () => {
        window.localStorage.setItem(seenKey, '1');
        setOpen(false);
        setRect(null);
        if (scrollSnapshotRef.current) {
            restoreScrollSnapshot(scrollSnapshotRef.current);
            scrollSnapshotRef.current = null;
        }
    };

    useEffect(() => {
        setOpen(false);
        setRect(null);
        setActiveIndex(0);
        scrollSnapshotRef.current = null;

        const timer = window.setTimeout(() => startGuide(false), 850);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, context, role]);

    useEffect(() => {
        if (!open) return undefined;

        const handleReposition = () => measureTargetRect(activeIndex);
        const currentStep = availableStepsRef.current[activeIndex];
        const target = currentStep
            ? document.querySelector(currentStep.selector)
            : null;
        const resizeObserver =
            target && 'ResizeObserver' in window
                ? new ResizeObserver(() => measureTargetRect(activeIndex))
                : null;

        if (target && resizeObserver) {
            resizeObserver.observe(target);
        }

        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);
        window.visualViewport?.addEventListener('resize', handleReposition);
        window.visualViewport?.addEventListener('scroll', handleReposition);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
            window.visualViewport?.removeEventListener(
                'resize',
                handleReposition,
            );
            window.visualViewport?.removeEventListener(
                'scroll',
                handleReposition,
            );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, activeIndex]);

    const availableSteps = availableStepsRef.current;
    const activeStep = availableSteps[activeIndex];
    const hasNext = activeIndex < availableSteps.length - 1;
    const hasPrevious = activeIndex > 0;

    const goToStep = (nextIndex: number) => {
        setActiveIndex(nextIndex);
        updateTargetRect(nextIndex);
    };

    const overlayMetrics = (() => {
        if (!rect) return {};

        const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
        const viewportHeight =
            window.visualViewport?.height ?? window.innerHeight;
        const safeInset = 16;
        const bubbleWidth = Math.min(340, viewportWidth - safeInset * 2);
        const bubbleMaxHeight = Math.min(360, viewportHeight - safeInset * 2);
        const estimatedBubbleHeight = 236;
        const preferredTop = rect.top + rect.height + 18;
        const spaceBelow = viewportHeight - preferredTop - safeInset;
        const spaceAbove = rect.top - safeInset - 18;
        const placeAbove =
            spaceBelow < estimatedBubbleHeight && spaceAbove > spaceBelow;
        const rawTop = placeAbove
            ? rect.top - estimatedBubbleHeight - 18
            : preferredTop;
        const top = clamp(
            rawTop,
            safeInset,
            Math.max(
                safeInset,
                viewportHeight - estimatedBubbleHeight - safeInset,
            ),
        );
        const left = clamp(
            rect.left,
            safeInset,
            Math.max(safeInset, viewportWidth - bubbleWidth - safeInset),
        );
        const highlightLeft = clamp(
            rect.left - 8,
            8,
            Math.max(8, viewportWidth - 24),
        );
        const highlightTop = clamp(
            rect.top - 8,
            8,
            Math.max(8, viewportHeight - 24),
        );
        const highlightWidth = Math.max(
            0,
            Math.min(rect.width + 16, viewportWidth - highlightLeft - 8),
        );
        const highlightHeight = Math.max(
            0,
            Math.min(rect.height + 16, viewportHeight - highlightTop - 8),
        );

        return {
            bubble: {
                top,
                left,
                width: bubbleWidth,
                maxHeight: bubbleMaxHeight,
            },
            highlight: {
                top: highlightTop,
                left: highlightLeft,
                width: highlightWidth,
                height: highlightHeight,
            },
        };
    })();
    const launcherPositionClass =
        context === 'public'
            ? 'left-4 bottom-4 md:left-5 md:bottom-5'
            : 'right-5 bottom-5';
    const launcherSizeClass =
        context === 'public'
            ? 'h-10 w-10 justify-center p-0 md:h-auto md:w-auto md:px-4 md:py-3'
            : 'px-4 py-3';
    const launcherZIndexClass = context === 'public' ? 'z-[40]' : 'z-[110]';

    if (steps.length === 0) {
        return null;
    }

    return (
        <>
            {open && activeStep && rect && (
                <div className="pointer-events-none fixed inset-0 z-[120]">
                    <div className="absolute inset-0 bg-slate-950/35" />
                    <div
                        className="absolute rounded-2xl border-2 border-sky-400 bg-white/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.35),0_22px_60px_-20px_rgba(14,165,233,0.75)] transition-all duration-200"
                        style={
                            'highlight' in overlayMetrics
                                ? overlayMetrics.highlight
                                : undefined
                        }
                    />
                    <div
                        className="pointer-events-auto absolute overflow-y-auto rounded-2xl border border-sky-100 bg-white p-4 text-slate-800 shadow-2xl"
                        style={
                            'bubble' in overlayMetrics
                                ? overlayMetrics.bubble
                                : undefined
                        }
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-xs font-bold text-sky-600 uppercase">
                                    Panduan {activeIndex + 1}/
                                    {availableSteps.length}
                                </div>
                                <h3 className="mt-1 text-base font-bold text-slate-950">
                                    {activeStep.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                onClick={closeGuide}
                                aria-label="Tutup panduan"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            {activeStep.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between gap-2">
                            <button
                                type="button"
                                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={!hasPrevious}
                                onClick={() => goToStep(activeIndex - 1)}
                            >
                                Sebelumnya
                            </button>
                            <div className="flex gap-1">
                                {availableSteps.map((step, index) => (
                                    <button
                                        key={`${step.title}-${index}`}
                                        type="button"
                                        aria-label={`Buka panduan ${index + 1}`}
                                        className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-sky-500' : 'w-2 bg-slate-200'}`}
                                        onClick={() => goToStep(index)}
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
                                onClick={() => {
                                    if (hasNext) {
                                        goToStep(activeIndex + 1);
                                        return;
                                    }
                                    closeGuide();
                                }}
                            >
                                {hasNext ? 'Lanjut' : 'Selesai'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                type="button"
                className={`public-guide-launcher fixed ${launcherPositionClass} ${launcherSizeClass} ${launcherZIndexClass} inline-flex items-center gap-2 rounded-full bg-sky-600 text-sm font-bold text-white shadow-[0_18px_50px_-18px_rgba(2,132,199,0.9)] transition hover:bg-sky-700`}
                onClick={() => startGuide(true)}
                aria-label="Tampilkan panduan halaman"
            >
                <HelpCircle className="h-5 w-5" />
                <span className="hidden sm:inline">Panduan</span>
            </button>
        </>
    );
}
