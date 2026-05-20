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

const guideStoragePrefix = 'indotix.coach-mark.seen';

const pathWithoutQuery = (url: string) => url.split('?')[0] || '/';

const quoteSelectorValue = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

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
    if (path.startsWith('/hotels') || path.startsWith('/room-types') || path.startsWith('/room-inventories')) return 'Hotel';
    if (path.startsWith('/admin/public')) return 'Konten Publik';
    if (path.startsWith('/admin/system')) return 'Sistem, Audit & Kontrol';
    if (path.startsWith('/admin/mitra')) return 'Kelola Mitra';
    if (path.startsWith('/admin/users')) return 'Kelola User';
    return 'Panel Admin';
};

const mitraSectionLabel = (path: string) => {
    if (path.startsWith('/mitra/events')) return 'Event';
    if (path.startsWith('/mitra/wisata')) return 'Wisata';
    if (path.startsWith('/mitra/hotels') || path.startsWith('/mitra/room')) return 'Hotel';
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

const buildSteps = (context: CoachContext, path: string, role?: string): CoachStep[] => {
    const quotedPath = quoteSelectorValue(path);
    const currentMenuSelector = `aside a[href="${quotedPath}"], a[data-coach-current="true"]`;

    if (context === 'public') {
        const label = publicSectionLabel(path);

        return [
            {
                selector: '[data-coach="public-search"]',
                title: 'Cari produk lebih cepat',
                description: 'Gunakan kolom ini untuk mencari event, hotel, wisata, academy, special program, atau produk retail.',
            },
            {
                selector: '[data-coach="public-categories"]',
                title: 'Jelajahi kategori',
                description: `Pilih kategori untuk mulai menemukan produk ${label} tanpa harus mengetik kata kunci.`,
            },
            {
                selector: 'main [data-coach-list], main table, main [class*="grid"]',
                title: 'Lihat rekomendasi dan daftar produk',
                description: 'Area ini menampilkan produk, rekomendasi, atau riwayat yang bisa langsung dibuka untuk melihat detail.',
            },
            {
                selector: '[data-coach="public-cart"], [data-coach="public-user-menu"]',
                title: 'Akses transaksi dan akun',
                description: 'Gunakan menu ini untuk membuka keranjang, riwayat, notifikasi, chat, atau profil akun.',
            },
        ];
    }

    if (context === 'affiliate') {
        return [
            {
                selector: 'aside',
                title: 'Menu Affiliate',
                description: 'Gunakan menu samping untuk membuka katalog, link promosi, komisi, payout, dan bantuan.',
            },
            {
                selector: 'main h1, main h2, main h3',
                title: 'Informasi halaman',
                description: 'Bagian ini menjelaskan fungsi halaman yang sedang dibuka.',
            },
            {
                selector: 'main a[href], main button',
                title: 'Aksi utama',
                description: 'Tombol dan link di area ini digunakan untuk membuat link, melihat detail, atau mengelola data affiliate.',
            },
        ];
    }

    if (context === 'mitra') {
        const label = mitraSectionLabel(path);

        return [
            {
                selector: currentMenuSelector,
                title: `Menu ${label}`,
                description: 'Menu samping membantu Anda berpindah ke data produk, booking, QR scan, ulasan, dan keuangan sesuai jenis mitra.',
            },
            {
                selector: 'main h1, [role="main"] h1, h1',
                title: 'Ringkasan halaman',
                description: `Bagian ini memberi konteks pekerjaan utama untuk fitur ${label}.`,
            },
            {
                selector: 'main form, input[placeholder*="Cari"], input[name="search"], select[name="status"]',
                title: 'Filter dan pencarian',
                description: 'Gunakan pencarian atau filter untuk menemukan data lebih cepat sebelum melakukan aksi.',
            },
            {
                selector: 'main a[href$="/create"], main button[type="submit"], main button',
                title: 'Aksi operasional',
                description: 'Gunakan tombol aksi untuk menambah, menyimpan, memproses, memvalidasi, atau memperbarui data.',
            },
            {
                selector: 'main table, main [data-coach-list]',
                title: 'Daftar data',
                description: 'Data utama halaman ditampilkan di sini. Buka detail atau gunakan aksi pada tiap baris bila tersedia.',
            },
        ];
    }

    const adminLabel = adminSectionLabel(path);

    return [
        {
            selector: currentMenuSelector,
            title: `Navigasi ${roleLabel(role)}`,
            description: `Menu ini membawa Anda ke area ${adminLabel}. Gunakan sidebar untuk berpindah antar modul operasional.`,
        },
        {
            selector: 'main h1, [role="main"] h1, h1',
            title: `Halaman ${adminLabel}`,
            description: 'Judul dan deskripsi halaman menjelaskan data yang sedang dikelola.',
        },
        {
            selector: 'main form, input[placeholder*="Cari"], input[name="search"], select[name="status"]',
            title: 'Pencarian dan filter',
            description: 'Gunakan area ini untuk mempersempit data berdasarkan kata kunci, status, role, kategori, atau periode.',
        },
        {
            selector: 'main a[href$="/create"], main button[type="submit"], main button',
            title: 'Tombol aksi',
            description: 'Tombol ini digunakan untuk menambah data, menyimpan perubahan, mengubah status, scan QR, atau memproses transaksi.',
        },
        {
            selector: 'main table, main [data-coach-list]',
            title: 'Daftar dan detail data',
            description: 'Tabel atau kartu ini adalah area kerja utama. Gunakan aksi pada baris data untuk melihat, mengubah, atau memproses data.',
        },
    ];
};

export default function CoachMarks({ context }: Props) {
    const page = usePage();
    const path = pathWithoutQuery(page.url ?? window.location.pathname);
    const role = (page.props as { auth?: { user?: { role?: string } } }).auth?.user?.role;
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [rect, setRect] = useState<TargetRect | null>(null);
    const seenKey = `${guideStoragePrefix}.${context}.${role ?? 'guest'}.${path}`;
    const availableStepsRef = useRef<CoachStep[]>([]);

    const steps = useMemo(() => buildSteps(context, path, role), [context, path, role]);

    const resolveAvailableSteps = () =>
        steps.filter((step) => {
            const element = document.querySelector(step.selector);
            if (!element) return false;
            const elementRect = element.getBoundingClientRect();
            return elementRect.width > 0 && elementRect.height > 0;
        });

    const updateTargetRect = (index: number) => {
        const availableSteps = availableStepsRef.current;
        const step = availableSteps[index];
        if (!step) {
            setRect(null);
            return;
        }

        const element = document.querySelector(step.selector);
        if (!element) {
            setRect(null);
            return;
        }

        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        window.setTimeout(() => {
            const elementRect = element.getBoundingClientRect();
            setRect({
                top: elementRect.top,
                left: elementRect.left,
                width: elementRect.width,
                height: elementRect.height,
            });
        }, 220);
    };

    const startGuide = (force = false) => {
        const availableSteps = resolveAvailableSteps();
        availableStepsRef.current = availableSteps;
        if (availableSteps.length === 0) return;

        if (!force && window.localStorage.getItem(seenKey) === '1') {
            return;
        }

        setActiveIndex(0);
        setOpen(true);
        updateTargetRect(0);
    };

    const closeGuide = () => {
        window.localStorage.setItem(seenKey, '1');
        setOpen(false);
        setRect(null);
    };

    useEffect(() => {
        setOpen(false);
        setRect(null);
        setActiveIndex(0);

        const timer = window.setTimeout(() => startGuide(false), 850);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, context, role]);

    useEffect(() => {
        if (!open) return undefined;

        const handleReposition = () => updateTargetRect(activeIndex);
        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);

        return () => {
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
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

    const bubbleStyle = (() => {
        if (!rect) return {};

        const viewportWidth = window.innerWidth;
        const preferredTop = rect.top + rect.height + 18;
        const placeAbove = preferredTop + 190 > window.innerHeight && rect.top > 210;
        const top = placeAbove ? Math.max(18, rect.top - 190) : preferredTop;
        const left = Math.min(Math.max(16, rect.left), viewportWidth - 356);

        return {
            top,
            left,
        };
    })();

    return (
        <>
            {open && activeStep && rect && (
                <div className="fixed inset-0 z-[120] pointer-events-none">
                    <div className="absolute inset-0 bg-slate-950/35" />
                    <div
                        className="absolute rounded-2xl border-2 border-sky-400 bg-white/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.35),0_22px_60px_-20px_rgba(14,165,233,0.75)] transition-all duration-200"
                        style={{
                            top: rect.top - 8,
                            left: rect.left - 8,
                            width: rect.width + 16,
                            height: rect.height + 16,
                        }}
                    />
                    <div
                        className="pointer-events-auto absolute w-[min(340px,calc(100vw-32px))] rounded-2xl border border-sky-100 bg-white p-4 text-slate-800 shadow-2xl"
                        style={bubbleStyle}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-xs font-bold tracking-[0.2em] text-sky-600 uppercase">
                                    Panduan {activeIndex + 1}/{availableSteps.length}
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
