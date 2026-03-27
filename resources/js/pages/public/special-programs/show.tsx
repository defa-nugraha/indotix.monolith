import { Head, useForm, usePage } from '@inertiajs/react';
import {
    CalendarCheck,
    MapPinned,
    ShoppingBag,
    Star,
    Ticket,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';
import Swal from 'sweetalert2';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import PublicLayout from '@/layouts/public-layout';
import { guardPurchaseByRole } from '@/lib/purchase-guard';

type VariantItem = {
    id: number;
    name: string;
    price?: number | null;
    capacity?: number | null;
};

type ProgramDetail = {
    id: number;
    encrypted_id: string;
    slug?: string | null;
    name: string;
    category?: string | null;
    description?: string | null;
    base_price: number;
    capacity?: number | null;
    image_url?: string | null;
    variants: VariantItem[];
    facilities: string[];
};

export default function SpecialProgramShow({
    program,
}: {
    program: ProgramDetail;
}) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_menu } =
        usePage().props as {
            auth?: { user?: any };
            unread_notifications?: number;
            souvenir_cart_count?: number;
            affiliate_menu?: boolean;
        };
    const role = (auth?.user as any)?.role as string | undefined;
    const userName = (auth?.user as any)?.name ?? '';
    const userPhone = (auth?.user as any)?.phone ?? '';
    const hasVariants = program.variants.length > 0;

    const form = useForm({
        program_id: program.id,
        variant_id: hasVariants ? (program.variants[0]?.id ?? '') : '',
        name: userName,
        phone: userPhone,
        date: new Date().toISOString().slice(0, 10),
        pax: 1,
        notes: '',
    });

    const selectedVariant = useMemo(() => {
        if (!form.data.variant_id) return null;
        return (
            program.variants.find(
                (variant) => variant.id === Number(form.data.variant_id),
            ) ?? null
        );
    }, [form.data.variant_id, program.variants]);

    const displayPrice = selectedVariant?.price ?? program.base_price;

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Retail Shop', icon: ShoppingBag, href: '/retail-shop' },
        {
            label: 'Spesial Program',
            icon: Star,
            href: '/special-programs',
            active: true,
        },
        { label: 'Hotel', icon: Ticket, href: '/stay' },
    ];

    const submitBooking = () => {
        if (guardPurchaseByRole(role)) {
            return;
        }
        form.post('/special-programs/booking', {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Terkirim',
                    text: 'Booking kamu sudah tersimpan. Tim kami akan menghubungi untuk konfirmasi.',
                    confirmButtonText: 'OK',
                });
            },
            onError: (errors) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text:
                        errors.name ??
                        errors.phone ??
                        errors.date ??
                        errors.pax ??
                        'Tidak dapat memproses booking.',
                    confirmButtonText: 'OK',
                });
            },
        });
    };

    return (
        <PublicLayout categories={categories}>
            <Head title={program.name}>
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <section className="rounded-3xl bg-white p-6 shadow-sm">
                        <div className="h-56 overflow-hidden rounded-2xl bg-slate-100">
                            {program.image_url ? (
                                <img
                                    src={program.image_url}
                                    alt={program.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-sky-500 to-indigo-600" />
                            )}
                        </div>
                        <div className="mt-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 uppercase">
                                    {program.category ?? 'Special Program'}
                                </span>
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold text-slate-900">
                                {program.name}
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">
                                {program.description ??
                                    'Special program pilihan Indotix.'}
                            </p>
                            <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-sky-500" />
                                    Kapasitas {program.capacity ?? '-'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="h-4 w-4 text-sky-500" />
                                    Harga mulai Rp{' '}
                                    {Number(displayPrice ?? 0).toLocaleString(
                                        'id-ID',
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <h2 className="text-sm font-semibold text-slate-600 uppercase">
                                Fasilitas
                            </h2>
                            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                                {program.facilities.map((facility, index) => (
                                    <li key={index}>{facility}</li>
                                ))}
                                {program.facilities.length === 0 && (
                                    <li className="list-none text-sm text-slate-500">
                                        Belum ada fasilitas.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </section>

                    <section className="rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Booking Paket
                        </h2>
                        <p className="text-sm text-slate-500">
                            Lengkapi data untuk booking paket ini.
                        </p>
                        <div className="mt-4 space-y-4">
                            {hasVariants && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">
                                        Pilih Variant
                                    </label>
                                    <select
                                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        value={form.data.variant_id}
                                        onChange={(event) =>
                                            form.setData(
                                                'variant_id',
                                                Number(event.target.value),
                                            )
                                        }
                                    >
                                        {program.variants.map((variant) => (
                                            <option
                                                key={variant.id}
                                                value={variant.id}
                                            >
                                                {variant.name} · Rp{' '}
                                                {(
                                                    variant.price ??
                                                    program.base_price
                                                ).toLocaleString('id-ID')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-semibold text-slate-600">
                                    Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={form.data.date}
                                    onChange={(event) =>
                                        form.setData('date', event.target.value)
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">
                                    Jumlah Orang
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.data.pax}
                                    onChange={(event) =>
                                        form.setData(
                                            'pax',
                                            Number(event.target.value),
                                        )
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">
                                    Nama
                                </label>
                                <input
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Nama pemesan"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">
                                    No. HP
                                </label>
                                <input
                                    value={form.data.phone}
                                    onChange={(event) =>
                                        form.setData(
                                            'phone',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Nomor yang bisa dihubungi"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">
                                    Catatan
                                </label>
                                <textarea
                                    value={form.data.notes}
                                    onChange={(event) =>
                                        form.setData(
                                            'notes',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    rows={3}
                                    placeholder="Catatan tambahan (opsional)"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={submitBooking}
                                className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                            >
                                Booking Sekarang
                            </button>
                        </div>
                    </section>
                </div>
            </main>
            <footer className="mt-10 border-t border-slate-200 bg-white">
                <FooterDownloadSocial
                    auth={auth}
                    unreadNotifications={unread_notifications}
                    souvenirCartCount={souvenir_cart_count}
                    affiliateMenu={affiliate_menu}
                />
            </footer>
        </PublicLayout>
    );
}
