import { usePage } from '@inertiajs/react';
import { HelpCircle, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type CoachContext = 'admin' | 'mitra' | 'public' | 'affiliate';

type CoachStep = {
    selector: string;
    title: string;
    description: string;
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

const quoteSelectorValue = (value: string) =>
    value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

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
    if (role === 'admin') return 'Admin Utama';
    if (role === 'admin_academy') return 'Admin Academy';
    if (role === 'admin_retail') return 'Admin Retail Shop';
    if (role === 'admin_special_program') return 'Admin Special Program';
    if (role === 'mitra') return 'Mitra';
    if (role === 'user') return 'User';
    return 'Pengguna';
};

const adminSectionLabel = (path: string) => {
    if (path.startsWith('/admin/academy')) return 'Eljohn Academy';
    if (path.startsWith('/admin/retail-shop')) return 'Retail Shop';
    if (path.startsWith('/admin/special-programs')) return 'Special Program';
    if (path.startsWith('/admin/events')) return 'Event';
    if (path.startsWith('/admin/wisata')) return 'Wisata';
    if (
        path.startsWith('/hotels') ||
        path.startsWith('/room-types') ||
        path.startsWith('/room-inventories')
    )
        return 'Hotel';
    if (path.startsWith('/admin/public')) return 'Konten Publik';
    if (path.startsWith('/admin/system')) return 'Sistem, Audit & Kontrol';
    if (path.startsWith('/admin/mitra')) return 'Kelola Mitra';
    if (path.startsWith('/admin/users')) return 'Kelola User';
    return 'Panel Admin';
};

const mitraSectionLabel = (path: string) => {
    if (path.startsWith('/mitra/events')) return 'Event';
    if (path.startsWith('/mitra/wisata')) return 'Wisata';
    if (path.startsWith('/mitra/hotels') || path.startsWith('/mitra/room'))
        return 'Hotel';
    if (path.startsWith('/mitra/finance')) return 'Keuangan';
    return 'Panel Mitra';
};

const publicSectionLabel = (path: string) => {
    if (path.startsWith('/events')) return 'Event';
    if (path.startsWith('/stay')) return 'Hotel';
    if (path.startsWith('/wisata')) return 'Wisata';
    if (path.startsWith('/academy')) return 'Academy';
    if (path.startsWith('/special-programs')) return 'Special Program';
    if (path.startsWith('/retail-shop')) return 'Retail Shop';
    if (path.startsWith('/history')) return 'Riwayat';
    return 'INDOTIX';
};

const adminPagePurpose = (path: string) => {
    if (path.startsWith('/admin/chat')) {
        return {
            title: 'Pantau percakapan pengguna',
            description:
                'Gunakan halaman ini untuk membaca pesan masuk, melihat konteks percakapan, dan merespons kebutuhan pengguna dengan cepat.',
            list: 'Daftar percakapan menampilkan user yang menghubungi admin. Buka salah satu percakapan untuk melihat isi chat dan membalas pesan.',
        };
    }
    if (path.startsWith('/admin/users')) {
        return {
            title: 'Kelola akun pengguna',
            description:
                'Periksa status, verifikasi, detail akun, dan aktivitas pengguna dari halaman ini.',
            list: 'Tabel user menampilkan akun yang terdaftar. Gunakan tombol Detail untuk melihat profil user dan tombol Hapus hanya jika akun memang perlu dihapus.',
        };
    }
    if (path.startsWith('/admin/reviews')) {
        return {
            title: 'Moderasi ulasan produk',
            description:
                'Pantau ulasan dari pengguna agar kualitas informasi produk tetap terjaga.',
            list: 'Tabel ulasan menampilkan rating, komentar, dan produk terkait. Gunakan aksi balas, sembunyikan, atau hapus sesuai kebutuhan moderasi.',
        };
    }
    if (path.startsWith('/admin/events')) {
        return {
            title: 'Kelola operasional event',
            description:
                'Atur event, tiket, booking, peserta, QR scan, review, hingga laporan event dari modul ini.',
            list: 'Tabel event/transaksi menampilkan data operasional. Gunakan Tambah Event untuk membuat event baru, Detail untuk mengecek data, Edit untuk memperbarui, dan Hapus hanya jika data belum dipakai transaksi.',
        };
    }
    if (path.startsWith('/admin/wisata')) {
        return {
            title: 'Kelola produk wisata',
            description:
                'Gunakan modul ini untuk mengelola destinasi, tiket, booking, validasi QR, dan operasional wisata.',
            list: 'Tabel wisata/tiket/booking membantu admin memantau operasional. Gunakan Tambah untuk membuat data baru, Detail/Edit untuk koreksi data, dan Hapus secara hati-hati.',
        };
    }
    if (path.startsWith('/admin/special-programs')) {
        return {
            title: 'Kelola special program',
            description:
                'Atur program, tiket, booking, peserta, QR scan, serta ulasan special program dari halaman ini.',
            list: 'Tabel program menampilkan paket dan statusnya. Gunakan Buat Paket untuk menambah program, Detail/Edit untuk meninjau isi paket, dan Hapus jika program tidak lagi digunakan.',
        };
    }
    if (path.startsWith('/admin/academy')) {
        return {
            title: 'Kelola kelas academy',
            description:
                'Atur kelas, tiket, booking, peserta, scan kehadiran, dan laporan academy dari modul ini.',
            list: 'Tabel kelas/tiket/booking membantu admin memantau jadwal dan kapasitas. Gunakan Buat Kelas atau Tambah Tiket bila tersedia, lalu pakai Detail/Edit untuk memastikan data sudah benar.',
        };
    }
    if (path.startsWith('/admin/retail-shop')) {
        return {
            title: 'Kelola retail shop',
            description:
                'Atur produk, kategori, stok, order, pengiriman, refund, promo, dan laporan retail dari modul ini.',
            list: 'Tabel produk/order menampilkan stok dan status transaksi. Gunakan Tambah Produk untuk menambah item, Edit untuk memperbarui katalog, dan aksi order untuk memproses pesanan.',
        };
    }
    if (path.startsWith('/admin/public')) {
        return {
            title: 'Kelola konten publik',
            description:
                'Gunakan halaman ini untuk memperbarui banner, promo, FAQ, kontak, partner, dan informasi publik.',
            list: 'Tabel konten menampilkan materi yang tampil di sisi pengguna. Gunakan Tambah untuk membuat konten baru, Edit untuk memperbarui, dan Hapus untuk konten yang tidak perlu tampil lagi.',
        };
    }
    if (path.startsWith('/admin/system')) {
        return {
            title: 'Kelola sistem dan akses',
            description:
                'Pantau audit, konfigurasi, notifikasi, role, dan akun admin spesialis dari modul ini.',
            list: 'Tabel sistem membantu admin mengelola role, admin spesialis, audit, dan konfigurasi. Gunakan Edit/Simpan untuk perubahan akses dan Hapus hanya jika akun atau data sudah tidak diperlukan.',
        };
    }

    return {
        title: 'Pantau ringkasan operasional',
        description:
            'Gunakan halaman ini untuk melihat kondisi terbaru sistem dan memilih modul yang perlu ditindaklanjuti.',
        list: 'Area ini menampilkan ringkasan atau tabel utama. Gunakan tombol Detail untuk meninjau data dan tombol aksi untuk memproses pekerjaan yang tersedia.',
    };
};

const mitraPagePurpose = (path: string) => {
    if (path.startsWith('/mitra/events')) {
        return {
            title: 'Kelola event Anda',
            description:
                'Atur informasi event, tiket, booking, peserta, QR scan, ulasan, dan laporan dari menu event.',
            list: 'Tabel event dan booking membantu Anda memantau transaksi. Gunakan tombol tambah untuk membuat data, Detail/Edit untuk koreksi, dan scan QR untuk validasi peserta.',
        };
    }
    if (path.startsWith('/mitra/wisata')) {
        return {
            title: 'Kelola destinasi wisata',
            description:
                'Atur profil destinasi, tiket, booking, validasi QR, ulasan, dan laporan wisata dari modul ini.',
            list: 'Tabel wisata menampilkan tiket, booking, dan aktivitas kunjungan. Gunakan Detail/Edit untuk memperbarui data dan QR scan untuk validasi tiket.',
        };
    }
    if (path.startsWith('/mitra/hotels') || path.startsWith('/mitra/room')) {
        return {
            title: 'Kelola hotel dan kamar',
            description:
                'Atur profil hotel, tipe kamar, ketersediaan, booking, ulasan, dan pendapatan dari modul hotel.',
            list: 'Tabel hotel/kamar/inventory membantu Anda mengatur ketersediaan. Gunakan Tambah untuk membuat tipe kamar, Edit untuk memperbarui data, dan Detail untuk melihat transaksi.',
        };
    }
    if (path.startsWith('/mitra/finance')) {
        return {
            title: 'Pantau keuangan mitra',
            description:
                'Lihat ringkasan pendapatan, payout, dan rekening agar proses pencairan tetap jelas.',
            list: 'Tabel keuangan menampilkan transaksi dan payout. Gunakan detail status untuk mencocokkan pendapatan dan proses pencairan.',
        };
    }

    return {
        title: 'Pantau operasional mitra',
        description:
            'Gunakan halaman ini untuk melihat data penting dan memilih pekerjaan yang perlu diproses.',
        list: 'Area ini menampilkan tabel atau kartu operasional. Gunakan tombol Detail/Edit/Simpan untuk memproses data yang tersedia.',
    };
};

const adminDashboardCopy = (role?: string) => {
    if (role === 'admin_academy') {
        return {
            heroTitle: 'Ringkasan operasional Academy',
            heroDescription:
                'Bagian ini menunjukkan fokus dashboard Academy: booking kelas, tiket kelas, dan kelas aktif yang perlu dipantau hari ini.',
            metricsTitle: 'Angka penting Academy',
            metricsDescription:
                'Gunakan kartu ini untuk melihat booking hari ini, tiket kelas terjual, dan jumlah kelas aktif sebelum membuka modul detail.',
            activityTitle: 'Aktivitas kelas terbaru',
            activityDescription:
                'Pantau aktivitas terbaru seperti booking, pembayaran, atau perubahan data kelas agar tindak lanjut tidak tertunda.',
            statusTitle: 'Status yang perlu ditindaklanjuti',
            statusDescription:
                'Area ini menampilkan pembayaran, review, atau refund yang perlu dicek oleh admin Academy.',
        };
    }

    if (role === 'admin_retail') {
        return {
            heroTitle: 'Ringkasan operasional Retail Shop',
            heroDescription:
                'Bagian ini merangkum order, item terjual, dan produk aktif untuk membantu admin retail menentukan prioritas kerja.',
            metricsTitle: 'Angka penting Retail Shop',
            metricsDescription:
                'Gunakan kartu ini untuk memantau order hari ini, item terjual, dan produk aktif sebelum membuka modul produk atau order.',
            activityTitle: 'Aktivitas order terbaru',
            activityDescription:
                'Pantau order, stok, refund, atau pengiriman terbaru agar proses fulfillment tetap lancar.',
            statusTitle: 'Status order dan refund',
            statusDescription:
                'Area ini membantu menemukan pembayaran, refund, atau pekerjaan retail yang membutuhkan tindak lanjut cepat.',
        };
    }

    if (role === 'admin_special_program') {
        return {
            heroTitle: 'Ringkasan Special Program',
            heroDescription:
                'Bagian ini merangkum booking, tiket terjual, dan program aktif yang sedang berjalan.',
            metricsTitle: 'Angka penting Special Program',
            metricsDescription:
                'Gunakan kartu ini untuk melihat booking hari ini, tiket terjual, dan jumlah program aktif.',
            activityTitle: 'Aktivitas program terbaru',
            activityDescription:
                'Pantau booking, peserta, scan QR, atau perubahan status program terbaru dari area ini.',
            statusTitle: 'Status booking dan review',
            statusDescription:
                'Area ini menampilkan pembayaran, review, atau refund yang perlu ditindaklanjuti admin Special Program.',
        };
    }

    return {
        heroTitle: 'Pusat kontrol Admin Utama',
        heroDescription:
            'Bagian ini merangkum kondisi operasional INDOTIX lintas produk: transaksi, tiket, mitra, pembayaran, payout, dan review.',
        metricsTitle: 'Angka operasional utama',
        metricsDescription:
            'Gunakan kartu metrik untuk melihat transaksi hari ini, tiket terjual, dan mitra aktif sebelum membuka modul detail.',
        activityTitle: 'Aktivitas platform terbaru',
        activityDescription:
            'Area ini membantu admin melihat aktivitas terbaru agar perubahan penting tidak terlewat.',
        statusTitle: 'Status sistem yang perlu dicek',
        statusDescription:
            'Pantau review mitra, pembayaran pending, dan payout pending untuk menentukan pekerjaan prioritas.',
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
        title: 'Ringkasan performa mitra',
        description:
            'Bagian ini menyesuaikan isi dashboard dengan jenis mitra: hotel, wisata, atau event.',
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
        title: 'Metrik bisnis utama',
        description:
            'Kartu ini menampilkan angka penting seperti booking, penjualan tiket, pendapatan, atau kapasitas sesuai jenis mitra.',
    },
    {
        selector: '[data-coach="dashboard-activity"]',
        title: 'Aktivitas terbaru',
        description:
            'Gunakan area ini untuk mengecek booking, pembayaran, validasi QR, atau perubahan terbaru pada produk Anda.',
    },
    {
        selector: '[data-coach="dashboard-status"]',
        title: 'Status operasional',
        description:
            'Pantau kondisi yang perlu ditindaklanjuti, seperti verifikasi, pembayaran, payout, atau pekerjaan operasional lain.',
    },
];

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

const buildSteps = (
    context: CoachContext,
    path: string,
    role?: string,
): CoachStep[] => {
    const quotedPath = quoteSelectorValue(path);
    const currentMenuSelector = `aside a[href="${quotedPath}"], a[data-coach-current="true"]`;

    if (context === 'admin' && path === '/dashboard') {
        return adminDashboardSteps(role);
    }

    if (context === 'mitra' && path === '/mitra/dashboard') {
        return mitraDashboardSteps();
    }

    if (context === 'affiliate' && path === '/affiliate') {
        return affiliateDashboardSteps();
    }

    if (context === 'public') {
        const label = publicSectionLabel(path);

        return [
            {
                selector: '[data-coach="public-search"]',
                title: 'Cari produk lebih cepat',
                description:
                    'Gunakan kolom ini untuk mencari event, hotel, wisata, academy, special program, atau produk retail.',
            },
            {
                selector: '[data-coach="public-categories"]',
                title: 'Jelajahi kategori',
                description: `Pilih kategori untuk mulai menemukan produk ${label} tanpa harus mengetik kata kunci.`,
            },
            {
                selector: 'main [data-coach-list], main table',
                title: 'Lihat rekomendasi dan daftar produk',
                description:
                    'Area ini menampilkan produk, rekomendasi, atau riwayat yang bisa langsung dibuka untuk melihat detail.',
            },
            {
                selector:
                    '[data-coach="public-cart"], [data-coach="public-user-menu"]',
                title: 'Akses transaksi dan akun',
                description:
                    'Gunakan menu ini untuk membuka keranjang, riwayat, notifikasi, chat, atau profil akun.',
            },
        ];
    }

    if (context === 'affiliate') {
        return [
            {
                selector: 'aside',
                title: 'Menu Affiliate',
                description:
                    'Gunakan menu samping untuk membuka katalog, link promosi, komisi, payout, dan bantuan.',
            },
            {
                selector: 'main h1, main h2, main h3',
                title: 'Fokus halaman affiliate',
                description:
                    'Bagian ini menjelaskan konteks pekerjaan, seperti membuat link promosi, melihat komisi, atau mengajukan payout.',
            },
            {
                selector: 'main section, main [class*="grid"]',
                title: 'Ringkasan affiliate',
                description:
                    'Kartu informasi menampilkan status, angka penting, atau ringkasan aktivitas affiliate yang perlu dipantau.',
            },
            {
                selector: 'main table, main form',
                title: 'Data dan pekerjaan utama',
                description:
                    'Area ini berisi katalog, link promosi, riwayat komisi, atau form yang perlu Anda isi.',
            },
        ];
    }

    if (context === 'mitra') {
        const label = mitraSectionLabel(path);
        const purpose = mitraPagePurpose(path);

        return [
            {
                selector: currentMenuSelector,
                title: `Menu ${label}`,
                description:
                    'Gunakan menu yang sedang aktif ini untuk memahami posisi Anda di panel mitra dan berpindah ke pekerjaan terkait.',
            },
            {
                selector: 'main h1, [role="main"] h1, h1',
                title: purpose.title,
                description: purpose.description,
            },
            {
                selector: 'main section, main [class*="grid"]',
                title: 'Ringkasan dan kartu informasi',
                description:
                    'Kartu di halaman ini menampilkan status, angka penting, atau informasi operasional yang perlu dipantau sebelum membuka detail.',
            },
            {
                selector:
                    'main form, input[placeholder*="Cari"], input[name="search"], select[name="status"]',
                title: 'Temukan data yang perlu diproses',
                description:
                    'Gunakan pencarian dan filter untuk mempersempit data berdasarkan status, tanggal, nama produk, atau transaksi.',
            },
            {
                selector: 'main table, main [data-coach-list]',
                title: 'Tabel dan aksi data',
                description: purpose.list,
            },
            {
                selector: 'main a[href$="/create"], main button[type="submit"]',
                title: 'Tambah atau simpan data',
                description:
                    'Gunakan tombol ini untuk membuat data baru atau menyimpan perubahan setelah form diisi dengan benar.',
            },
            {
                selector: 'main table a, main table button',
                title: 'Detail dan aksi baris',
                description:
                    'Tombol pada setiap baris digunakan untuk membuka detail, mengedit, memproses, atau menghapus data sesuai kebutuhan.',
            },
            {
                selector:
                    'main table button[class*="rose"], main table button[class*="red"], main button[class*="rose"], main button[class*="red"]',
                title: 'Aksi hapus atau batal',
                description:
                    'Tombol berwarna merah biasanya untuk menghapus, membatalkan, atau menolak data. Pastikan data sudah benar sebelum melanjutkan aksi ini.',
            },
        ];
    }

    const adminLabel = adminSectionLabel(path);
    const purpose = adminPagePurpose(path);

    return [
        {
            selector: currentMenuSelector,
            title: `Navigasi ${roleLabel(role)}`,
            description: `Anda sedang berada di area ${adminLabel}. Gunakan menu ini untuk memahami konteks modul yang sedang dikelola.`,
        },
        {
            selector: 'main h1, [role="main"] h1, h1',
            title: purpose.title,
            description: purpose.description,
        },
        {
            selector: 'main section, main [class*="grid"]',
            title: 'Ringkasan dan kartu informasi',
            description:
                'Kartu di halaman ini menampilkan status, jumlah data, atau informasi penting. Gunakan ringkasan ini untuk menentukan bagian mana yang perlu dicek lebih dulu.',
        },
        {
            selector:
                'main form, input[placeholder*="Cari"], input[name="search"], select[name="status"]',
            title: 'Saring data sebelum diproses',
            description:
                'Gunakan pencarian dan filter untuk menemukan data tertentu tanpa harus menelusuri semua baris.',
        },
        {
            selector: 'main table, main [data-coach-list]',
            title: 'Tabel dan aksi data',
            description: purpose.list,
        },
        {
            selector: 'main a[href$="/create"], main button[type="submit"]',
            title: 'Tambah atau simpan data',
            description:
                'Gunakan tombol ini untuk membuat data baru atau menyimpan perubahan. Pastikan field wajib sudah terisi sebelum menyimpan.',
        },
        {
            selector: 'main table a, main table button',
            title: 'Detail, edit, dan proses data',
            description:
                'Tombol pada baris tabel digunakan untuk membuka detail, mengedit data, memproses booking/order, mengubah status, atau menjalankan aksi operasional lainnya.',
        },
        {
            selector:
                'main table button[class*="rose"], main table button[class*="red"], main button[class*="rose"], main button[class*="red"]',
            title: 'Hapus atau aksi berisiko',
            description:
                'Tombol berwarna merah biasanya berdampak besar seperti hapus, batal, refund, atau tolak. Gunakan hanya setelah data benar-benar dipastikan.',
        },
    ];
};

export default function CoachMarks({ context }: Props) {
    const page = usePage();
    const path = pathWithoutQuery(page.url ?? window.location.pathname);
    const role = (page.props as { auth?: { user?: { role?: string } } }).auth
        ?.user?.role;
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [rect, setRect] = useState<TargetRect | null>(null);
    const seenKey = `${guideStoragePrefix}.${context}.${role ?? 'guest'}.${path}`;
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
                className="fixed right-5 bottom-5 z-[110] inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-[0_18px_50px_-18px_rgba(2,132,199,0.9)] transition hover:bg-sky-700"
                onClick={() => startGuide(true)}
                aria-label="Tampilkan panduan halaman"
            >
                <HelpCircle className="h-5 w-5" />
                <span className="hidden sm:inline">Panduan</span>
            </button>
        </>
    );
}
