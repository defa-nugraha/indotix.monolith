import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';
import Select from 'react-select';

type Option = { id: string; label: string };
type CitySelectOption = { value: string; label: string };

type Destination = {
    id: number | null;
    encrypted_id: string | null;
    user_id?: number | null;
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
    contact_phone: string | null;
    contact_hours: string | null;
    photo_gate_path?: string | null;
    photo_area_path?: string | null;
    photo_ticket_path?: string | null;
    photo_other_paths?: string[] | null;
    is_live: boolean;
    is_suspended: boolean;
    suspended_reason?: string | null;
    suspended_at?: string | null;
    verification_status: string;
    user?: { id: number; name: string; email: string };
};

type Props = {
    destination: Destination;
    provinces: Option[];
    cities: Option[];
    cityName?: string | null;
    userOptions?: Array<{ id: number; label: string }>;
    isCreate?: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Detail Destinasi', href: '#' },
];

const statusTone = (status?: string | null) => {
    if (status === 'verified') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending') return 'bg-amber-50 text-amber-700';
    if (status === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-slate-50 text-slate-600';
};

const maxImageSize = 5 * 1024 * 1024;
const maxOtherPhotoCount = 5;
const maxImageSizeLabel = '5 MB';

export default function AdminWisataDestinationShow({
    destination,
    provinces,
    cities,
    cityName,
    userOptions = [],
    isCreate = false,
}: Props) {
    const [cityCode, setCityCode] = useState(destination.city_code ?? '');
    const citySelectOptions: CitySelectOption[] = useMemo(
        () => cities.map((item) => ({ value: item.id, label: item.label })),
        [cities],
    );
    const selectedCity =
        citySelectOptions.find((option) => option.value === cityCode) ?? null;
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
    const getPublicUrl = (path?: string | null) =>
        path ? `/storage/${path}` : null;
    const [otherPhotos, setOtherPhotos] = useState<string[]>(
        (destination.photo_other_paths ?? []).filter(Boolean) as string[],
    );
    const [removedOtherPhotos, setRemovedOtherPhotos] = useState<string[]>([]);

    const handleRemoveOtherPhoto = (path: string) => {
        setOtherPhotos((prev) => prev.filter((item) => item !== path));
        setRemovedOtherPhotos((prev) =>
            prev.includes(path) ? prev : [...prev, path],
        );
    };

    const showFileWarning = (text: string) => {
        void Swal.fire({
            icon: 'warning',
            title: 'File belum sesuai',
            text,
            confirmButtonText: 'OK',
        });
    };

    const validatePhotoFiles = (form: FormData) => {
        const singlePhotoFields = [
            'photo_gate_file',
            'photo_area_file',
            'photo_ticket_file',
        ];

        for (const field of singlePhotoFields) {
            const file = form.get(field);
            if (file instanceof File && file.size > maxImageSize) {
                showFileWarning(`Ukuran setiap foto maksimal ${maxImageSizeLabel}.`);
                return false;
            }
        }

        const otherFiles = form
            .getAll('photo_other_files[]')
            .filter((item): item is File => item instanceof File && item.size > 0);
        const oversizedOtherFile = otherFiles.find(
            (file) => file.size > maxImageSize,
        );

        if (oversizedOtherFile) {
            showFileWarning(`Ukuran setiap foto lainnya maksimal ${maxImageSizeLabel}.`);
            return false;
        }

        if (otherPhotos.length + otherFiles.length > maxOtherPhotoCount) {
            showFileWarning(`Foto lainnya maksimal ${maxOtherPhotoCount} file.`);
            return false;
        }

        return true;
    };

    const handleSuspend = async () => {
        const result = await Swal.fire({
            title: destination.is_suspended
                ? 'Aktifkan destinasi?'
                : 'Suspend destinasi?',
            text: destination.is_suspended
                ? 'Destinasi akan aktif kembali.'
                : 'Destinasi tidak akan tampil di publik.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: destination.is_suspended
                ? 'Aktifkan'
                : 'Suspend',
            cancelButtonText: 'Batal',
            input: destination.is_suspended ? undefined : 'textarea',
            inputLabel: destination.is_suspended ? undefined : 'Alasan suspend',
            inputPlaceholder: destination.is_suspended
                ? undefined
                : 'Tulis alasan',
            inputValidator: (value: string) => {
                if (!destination.is_suspended && !value)
                    return 'Alasan wajib diisi.';
                return null;
            },
        });

        if (!result.isConfirmed) return;

        router.post(
            `/admin/wisata/destinations/${destination.encrypted_id}/suspend`,
            {
                action: destination.is_suspended ? 'unsuspend' : 'suspend',
                reason: destination.is_suspended ? null : result.value,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Destinasi Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Destinasi Wisata
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                {isCreate ? 'Tambah Destinasi Wisata' : (destination.destination_name ?? 'Destinasi')}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {destination.user?.name} ·{' '}
                                {destination.user?.email}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {!isCreate && <Badge
                                className={statusTone(
                                    destination.verification_status,
                                )}
                            >
                                {destination.verification_status}
                            </Badge>}
                            <Badge
                                className={
                                    destination.is_live
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-50 text-slate-600'
                                }
                            >
                                {destination.is_live ? 'Live' : 'Draft'}
                            </Badge>
                            {!isCreate && destination.is_suspended && (
                                <Badge className="bg-red-50 text-red-600">
                                    Suspended
                                </Badge>
                            )}
                        </div>
                    </div>
                    {!isCreate && destination.is_suspended &&
                        destination.suspended_reason && (
                            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                Alasan suspend: {destination.suspended_reason}
                            </div>
                        )}
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Detail Destinasi
                    </h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Jenis wisata
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {destination.destination_type ?? '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Kota
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {cityName ?? destination.city_code ?? '-'}
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs text-slate-400 uppercase">
                                Alamat lengkap
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {destination.address_full ?? '-'}
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs text-slate-400 uppercase">
                                Deskripsi
                            </p>
                            <p className="text-sm text-slate-700">
                                {destination.description ?? '-'}
                            </p>
                        </div>
                    </div>

                    <form
                        className="mt-6 grid gap-4 md:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const form = new FormData(event.currentTarget);
                            if (!validatePhotoFiles(form)) {
                                return;
                            }
                            if (!isCreate) {
                                form.append('_method', 'PUT');
                            }
                            removedOtherPhotos.forEach((path) => {
                                form.append('photo_other_remove[]', path);
                            });
                            router.post(
                                isCreate
                                    ? '/admin/wisata/destinations'
                                    : `/admin/wisata/destinations/${destination.encrypted_id}`,
                                form,
                            );
                        }}
                    >
                        {isCreate && (
                            <div className="grid gap-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Mitra Wisata
                                </label>
                                <select
                                    name="user_id"
                                    defaultValue={destination.user_id ?? ''}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="">Pilih mitra</option>
                                    {userOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">
                                Nama destinasi
                            </label>
                            <input
                                name="destination_name"
                                defaultValue={
                                    destination.destination_name ?? ''
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">
                                Jenis wisata
                            </label>
                            <select
                                name="destination_type"
                                defaultValue={
                                    destination.destination_type ?? ''
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="alam">Alam</option>
                                <option value="edukasi">Edukasi</option>
                                <option value="budaya">Budaya</option>
                                <option value="wahana">Wahana</option>
                                <option value="event">Event</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">
                                Provinsi
                            </label>
                            <select
                                name="province_code"
                                defaultValue={destination.province_code ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Pilih provinsi</option>
                                {provinces.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">
                                Kota/Kabupaten
                            </label>
                            <input
                                type="hidden"
                                name="city_code"
                                value={cityCode}
                            />
                            <Select
                                inputId="city_code"
                                instanceId="city_code"
                                options={citySelectOptions}
                                value={selectedCity}
                                placeholder="Pilih kota/kabupaten"
                                onChange={(option) =>
                                    setCityCode(option?.value ?? '')
                                }
                                styles={selectStyles}
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">
                                Alamat lengkap
                            </label>
                            <input
                                name="address_full"
                                defaultValue={destination.address_full ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">
                                Titik Google Maps
                            </label>
                            <input
                                name="maps_pin_url"
                                defaultValue={destination.maps_pin_url ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">
                                Jam buka
                            </label>
                            <input
                                name="open_time"
                                defaultValue={destination.open_time ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">
                                Jam tutup
                            </label>
                            <input
                                name="close_time"
                                defaultValue={destination.close_time ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Foto Gerbang
                                </label>
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
                                <input aria-label="Photo Gate File"
                                    type="file"
                                    name="photo_gate_file"
                                    accept="image/*"
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Maksimal {maxImageSizeLabel}.
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Foto Area Utama
                                </label>
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
                                <input aria-label="Photo Area File"
                                    type="file"
                                    name="photo_area_file"
                                    accept="image/*"
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Maksimal {maxImageSizeLabel}.
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Foto Loket/Validasi
                                </label>
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
                                <label className="mt-2 grid gap-1.5 text-sm font-medium text-slate-700">
                                    <span>Upload foto loket</span>
                                    <input
                                        type="file"
                                        name="photo_ticket_file"
                                        accept="image/*"
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </label>
                                <p className="mt-1 text-xs text-slate-500">
                                    Maksimal {maxImageSizeLabel}.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">
                                Foto Lainnya (maksimal 5)
                            </label>
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
                            <label className="mt-2 grid gap-1.5 text-sm font-medium text-slate-700">
                                <span>Upload foto lainnya</span>
                                <input
                                    type="file"
                                    name="photo_other_files[]"
                                    accept="image/*"
                                    multiple
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <p className="text-xs text-slate-500">
                                Maksimal {maxOtherPhotoCount} foto, {maxImageSizeLabel} per file.
                            </p>
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">
                                Status Live
                            </label>
                            <select
                                name="is_live"
                                defaultValue={destination.is_live ? '1' : '0'}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="0">Draft</option>
                                <option value="1">Live</option>
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-3 md:col-span-2">
                            <Button
                                type="submit"
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                {isCreate ? 'Simpan Destinasi' : 'Simpan Perubahan'}
                            </Button>
                            {!isCreate && <Button
                                type="button"
                                variant="outline"
                                className={
                                    destination.is_suspended
                                        ? 'border-emerald-200 text-emerald-700'
                                        : 'border-rose-200 text-rose-600'
                                }
                                onClick={handleSuspend}
                            >
                                {destination.is_suspended
                                    ? 'Aktifkan Destinasi'
                                    : 'Suspend Destinasi'}
                            </Button>}
                            {!isCreate && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => {
                                        if (confirm('Hapus destinasi ini?')) {
                                            router.delete(`/admin/wisata/destinations/${destination.encrypted_id}`);
                                        }
                                    }}
                                >
                                    Hapus Destinasi
                                </Button>
                            )}
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
