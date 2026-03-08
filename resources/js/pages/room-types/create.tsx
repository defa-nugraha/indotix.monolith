import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import Swal from 'sweetalert2';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { formatCurrencyInput, parseCurrencyToDigits } from '@/lib/currency';

type FormData = {
    hotel_id: string;
    name: string;
    description: string;
    max_guest: string;
    bed_type: string;
    base_price: string;
    strike_price: string;
    total_rooms: string;
    status: string;
    images: File[];
};

type CreateProps = {
    hotelOptions: Array<{ id: number; label: string }>;
    statusOptions: string[];
    isMitra?: boolean;
    basePath?: string;
};

const textareaClass =
    'border-input placeholder:text-muted-foreground flex min-h-[96px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';

export default function CreateRoomType({
    hotelOptions,
    statusOptions,
    isMitra = false,
    basePath = '/room-types',
}: CreateProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: isMitra ? '/mitra/dashboard' : '/dashboard' },
        { title: 'Tipe Kamar', href: basePath },
        { title: 'Tambah', href: `${basePath}/create` },
    ];
    const { data, setData, post, processing, errors } = useForm<FormData>({
        hotel_id: '',
        name: '',
        description: '',
        max_guest: '',
        bed_type: '',
        base_price: '',
        strike_price: '',
        total_rooms: '',
        status: statusOptions[0] ?? 'draft',
        images: [],
    });
    const [basePriceDisplay, setBasePriceDisplay] = useState('');
    const [strikePriceDisplay, setStrikePriceDisplay] = useState('');

    const handlePriceChange = (
        value: string,
        setter: (value: string) => void,
        field: 'base_price' | 'strike_price',
    ) => {
        setter(formatCurrencyInput(value));
        setData(field, parseCurrencyToDigits(value));
    };
    const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        setData('images', files);
    };

    const removeImage = (index: number) => {
        setData(
            'images',
            data.images.filter((_, idx) => idx !== index),
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Tipe Kamar">
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
                                Tipe Kamar
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                Tambah tipe kamar
                            </h1>
                            <p className="text-sm text-slate-500">
                                Definisikan produk kamar yang dijual.
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={basePath}>
                                <ArrowLeft className="mr-2 size-4" />
                                Kembali
                            </Link>
                        </Button>
                    </div>
                </section>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        post(basePath, {
                            forceFormData: true,
                            onSuccess: () => {
                                Swal.fire({
                                    title: 'Berhasil',
                                    text: 'Tipe kamar berhasil ditambahkan.',
                                    icon: 'success',
                                    confirmButtonText: 'OK',
                                });
                            },
                            onError: () => {
                                Swal.fire({
                                    title: 'Gagal',
                                    text: 'Tipe kamar gagal ditambahkan.',
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
                            <Label htmlFor="hotel_id">Hotel</Label>
                            <select
                                id="hotel_id"
                                value={data.hotel_id}
                                onChange={(event) =>
                                    setData('hotel_id', event.target.value)
                                }
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                required
                            >
                                <option value="">Pilih hotel</option>
                                {hotelOptions.map((hotel) => (
                                    <option key={hotel.id} value={hotel.id}>
                                        {hotel.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.hotel_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama tipe kamar</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                placeholder="Contoh: Deluxe King"
                                required
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="max_guest">Maksimal tamu</Label>
                            <Input
                                id="max_guest"
                                type="number"
                                value={data.max_guest}
                                onChange={(event) =>
                                    setData('max_guest', event.target.value)
                                }
                                placeholder="2"
                            />
                            <InputError message={errors.max_guest} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="bed_type">Tipe bed</Label>
                            <Input
                                id="bed_type"
                                value={data.bed_type}
                                onChange={(event) =>
                                    setData('bed_type', event.target.value)
                                }
                                placeholder="King / Twin"
                            />
                            <InputError message={errors.bed_type} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="base_price">Harga dasar</Label>
                            <Input
                                id="base_price"
                                type="text"
                                inputMode="numeric"
                                value={basePriceDisplay}
                                onChange={(event) =>
                                    handlePriceChange(
                                        event.target.value,
                                        setBasePriceDisplay,
                                        'base_price',
                                    )
                                }
                                placeholder="10.000"
                                required
                            />
                            <InputError message={errors.base_price} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="strike_price">Harga coret</Label>
                            <Input
                                id="strike_price"
                                type="text"
                                inputMode="numeric"
                                value={strikePriceDisplay}
                                onChange={(event) =>
                                    handlePriceChange(
                                        event.target.value,
                                        setStrikePriceDisplay,
                                        'strike_price',
                                    )
                                }
                                placeholder="12.000"
                            />
                            <InputError message={errors.strike_price} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="total_rooms">Total kamar</Label>
                            <Input
                                id="total_rooms"
                                type="number"
                                value={data.total_rooms}
                                onChange={(event) =>
                                    setData('total_rooms', event.target.value)
                                }
                                placeholder="20"
                                required
                            />
                            <InputError message={errors.total_rooms} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(event) =>
                                    setData('status', event.target.value)
                                }
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.status} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(event) =>
                                setData('description', event.target.value)
                            }
                            className={textareaClass}
                            placeholder="Deskripsi tipe kamar"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Galeri foto</Label>
                            <Button type="button" variant="outline" asChild>
                                <label htmlFor="images" className="cursor-pointer">
                                    <Plus className="mr-2 size-4" />
                                    Upload foto
                                </label>
                            </Button>
                        </div>
                        <input
                            id="images"
                            name="images"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImagesChange}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
                        />
                        {data.images.length > 0 ? (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">
                                    {data.images.length} foto dipilih.
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {data.images.map((file, index) => (
                                        <div
                                            key={`${file.name}-${index}`}
                                            className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                                        >
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                className="h-32 w-full object-cover"
                                            />
                                            <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-500">
                                                <span className="truncate">
                                                    {file.name}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() =>
                                                        removeImage(index)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        <InputError message={errors.images} />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            className="bg-sky-600 text-white hover:bg-sky-700"
                            disabled={processing}
                        >
                            Simpan tipe kamar
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
