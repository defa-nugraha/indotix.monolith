import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import InputError from '@/components/input-error';
import LocationPickerModal from '@/components/location-picker-modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Swal from 'sweetalert2';
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
    images: Array<{ id: number; url: string }>;
};

type FormData = {
    vendor_id: string;
    name: string;
    description: string;
    city_id: string;
    address: string;
    latitude: string;
    longitude: string;
    star_rating: string;
    check_in_time: string;
    check_out_time: string;
    status: string;
    facility_codes: string[];
    images: File[];
};

type EditProps = {
    hotel: Hotel;
    statusOptions: string[];
    facilityOptions: string[];
    mitraOptions: Array<{ id: number; label: string }>;
    cityOptions: Array<{ code: string; label: string }>;
    isMitra?: boolean;
    basePath?: string;
    mitraId?: number;
};

const textareaClass =
    'border-input placeholder:text-muted-foreground flex min-h-[96px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';

export default function EditHotel({
    hotel,
    statusOptions,
    facilityOptions,
    mitraOptions,
    cityOptions,
    isMitra = false,
    basePath = '/hotels',
    mitraId,
}: EditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: isMitra ? '/mitra/dashboard' : '/dashboard' },
        { title: 'Data Hotel', href: basePath },
        { title: 'Edit', href: '#' },
    ];
    const [isMapOpen, setIsMapOpen] = useState(false);
    const { data, setData, put, processing, errors } = useForm<FormData>({
        vendor_id: hotel.vendor_id ? String(hotel.vendor_id) : mitraId ? String(mitraId) : '',
        name: hotel.name ?? '',
        description: hotel.description ?? '',
        city_id: hotel.city_id ?? '',
        address: hotel.address ?? '',
        latitude: hotel.latitude !== null ? String(hotel.latitude) : '',
        longitude: hotel.longitude !== null ? String(hotel.longitude) : '',
        star_rating: hotel.star_rating ? String(hotel.star_rating) : '',
        check_in_time: hotel.check_in_time ?? '',
        check_out_time: hotel.check_out_time ?? '',
        status: hotel.status ?? statusOptions[0] ?? 'draft',
        facility_codes: hotel.facility_codes ?? [],
        images: [],
    });

    const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        if (files.length === 0) {
            return;
        }
        setData('images', [...data.images, ...files]);
        event.target.value = '';
    };

    const removeImage = (index: number) => {
        setData(
            'images',
            data.images.filter((_, idx) => idx !== index),
        );
    };

    const toggleFacility = (code: string) => {
        setData(
            'facility_codes',
            data.facility_codes.includes(code)
                ? data.facility_codes.filter((item) => item !== code)
                : [...data.facility_codes, code],
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Hotel">
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
                                Data Hotel
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                Edit hotel
                            </h1>
                            <p className="text-sm text-slate-500">
                                Perbarui informasi dan fasilitas hotel.
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
                        put(`${basePath}/${hotel.id}`, {
                            onSuccess: () => {
                                Swal.fire({
                                    title: 'Berhasil',
                                    text: 'Hotel berhasil diperbarui.',
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
                            <Label htmlFor="name">Nama hotel</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                placeholder="Nama hotel"
                                required
                            />
                            <InputError message={errors.name} />
                        </div>

                        {!isMitra && (
                            <div className="grid gap-2">
                                <Label htmlFor="vendor_id">Mitra</Label>
                                <select
                                    id="vendor_id"
                                    value={data.vendor_id}
                                    onChange={(event) =>
                                        setData('vendor_id', event.target.value)
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                >
                                    <option value="">Pilih mitra</option>
                                    {mitraOptions.map((mitra) => (
                                        <option key={mitra.id} value={mitra.id}>
                                            {mitra.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.vendor_id} />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="city_id">Kota/Kabupaten</Label>
                            <select
                                id="city_id"
                                value={data.city_id}
                                onChange={(event) =>
                                    setData('city_id', event.target.value)
                                }
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                required
                            >
                                <option value="">Pilih kota/kabupaten</option>
                                {cityOptions.map((city) => (
                                    <option key={city.code} value={city.code}>
                                        {city.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.city_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Alamat</Label>
                            <Input
                                id="address"
                                value={data.address}
                                onChange={(event) =>
                                    setData('address', event.target.value)
                                }
                                placeholder="Alamat lengkap"
                                required
                            />
                            <InputError message={errors.address} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="star_rating">Bintang</Label>
                            <select
                                id="star_rating"
                                value={data.star_rating}
                                onChange={(event) =>
                                    setData('star_rating', event.target.value)
                                }
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Pilih rating</option>
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.star_rating} />
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

                        <div className="grid gap-2">
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input
                                id="latitude"
                                type="number"
                                step="0.000001"
                                value={data.latitude}
                                onChange={(event) =>
                                    setData('latitude', event.target.value)
                                }
                                placeholder="-6.200000"
                            />
                            <InputError message={errors.latitude} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input
                                id="longitude"
                                type="number"
                                step="0.000001"
                                value={data.longitude}
                                onChange={(event) =>
                                    setData('longitude', event.target.value)
                                }
                                placeholder="106.816666"
                            />
                            <InputError message={errors.longitude} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Wilayah via peta</Label>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-slate-200 text-slate-600"
                                onClick={() => setIsMapOpen(true)}
                            >
                                Pilih lokasi di peta
                            </Button>
                            <p className="text-xs text-slate-500">
                                Pilih lokasi untuk mengisi latitude & longitude
                                otomatis.
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="check_in_time">Check-in</Label>
                            <Input
                                id="check_in_time"
                                type="time"
                                value={data.check_in_time}
                                onChange={(event) =>
                                    setData('check_in_time', event.target.value)
                                }
                            />
                            <InputError message={errors.check_in_time} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="check_out_time">Check-out</Label>
                            <Input
                                id="check_out_time"
                                type="time"
                                value={data.check_out_time}
                                onChange={(event) =>
                                    setData('check_out_time', event.target.value)
                                }
                            />
                            <InputError message={errors.check_out_time} />
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
                            placeholder="Deskripsi singkat hotel"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Foto hotel</Label>
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
                        {hotel.images.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">
                                    Foto tersimpan ({hotel.images.length})
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {hotel.images.map((image) => (
                                        <div
                                            key={image.id}
                                            className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                                        >
                                            <img
                                                src={image.url}
                                                alt={`Foto ${hotel.name}`}
                                                className="h-32 w-full object-cover"
                                            />
                                            <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-500">
                                                <span className="truncate">Foto</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                        Swal.fire({
                                                            title: 'Hapus foto?',
                                                            text: 'Foto akan dihapus permanen.',
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Ya, hapus',
                                                            cancelButtonText: 'Batal',
                                                            confirmButtonColor: '#dc2626',
                                                        }).then((result) => {
                                                            if (!result.isConfirmed) {
                                                                return;
                                                            }
                                                            router.delete(
                                                                `${basePath}/${hotel.id}/images/${image.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                    onSuccess: () => {
                                                                        Swal.fire({
                                                                            title: 'Berhasil',
                                                                            text: 'Foto berhasil dihapus.',
                                                                            icon: 'success',
                                                                            confirmButtonText: 'OK',
                                                                        });
                                                                    },
                                                                    onError: () => {
                                                                        Swal.fire({
                                                                            title: 'Gagal',
                                                                            text: 'Foto gagal dihapus.',
                                                                            icon: 'error',
                                                                            confirmButtonText: 'OK',
                                                                        });
                                                                    },
                                                                },
                                                            );
                                                        });
                                                    }}
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {data.images.length > 0 ? (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">
                                    {data.images.length} foto baru dipilih.
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
                                                <span className="truncate">{file.name}</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => removeImage(index)}
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

                    <div className="space-y-3">
                        <Label>Fasilitas</Label>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {facilityOptions.map((code) => (
                                <label
                                    key={code}
                                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm text-slate-600"
                                >
                                    <Checkbox
                                        checked={data.facility_codes.includes(code)}
                                        onCheckedChange={() =>
                                            toggleFacility(code)
                                        }
                                    />
                                    {code}
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.facility_codes} />
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
            <LocationPickerModal
                open={isMapOpen}
                onOpenChange={setIsMapOpen}
                initialLat={data.latitude ? Number(data.latitude) : null}
                initialLng={data.longitude ? Number(data.longitude) : null}
                onSelect={(lat, lng) => {
                    setData('latitude', lat.toFixed(6));
                    setData('longitude', lng.toFixed(6));
                }}
            />
        </AppLayout>
    );
}
