import { Head, useForm } from '@inertiajs/react';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import {
    Select as UiSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Swal from 'sweetalert2';
import Select from 'react-select';

type Option = { id: string; label: string };
type CitySelectOption = { value: string; label: string };

type Destination = {
    id: number;
    destination_name: string | null;
    destination_type: string | null;
    description: string | null;
    highlights: string | null;
    province_code: string | null;
    city_code: string | null;
    address_full: string | null;
    maps_pin_url: string | null;
    open_days: string[] | null;
    open_time: string | null;
    close_time: string | null;
    holiday_notes: string | null;
    facilities: string[] | null;
    contact_phone: string | null;
    contact_hours: string | null;
    photo_gate_path: string | null;
    photo_area_path: string | null;
    photo_ticket_path: string | null;
    photo_other_paths?: string[] | null;
    is_temporarily_closed: boolean;
    closure_note: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Profil Destinasi', href: '/mitra/wisata/destination' },
];

const destinationTypes = [
    { id: 'alam', label: 'Alam' },
    { id: 'edukasi', label: 'Edukasi' },
    { id: 'budaya', label: 'Budaya' },
    { id: 'wahana', label: 'Wahana' },
    { id: 'event', label: 'Event / Atraksi' },
];

const facilityOptions = [
    { id: 'parkir', label: 'Parkir' },
    { id: 'toilet', label: 'Toilet' },
    { id: 'mushola', label: 'Mushola' },
    { id: 'warung', label: 'Warung' },
    { id: 'pemandu', label: 'Pemandu' },
    { id: 'asuransi', label: 'Asuransi' },
];

const dayOptions = [
    { id: 'mon', label: 'Senin' },
    { id: 'tue', label: 'Selasa' },
    { id: 'wed', label: 'Rabu' },
    { id: 'thu', label: 'Kamis' },
    { id: 'fri', label: 'Jumat' },
    { id: 'sat', label: 'Sabtu' },
    { id: 'sun', label: 'Minggu' },
];

const maxImageSize = 5 * 1024 * 1024;
const maxOtherPhotoCount = 5;
const maxImageSizeLabel = '5 MB';

export default function MitraWisataDestination({
    destination,
    provinces,
    cities,
}: {
    destination: Destination;
    provinces: Option[];
    cities: Option[];
}) {
    const form = useForm({
        _method: 'put',
        destination_name: destination.destination_name ?? '',
        destination_type: destination.destination_type ?? '',
        description: destination.description ?? '',
        highlights: destination.highlights ?? '',
        province_code: destination.province_code ?? '',
        city_code: destination.city_code ?? '',
        address_full: destination.address_full ?? '',
        maps_pin_url: destination.maps_pin_url ?? '',
        open_days: destination.open_days ?? ([] as string[]),
        open_time: destination.open_time ?? '',
        close_time: destination.close_time ?? '',
        holiday_notes: destination.holiday_notes ?? '',
        facilities: destination.facilities ?? ([] as string[]),
        contact_phone: destination.contact_phone ?? '',
        contact_hours: destination.contact_hours ?? '',
        is_temporarily_closed: destination.is_temporarily_closed ?? false,
        closure_note: destination.closure_note ?? '',
        photo_gate_file: null as File | null,
        photo_area_file: null as File | null,
        photo_ticket_file: null as File | null,
        photo_other_files: [] as File[],
        photo_other_remove: [] as string[],
    });

    const [otherPhotos, setOtherPhotos] = useState<string[]>(
        (destination.photo_other_paths ?? []).filter(Boolean) as string[],
    );

    const handleRemoveOtherPhoto = (path: string) => {
        setOtherPhotos((prev) => prev.filter((item) => item !== path));
        form.setData('photo_other_remove', [
            ...new Set([...form.data.photo_other_remove, path]),
        ]);
    };

    const showFileWarning = (text: string) => {
        void Swal.fire({
            icon: 'warning',
            title: 'File belum sesuai',
            text,
            confirmButtonText: 'OK',
        });
    };

    const handleSinglePhotoChange = (
        field:
            | 'photo_gate_file'
            | 'photo_area_file'
            | 'photo_ticket_file',
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0] ?? null;
        if (file && file.size > maxImageSize) {
            event.target.value = '';
            form.setData(field, null);
            showFileWarning(`Ukuran setiap foto maksimal ${maxImageSizeLabel}.`);
            return;
        }

        form.setData(field, file);
    };

    const handleOtherPhotosChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        const oversizedFile = files.find((file) => file.size > maxImageSize);

        if (oversizedFile) {
            event.target.value = '';
            form.setData('photo_other_files', []);
            showFileWarning(`Ukuran setiap foto lainnya maksimal ${maxImageSizeLabel}.`);
            return;
        }

        if (otherPhotos.length + files.length > maxOtherPhotoCount) {
            event.target.value = '';
            form.setData('photo_other_files', []);
            showFileWarning(`Foto lainnya maksimal ${maxOtherPhotoCount} file.`);
            return;
        }

        form.setData('photo_other_files', files);
    };

    const citySelectOptions: CitySelectOption[] = cities.map((city) => ({
        value: city.id,
        label: city.label,
    }));
    const selectedCity =
        citySelectOptions.find(
            (option) => option.value === form.data.city_code,
        ) ?? null;
    const selectStyles = {
        control: (base: any) => ({
            ...base,
            minHeight: '40px',
            borderColor: '#e2e8f0',
            boxShadow: 'none',
            ':hover': { borderColor: '#94a3b8' },
        }),
        valueContainer: (base: any) => ({ ...base, padding: '0 12px' }),
        input: (base: any) => ({ ...base, margin: 0, padding: 0 }),
        indicatorSeparator: () => ({ display: 'none' }),
        dropdownIndicator: (base: any) => ({ ...base, padding: '0 8px' }),
        menu: (base: any) => ({ ...base, zIndex: 50 }),
    };

    const submit = () => {
        form.post('/mitra/wisata/destination', {
            forceFormData: true,
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Tersimpan',
                    text: 'Profil destinasi berhasil diperbarui.',
                }),
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat menyimpan perubahan.',
                }),
        });
    };

    const getPublicUrl = (path?: string | null) =>
        path ? `/storage/${path}` : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profil Destinasi Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div>
                        <p className="text-xs font-semibold text-sky-600 uppercase">
                            Wisata
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                            Profil Destinasi
                        </h1>
                        <p className="text-sm text-slate-500">
                            Perbarui informasi destinasi agar tetap akurat di
                            sistem.
                        </p>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form
                        className="grid gap-4 md:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submit();
                        }}
                    >
                        <div className="grid gap-2">
                            <Label>Nama Destinasi</Label>
                            <Input
                                value={form.data.destination_name}
                                onChange={(event) =>
                                    form.setData(
                                        'destination_name',
                                        event.target.value,
                                    )
                                }
                                placeholder="Nama destinasi wisata"
                            />
                            <InputError
                                message={form.errors.destination_name}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Jenis Wisata</Label>
                            <UiSelect
                                value={form.data.destination_type}
                                onValueChange={(value) =>
                                    form.setData('destination_type', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    {destinationTypes.map((item) => (
                                        <SelectItem
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </UiSelect>
                            <InputError
                                message={form.errors.destination_type}
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Deskripsi</Label>
                            <textarea
                                className="min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Highlight</Label>
                            <textarea
                                className="min-h-[100px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.highlights}
                                onChange={(event) =>
                                    form.setData(
                                        'highlights',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Provinsi</Label>
                            <UiSelect
                                value={form.data.province_code}
                                onValueChange={(value) =>
                                    form.setData('province_code', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih provinsi" />
                                </SelectTrigger>
                                <SelectContent>
                                    {provinces.map((item) => (
                                        <SelectItem
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </UiSelect>
                            <InputError message={form.errors.province_code} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Kota/Kabupaten</Label>
                            <Select
                                inputId="city_code"
                                instanceId="city_code"
                                options={citySelectOptions}
                                value={selectedCity}
                                placeholder="Pilih kota/kabupaten"
                                onChange={(option) =>
                                    form.setData(
                                        'city_code',
                                        option?.value ?? '',
                                    )
                                }
                                styles={selectStyles}
                            />
                            <InputError message={form.errors.city_code} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Alamat Lengkap</Label>
                            <Input
                                value={form.data.address_full}
                                onChange={(event) =>
                                    form.setData(
                                        'address_full',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.address_full} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Titik Google Maps</Label>
                            <Input
                                value={form.data.maps_pin_url}
                                onChange={(event) =>
                                    form.setData(
                                        'maps_pin_url',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Hari Buka</Label>
                            <div className="flex flex-wrap gap-3">
                                {dayOptions.map((day) => (
                                    <label
                                        key={day.id}
                                        className="inline-flex items-center gap-2 text-sm text-slate-600"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.data.open_days.includes(
                                                day.id,
                                            )}
                                            onChange={(event) => {
                                                const checked =
                                                    event.target.checked;
                                                form.setData(
                                                    'open_days',
                                                    checked
                                                        ? [
                                                              ...form.data
                                                                  .open_days,
                                                              day.id,
                                                          ]
                                                        : form.data.open_days.filter(
                                                              (item) =>
                                                                  item !==
                                                                  day.id,
                                                          ),
                                                );
                                            }}
                                        />
                                        {day.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Jam Buka</Label>
                            <Input
                                value={form.data.open_time}
                                onChange={(event) =>
                                    form.setData(
                                        'open_time',
                                        event.target.value,
                                    )
                                }
                                placeholder="08:00"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Jam Tutup</Label>
                            <Input
                                value={form.data.close_time}
                                onChange={(event) =>
                                    form.setData(
                                        'close_time',
                                        event.target.value,
                                    )
                                }
                                placeholder="17:00"
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Catatan Hari Libur</Label>
                            <Input
                                value={form.data.holiday_notes}
                                onChange={(event) =>
                                    form.setData(
                                        'holiday_notes',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Fasilitas Wisata</Label>
                            <div className="flex flex-wrap gap-3">
                                {facilityOptions.map((facility) => (
                                    <label
                                        key={facility.id}
                                        className="inline-flex items-center gap-2 text-sm text-slate-600"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.data.facilities.includes(
                                                facility.id,
                                            )}
                                            onChange={(event) => {
                                                const checked =
                                                    event.target.checked;
                                                form.setData(
                                                    'facilities',
                                                    checked
                                                        ? [
                                                              ...form.data
                                                                  .facilities,
                                                              facility.id,
                                                          ]
                                                        : form.data.facilities.filter(
                                                              (item) =>
                                                                  item !==
                                                                  facility.id,
                                                          ),
                                                );
                                            }}
                                        />
                                        {facility.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
                            <Input
                                value={form.data.contact_phone}
                                onChange={(event) =>
                                    form.setData(
                                        'contact_phone',
                                        event.target.value,
                                    )
                                }
                                placeholder="Nomor petugas loket"
                            />
                            <Input
                                value={form.data.contact_hours}
                                onChange={(event) =>
                                    form.setData(
                                        'contact_hours',
                                        event.target.value,
                                    )
                                }
                                placeholder="Jam bisa dihubungi"
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Status Operasional</Label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_temporarily_closed}
                                    onChange={(event) =>
                                        form.setData(
                                            'is_temporarily_closed',
                                            event.target.checked,
                                        )
                                    }
                                />
                                <span className="text-sm text-slate-600">
                                    Tutup sementara
                                </span>
                            </div>
                            {form.data.is_temporarily_closed && (
                                <Input
                                    value={form.data.closure_note}
                                    onChange={(event) =>
                                        form.setData(
                                            'closure_note',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Catatan penutupan sementara"
                                />
                            )}
                        </div>
                        <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
                            <div>
                                <Label>Foto Gerbang</Label>
                                {destination.photo_gate_path && (
                                    <img
                                        src={
                                            getPublicUrl(
                                                destination.photo_gate_path,
                                            ) ?? ''
                                        }
                                        alt="Foto gerbang"
                                        className="mt-2 h-24 w-full rounded-lg object-cover"
                                    />
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="mt-2"
                                    onChange={(event) =>
                                        handleSinglePhotoChange(
                                            'photo_gate_file',
                                            event,
                                        )
                                    }
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Maksimal {maxImageSizeLabel}.
                                </p>
                            </div>
                            <div>
                                <Label>Foto Area Utama</Label>
                                {destination.photo_area_path && (
                                    <img
                                        src={
                                            getPublicUrl(
                                                destination.photo_area_path,
                                            ) ?? ''
                                        }
                                        alt="Foto area utama"
                                        className="mt-2 h-24 w-full rounded-lg object-cover"
                                    />
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="mt-2"
                                    onChange={(event) =>
                                        handleSinglePhotoChange(
                                            'photo_area_file',
                                            event,
                                        )
                                    }
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Maksimal {maxImageSizeLabel}.
                                </p>
                            </div>
                            <div>
                                <Label>Foto Loket/Validasi</Label>
                                {destination.photo_ticket_path && (
                                    <img
                                        src={
                                            getPublicUrl(
                                                destination.photo_ticket_path,
                                            ) ?? ''
                                        }
                                        alt="Foto loket"
                                        className="mt-2 h-24 w-full rounded-lg object-cover"
                                    />
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="mt-2"
                                    onChange={(event) =>
                                        handleSinglePhotoChange(
                                            'photo_ticket_file',
                                            event,
                                        )
                                    }
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Maksimal {maxImageSizeLabel}.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Foto Lainnya (maksimal 5)</Label>
                            {otherPhotos.length > 0 && (
                                <div className="mt-2 grid gap-3 sm:grid-cols-2 md:grid-cols-5">
                                    {otherPhotos.map((path, idx) => (
                                        <div
                                            key={`${path}-${idx}`}
                                            className="relative"
                                        >
                                            <img
                                                src={getPublicUrl(path) ?? ''}
                                                alt={`Foto lainnya ${idx + 1}`}
                                                className="h-24 w-full rounded-lg object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveOtherPhoto(path)
                                                }
                                                className="absolute top-2 right-2 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Input
                                type="file"
                                accept="image/*"
                                multiple
                                className="mt-2"
                                onChange={handleOtherPhotosChange}
                            />
                            <p className="text-xs text-slate-500">
                                Maksimal {maxOtherPhotoCount} foto, {maxImageSizeLabel} per file.
                            </p>
                            <InputError
                                message={form.errors.photo_other_files}
                            />
                        </div>
                        <div className="flex justify-end md:col-span-2">
                            <Button
                                type="submit"
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                Simpan Perubahan
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
