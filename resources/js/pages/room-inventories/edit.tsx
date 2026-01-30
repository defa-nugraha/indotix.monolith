import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Inventory Tanggal', href: '/room-inventories' },
    { title: 'Edit', href: '#' },
];

type Inventory = {
    id: number;
    room_type_id: number;
    room_type_name: string | null;
    hotel_name: string | null;
    date: string;
    available_rooms: number;
    price_override: string | null;
    is_closed: boolean;
};

type FormData = {
    _method?: string;
    room_type_id: string;
    date: string;
    available_rooms: string;
    price_override: string;
    is_closed: boolean;
};

type EditProps = {
    inventory: Inventory;
    roomTypeOptions: Array<{ id: number; label: string }>;
};

export default function EditRoomInventory({ inventory, roomTypeOptions }: EditProps) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        _method: 'put',
        room_type_id: String(inventory.room_type_id),
        date: inventory.date,
        available_rooms: String(inventory.available_rooms),
        price_override: inventory.price_override ?? '',
        is_closed: inventory.is_closed ?? false,
    });
    const formatRupiah = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (!digits) {
            return '';
        }
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };
    const [priceDisplay, setPriceDisplay] = useState(
        formatRupiah(inventory.price_override ?? ''),
    );

    const handlePriceChange = (value: string) => {
        const digits = value.replace(/\D/g, '');
        setPriceDisplay(formatRupiah(digits));
        setData('price_override', digits);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Inventory">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                                Inventory per Tanggal
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                Edit inventory
                            </h1>
                            <p className="text-sm text-slate-500">
                                Perbarui stok kamar untuk tanggal tertentu.
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/room-inventories">
                                <ArrowLeft className="mr-2 size-4" />
                                Kembali
                            </Link>
                        </Button>
                    </div>
                </section>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        post(`/room-inventories/${inventory.id}`, {
                            onSuccess: () => {
                                Swal.fire({
                                    title: 'Berhasil',
                                    text: 'Inventory berhasil diperbarui.',
                                    icon: 'success',
                                    confirmButtonText: 'OK',
                                });
                            },
                            onError: () => {
                                Swal.fire({
                                    title: 'Gagal',
                                    text: 'Perubahan gagal disimpan.',
                                    icon: 'error',
                                    confirmButtonText: 'OK',
                                });
                            },
                        });
                    }}
                    className="space-y-6 rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                >
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="room_type_id">Tipe kamar</Label>
                            <select
                                id="room_type_id"
                                value={data.room_type_id}
                                onChange={(event) =>
                                    setData('room_type_id', event.target.value)
                                }
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                required
                            >
                                <option value="">Pilih tipe kamar</option>
                                {roomTypeOptions.map((room) => (
                                    <option key={room.id} value={room.id}>
                                        {room.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.room_type_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="date">Tanggal</Label>
                            <Input
                                id="date"
                                type="date"
                                value={data.date}
                                onChange={(event) =>
                                    setData('date', event.target.value)
                                }
                                required
                            />
                            <InputError message={errors.date} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="available_rooms">Jumlah tersedia</Label>
                            <Input
                                id="available_rooms"
                                type="number"
                                value={data.available_rooms}
                                onChange={(event) =>
                                    setData('available_rooms', event.target.value)
                                }
                                placeholder="10"
                                required
                            />
                            <InputError message={errors.available_rooms} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="price_override">Harga override</Label>
                            <Input
                                id="price_override"
                                type="text"
                                inputMode="numeric"
                                value={priceDisplay}
                                onChange={(event) => handlePriceChange(event.target.value)}
                                placeholder="10.000"
                            />
                            <InputError message={errors.price_override} />
                        </div>

                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="is_closed"
                                checked={data.is_closed}
                                onCheckedChange={(value) =>
                                    setData('is_closed', Boolean(value))
                                }
                            />
                            <Label htmlFor="is_closed">Tutup penjualan</Label>
                            <InputError message={errors.is_closed} />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            className="bg-sky-600 text-white hover:bg-sky-700"
                            disabled={processing}
                        >
                            Simpan perubahan
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
