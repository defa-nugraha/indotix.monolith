import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';
import Select from 'react-select';

type EventForm = {
    id?: number;
    title: string;
    description: string;
    city_code: string;
    location: string;
    address: string;
    start_at: string;
    end_at: string;
    capacity_total: number | string;
};

type Props = {
    organizer: { id: number; name?: string | null };
    event: EventForm | null;
    cityOptions: Array<{ code: string; label: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Event', href: '/mitra/events' },
    { title: 'Form Event', href: '#' },
];

type CitySelectOption = { value: string; label: string };

export default function MitraEventCreate({ organizer, event, cityOptions }: Props) {
    const form = useForm<EventForm>({
        title: event?.title ?? '',
        description: event?.description ?? '',
        city_code: event?.city_code ?? '',
        location: event?.location ?? '',
        address: event?.address ?? '',
        start_at: event?.start_at ?? '',
        end_at: event?.end_at ?? '',
        capacity_total: event?.capacity_total ?? 0,
    });

    const citySelectOptions: CitySelectOption[] = cityOptions.map((city) => ({
        value: city.code,
        label: city.label,
    }));
    const selectedCity = citySelectOptions.find((option) => option.value === form.data.city_code) ?? null;
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
        const payload = {
            ...form.data,
            capacity_total: Number(form.data.capacity_total || 0),
        };
        if (event?.id) {
            router.put(`/mitra/events/${event.id}`, payload, {
                onSuccess: () => Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Event diperbarui.' }),
                onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Periksa data form.' }),
            });
            return;
        }
        form.post('/mitra/events', {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Event dibuat.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Periksa data form.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Form Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Event</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                        {event ? 'Edit Event' : 'Buat Event'} - {organizer.name ?? ''}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Isi data event lalu ajukan review ke admin.
                    </p>
                    <form
                        className="mt-6 grid gap-4 md:grid-cols-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            submit();
                        }}
                    >
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Judul Event</label>
                            <input
                                value={form.data.title}
                                onChange={(e) => form.setData('title', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.title} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Deskripsi</label>
                            <textarea
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Kota/Kabupaten</label>
                            <div className="mt-2">
                                <Select
                                    inputId="city_code"
                                    instanceId="city_code"
                                    options={citySelectOptions}
                                    value={selectedCity}
                                    placeholder="Pilih kota/kabupaten"
                                    onChange={(option) => form.setData('city_code', option?.value ?? '')}
                                    styles={selectStyles}
                                />
                            </div>
                            <InputError message={form.errors.city_code} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Lokasi</label>
                            <input
                                value={form.data.location}
                                onChange={(e) => form.setData('location', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Alamat</label>
                            <input
                                value={form.data.address}
                                onChange={(e) => form.setData('address', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Mulai</label>
                            <input
                                type="datetime-local"
                                value={form.data.start_at}
                                onChange={(e) => form.setData('start_at', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.start_at} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Selesai</label>
                            <input
                                type="datetime-local"
                                value={form.data.end_at}
                                onChange={(e) => form.setData('end_at', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.end_at} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Kapasitas</label>
                            <input
                                type="number"
                                min={0}
                                value={form.data.capacity_total}
                                onChange={(e) => form.setData('capacity_total', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.capacity_total} />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                {event ? 'Simpan Perubahan' : 'Simpan Event'}
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
