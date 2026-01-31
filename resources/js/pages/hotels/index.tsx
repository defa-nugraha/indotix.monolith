import { Head, Link, router } from '@inertiajs/react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Hotel = {
    id: number;
    vendor_id: number | null;
    name: string;
    description: string | null;
    city_id: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    star_rating: number | null;
    check_in_time: string | null;
    check_out_time: string | null;
    status: 'draft' | 'active' | 'suspended';
    facility_codes: string[];
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type HotelsPageProps = {
    hotels: {
        data: Hotel[];
        links: PaginationLink[];
    };
    filters: {
        search?: string;
        status?: string;
        city_id?: string;
        vendor_id?: string;
    };
    statusOptions: string[];
    cityOptions: Array<{ code: string; label: string }>;
    mitraOptions: Array<{ id: number; label: string }>;
    isMitra?: boolean;
    basePath?: string;
    canCreate?: boolean;
};

export default function HotelIndex({
    hotels,
    filters,
    statusOptions,
    cityOptions,
    mitraOptions,
    isMitra = false,
    basePath = '/hotels',
    canCreate = true,
}: HotelsPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: isMitra ? '/mitra/dashboard' : '/dashboard' },
        { title: 'Data Hotel', href: basePath },
    ];
    const handleDelete = async (hotelId: number) => {
        const result = await Swal.fire({
            title: 'Hapus hotel?',
            text: 'Data hotel akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });

        if (!result.isConfirmed) {
            return;
        }

        router.delete(`${basePath}/${hotelId}`, {
            onSuccess: () => {
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Hotel berhasil dihapus.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Gagal',
                    text: 'Hotel gagal dihapus.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            },
        });
    };

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get(basePath, Object.fromEntries(form.entries()), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Hotel">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <div className="pointer-events-none absolute -left-32 top-12 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
                <div className="pointer-events-none absolute right-[-10%] top-0 h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />

                <section className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/85 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                                Data Hotel
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                Kelola daftar hotel
                            </h1>
                            <p className="text-sm text-slate-600">
                                Simpan informasi hotel, fasilitas, dan status
                                operasional dalam satu tempat.
                            </p>
                        </div>
                        {canCreate && (
                            <Button
                                asChild
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                <Link href={`${basePath}/create`}>
                                    <Plus className="mr-2 size-4" />
                                    Tambah hotel
                                </Link>
                            </Button>
                        )}
                    </div>
                </section>

                {!isMitra && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <form
                            onSubmit={applyFilters}
                            className="grid gap-4 md:grid-cols-4"
                        >
                            <div className="grid gap-2 md:col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Cari hotel
                                </label>
                                <input
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Nama hotel atau alamat"
                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    defaultValue={filters.status ?? ''}
                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                >
                                    <option value="">Semua</option>
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {!isMitra && (
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Mitra
                                    </label>
                                    <select
                                        name="vendor_id"
                                        defaultValue={filters.vendor_id ?? ''}
                                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                    >
                                        <option value="">Semua</option>
                                        {mitraOptions.map((mitra) => (
                                            <option key={mitra.id} value={mitra.id}>
                                                {mitra.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="grid gap-2 md:col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Kota/Kabupaten
                                </label>
                                <select
                                    name="city_id"
                                    defaultValue={filters.city_id ?? ''}
                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                >
                                    <option value="">Semua</option>
                                    {cityOptions.map((city) => (
                                        <option key={city.code} value={city.code}>
                                            {city.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end gap-3 md:col-span-2">
                                <Button
                                    type="submit"
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                >
                                    Terapkan
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.get(basePath)}
                                >
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </section>
                )}

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">Hotel</th>
                                    <th className="py-3 pr-4">Kota</th>
                                    <th className="py-3 pr-4">Rating</th>
                                    <th className="py-3 pr-4">Status</th>
                                    <th className="py-3 pr-4">Fasilitas</th>
                                    <th className="py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {hotels.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-8 text-center text-slate-500"
                                        >
                                            Belum ada data hotel.
                                        </td>
                                    </tr>
                                )}
                                {hotels.data.map((hotel) => (
                                    <tr key={hotel.id}>
                                        <td className="py-4 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                                                    <Building2 className="size-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {hotel.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {hotel.address}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {hotel.city_id}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {hotel.star_rating
                                                ? `${hotel.star_rating} ⭐`
                                                : '-'}
                                        </td>
                                        <td className="py-4 pr-4">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                {hotel.status}
                                            </span>
                                        </td>
                                        <td className="py-4 pr-4">
                                            <div className="flex flex-wrap gap-2">
                                                {hotel.facility_codes.length === 0 && (
                                                    <span className="text-xs text-slate-400">
                                                        -
                                                    </span>
                                                )}
                                                {hotel.facility_codes.map((code) => (
                                                    <Badge
                                                        key={code}
                                                        variant="secondary"
                                                    >
                                                        {code}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="border-slate-200"
                                                >
                                                    <Link
                                                        href={`${basePath}/${hotel.id}/edit`}
                                                    >
                                                        <Pencil className="mr-1 size-3" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() =>
                                                        handleDelete(hotel.id)
                                                    }
                                                >
                                                    <Trash2 className="mr-1 size-3" />
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {hotels.links?.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                            {hotels.links.map((link) => (
                                <Button
                                    key={link.label}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.get(link.url)
                                    }
                                >
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                </Button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
