import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Swal from 'sweetalert2';

type Option = { id: string; label: string };

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
    });

    const submit = () => {
        form.put('/mitra/wisata/destination', {
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

    const getPublicUrl = (path?: string | null) => (path ? `/storage/${path}` : null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profil Destinasi Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                            Wisata
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Profil Destinasi</h1>
                        <p className="text-sm text-slate-500">
                            Perbarui informasi destinasi agar tetap akurat di sistem.
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
                                onChange={(event) => form.setData('destination_name', event.target.value)}
                                placeholder="Nama destinasi wisata"
                            />
                            <InputError message={form.errors.destination_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Jenis Wisata</Label>
                            <Select
                                value={form.data.destination_type}
                                onValueChange={(value) => form.setData('destination_type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    {destinationTypes.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.destination_type} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Deskripsi</Label>
                            <textarea
                                className="min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Highlight</Label>
                            <textarea
                                className="min-h-[100px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.highlights}
                                onChange={(event) => form.setData('highlights', event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Provinsi</Label>
                            <Select
                                value={form.data.province_code}
                                onValueChange={(value) => form.setData('province_code', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih provinsi" />
                                </SelectTrigger>
                                <SelectContent>
                                    {provinces.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.province_code} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Kota/Kabupaten</Label>
                            <Select
                                value={form.data.city_code}
                                onValueChange={(value) => form.setData('city_code', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kota" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cities.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.city_code} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Alamat Lengkap</Label>
                            <Input
                                value={form.data.address_full}
                                onChange={(event) => form.setData('address_full', event.target.value)}
                            />
                            <InputError message={form.errors.address_full} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Titik Google Maps</Label>
                            <Input
                                value={form.data.maps_pin_url}
                                onChange={(event) => form.setData('maps_pin_url', event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Hari Buka</Label>
                            <div className="flex flex-wrap gap-3">
                                {dayOptions.map((day) => (
                                    <label key={day.id} className="inline-flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={form.data.open_days.includes(day.id)}
                                            onChange={(event) => {
                                                const checked = event.target.checked;
                                                form.setData(
                                                    'open_days',
                                                    checked
                                                        ? [...form.data.open_days, day.id]
                                                        : form.data.open_days.filter((item) => item !== day.id)
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
                                onChange={(event) => form.setData('open_time', event.target.value)}
                                placeholder="08:00"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Jam Tutup</Label>
                            <Input
                                value={form.data.close_time}
                                onChange={(event) => form.setData('close_time', event.target.value)}
                                placeholder="17:00"
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Catatan Hari Libur</Label>
                            <Input
                                value={form.data.holiday_notes}
                                onChange={(event) => form.setData('holiday_notes', event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Fasilitas Wisata</Label>
                            <div className="flex flex-wrap gap-3">
                                {facilityOptions.map((facility) => (
                                    <label key={facility.id} className="inline-flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={form.data.facilities.includes(facility.id)}
                                            onChange={(event) => {
                                                const checked = event.target.checked;
                                                form.setData(
                                                    'facilities',
                                                    checked
                                                        ? [...form.data.facilities, facility.id]
                                                        : form.data.facilities.filter((item) => item !== facility.id)
                                                );
                                            }}
                                        />
                                        {facility.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
                            <Input
                                value={form.data.contact_phone}
                                onChange={(event) => form.setData('contact_phone', event.target.value)}
                                placeholder="Nomor petugas loket"
                            />
                            <Input
                                value={form.data.contact_hours}
                                onChange={(event) => form.setData('contact_hours', event.target.value)}
                                placeholder="Jam bisa dihubungi"
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Status Operasional</Label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_temporarily_closed}
                                    onChange={(event) => form.setData('is_temporarily_closed', event.target.checked)}
                                />
                                <span className="text-sm text-slate-600">Tutup sementara</span>
                            </div>
                            {form.data.is_temporarily_closed && (
                                <Input
                                    value={form.data.closure_note}
                                    onChange={(event) => form.setData('closure_note', event.target.value)}
                                    placeholder="Catatan penutupan sementara"
                                />
                            )}
                        </div>
                        <div className="grid gap-4 md:grid-cols-3 md:col-span-2">
                            <div>
                                <Label>Foto Gerbang</Label>
                                {destination.photo_gate_path && (
                                    <img
                                        src={getPublicUrl(destination.photo_gate_path) ?? ''}
                                        alt="Foto gerbang"
                                        className="mt-2 h-24 w-full rounded-lg object-cover"
                                    />
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="mt-2"
                                    onChange={(event) => form.setData('photo_gate_file', event.target.files?.[0] ?? null)}
                                />
                            </div>
                            <div>
                                <Label>Foto Area Utama</Label>
                                {destination.photo_area_path && (
                                    <img
                                        src={getPublicUrl(destination.photo_area_path) ?? ''}
                                        alt="Foto area utama"
                                        className="mt-2 h-24 w-full rounded-lg object-cover"
                                    />
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="mt-2"
                                    onChange={(event) => form.setData('photo_area_file', event.target.files?.[0] ?? null)}
                                />
                            </div>
                            <div>
                                <Label>Foto Loket/Validasi</Label>
                                {destination.photo_ticket_path && (
                                    <img
                                        src={getPublicUrl(destination.photo_ticket_path) ?? ''}
                                        alt="Foto loket"
                                        className="mt-2 h-24 w-full rounded-lg object-cover"
                                    />
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="mt-2"
                                    onChange={(event) => form.setData('photo_ticket_file', event.target.files?.[0] ?? null)}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Simpan Perubahan
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
