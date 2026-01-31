import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useMemo, useState } from 'react';

type Inventory = {
    id: number;
    room_type_id: number;
    room_type_name: string | null;
    hotel_name: string | null;
    date: string;
    available_rooms: number;
    price_override: string | null;
    is_closed: boolean;
    breakfast_included?: boolean;
    smoking_allowed?: boolean;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    inventories: {
        data: Inventory[];
        links: PaginationLink[];
    };
    roomTypeOptions: Array<{ id: number; label: string }>;
    monthGroups: Array<{ key: string; label: string; total: number; date_from: string; date_to: string }>;
    hotelOptions: Array<{ id: number; label: string }>;
    filters: {
        hotel_id?: string;
        room_type_id?: string;
        date_from?: string;
        date_to?: string;
    };
    isMitra?: boolean;
    basePath?: string;
};

export default function RoomInventoryIndex({
    inventories,
    roomTypeOptions,
    monthGroups,
    hotelOptions,
    filters,
    isMitra = false,
    basePath = '/room-inventories',
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: isMitra ? '/mitra/dashboard' : '/dashboard' },
        { title: 'Inventory Tanggal', href: basePath },
    ];
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const allIds = useMemo(() => inventories.data.map((inv) => inv.id), [inventories.data]);
    const allSelected = selectedIds.length > 0 && selectedIds.length === allIds.length;

    const handleDelete = async (inventoryId: number) => {
        const result = await Swal.fire({
            title: 'Hapus inventory?',
            text: 'Inventory tanggal ini akan dihapus.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });

        if (!result.isConfirmed) {
            return;
        }

        router.delete(`${basePath}/${inventoryId}`, {
            onSuccess: () => {
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Inventory berhasil dihapus.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Gagal',
                    text: 'Inventory gagal dihapus.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            },
        });
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            Swal.fire({
                title: 'Belum ada pilihan',
                text: 'Pilih data inventory yang ingin dihapus.',
                icon: 'info',
                confirmButtonText: 'OK',
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Hapus data terpilih?',
            text: `Sebanyak ${selectedIds.length} data akan dihapus permanen.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });

        if (!result.isConfirmed) {
            return;
        }

        router.delete(`${basePath}/bulk`, {
            data: { ids: selectedIds },
            onSuccess: () => {
                setSelectedIds([]);
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Data inventory berhasil dihapus.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Gagal',
                    text: 'Data inventory gagal dihapus.',
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
            <Head title="Inventory per Tanggal">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/85 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                                Inventory per Tanggal
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                Hindari double booking
                            </h1>
                            <p className="text-sm text-slate-600">
                                Atur stok kamar per tanggal dan harga khusus.
                            </p>
                        </div>
                        <Button
                            asChild
                            className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                            <Link href={`${basePath}/create`}>
                                <Plus className="mr-2 size-4" />
                                Tambah inventory
                            </Link>
                        </Button>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Grouping per Bulan</h2>
                            <p className="text-sm text-slate-500">Klik detail untuk melihat inventory di bulan tersebut.</p>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {monthGroups.map((group) => (
                            <div key={group.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="text-sm font-semibold text-slate-900">{group.label}</div>
                                <div className="mt-2 text-xs text-slate-500">{group.total} data inventory</div>
                                <div className="mt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const params: Record<string, string> = {
                                                date_from: group.date_from,
                                                date_to: group.date_to,
                                            };
                                            if (filters.room_type_id) {
                                                params.room_type_id = filters.room_type_id;
                                            }
                                            if (filters.hotel_id) {
                                                params.hotel_id = filters.hotel_id;
                                            }
                                            router.get(basePath, params, { preserveState: true });
                                        }}
                                    >
                                        Lihat detail
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {monthGroups.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                                Belum ada data inventory untuk dikelompokkan.
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form
                        onSubmit={applyFilters}
                        className="grid gap-4 md:grid-cols-5"
                    >
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Hotel
                            </label>
                            <select
                                name="hotel_id"
                                defaultValue={filters.hotel_id ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua hotel</option>
                                {hotelOptions.map((hotel) => (
                                    <option key={hotel.id} value={hotel.id}>
                                        {hotel.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Tipe kamar
                            </label>
                            <select
                                name="room_type_id"
                                defaultValue={filters.room_type_id ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua tipe</option>
                                {roomTypeOptions.map((room) => (
                                    <option key={room.id} value={room.id}>
                                        {room.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Dari tanggal
                            </label>
                            <input
                                type="date"
                                name="date_from"
                                defaultValue={filters.date_from ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Sampai tanggal
                            </label>
                            <input
                                type="date"
                                name="date_to"
                                defaultValue={filters.date_to ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="flex items-end gap-3">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
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

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={(event) => {
                                                if (event.target.checked) {
                                                    setSelectedIds(allIds);
                                                } else {
                                                    setSelectedIds([]);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="py-3 pr-4">Tanggal</th>
                                    <th className="py-3 pr-4">Hotel</th>
                                    <th className="py-3 pr-4">Tipe Kamar</th>
                                    <th className="py-3 pr-4">Stok</th>
                                    <th className="py-3 pr-4">Harga Override</th>
                                    <th className="py-3 pr-4">Status</th>
                                    <th className="py-3 pr-4">Opsi</th>
                                    <th className="py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inventories.data.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-slate-500">
                                            Belum ada inventory.
                                        </td>
                                    </tr>
                                )}
                                {inventories.data.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="py-4 pr-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(inv.id)}
                                                onChange={(event) => {
                                                    if (event.target.checked) {
                                                        setSelectedIds((prev) => [...prev, inv.id]);
                                                    } else {
                                                        setSelectedIds((prev) => prev.filter((id) => id !== inv.id));
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="size-4 text-slate-400" />
                                                {inv.date}
                                            </div>
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {inv.hotel_name ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {inv.room_type_name ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {inv.available_rooms}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {inv.price_override
                                                ? `Rp ${Number(inv.price_override).toLocaleString('id-ID')}`
                                                : '-'}
                                        </td>
                                        <td className="py-4 pr-4">
                                            <Badge variant={inv.is_closed ? 'destructive' : 'secondary'}>
                                                {inv.is_closed ? 'Closed' : 'Open'}
                                            </Badge>
                                        </td>
                                        <td className="py-4 pr-4 text-xs text-slate-500">
                                            <div className="flex flex-wrap gap-2">
                                                <span
                                                    className={`rounded-full px-2 py-1 ${
                                                        inv.breakfast_included ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    Sarapan
                                                </span>
                                                <span
                                                    className={`rounded-full px-2 py-1 ${
                                                        inv.smoking_allowed ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    Smoking
                                                </span>
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
                                                    <Link href={`${basePath}/${inv.id}/edit`}>
                                                        <Pencil className="mr-1 size-3" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(inv.id)}
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

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">
                            {selectedIds.length > 0 ? `${selectedIds.length} data dipilih` : 'Belum ada data dipilih'}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={handleBulkDelete}
                        >
                            <Trash2 className="mr-1 size-4" />
                            Hapus Terpilih
                        </Button>
                    </div>

                    {inventories.links?.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                            {inventories.links.map((link) => (
                                <Button
                                    key={link.label}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                >
                                    <span
                                        dangerouslySetInnerHTML={{ __html: link.label }}
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
