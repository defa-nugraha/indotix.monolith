import { Head, useForm } from '@inertiajs/react';
import { useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';
import { formatCurrencyInput, parseCurrencyToInteger } from '@/lib/currency';

type VariantForm = {
    name: string;
    price: string | number;
    capacity: string | number;
};

type ProgramForm = {
    id?: number;
    name: string;
    category: string;
    base_price: number | string;
    description: string;
    capacity: number | string;
    is_active: boolean;
    image: File | null;
    variants: VariantForm[];
    facilities: string[];
    image_url?: string | null;
};

type Props = {
    program: ProgramForm | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Form Special Program', href: '#' },
];

const categoryOptions = [
    { value: 'meeting', label: 'Meeting' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'travel', label: 'Travel' },
];

export default function SpecialProgramCreate({ program }: Props) {
    const formatRupiah = (value: string | number | null | undefined) =>
        formatCurrencyInput(value);
    const isLoadingRef = useRef(false);

    const initialVariants =
        program?.variants?.map((variant) => ({
            ...variant,
            price:
                variant.price === null || variant.price === undefined
                    ? ''
                    : formatRupiah(variant.price),
        })) ?? [];

    const form = useForm<ProgramForm>({
        name: program?.name ?? '',
        category: program?.category ?? '',
        base_price:
            program?.base_price === null || program?.base_price === undefined
                ? ''
                : formatRupiah(program.base_price),
        description: program?.description ?? '',
        capacity: program?.capacity ?? '',
        is_active: program?.is_active ?? false,
        image: null,
        variants: initialVariants,
        facilities: program?.facilities ?? [],
        image_url: program?.image_url ?? null,
    });

    const submit = () => {
        const normalizePayload = (data: ProgramForm) => ({
            ...data,
            base_price: parseCurrencyToInteger(data.base_price),
            variants: data.variants.map((variant) => ({
                ...variant,
                price: parseCurrencyToInteger(variant.price),
            })),
        });

        const startLoading = () => {
            isLoadingRef.current = true;
            Swal.fire({
                title: 'Menyimpan...',
                text: 'Sedang memproses paket.',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });
        };

        const stopLoading = () => {
            if (!isLoadingRef.current) return;
            isLoadingRef.current = false;
            Swal.close();
        };

        const getFirstError = (errors: Record<string, string>) =>
            Object.values(errors)[0] ?? 'Periksa data form.';

        if (program?.id) {
            form.transform((data) => ({
                ...normalizePayload(data),
                _method: 'PUT',
            })).post(`/admin/special-programs/${program.id}`, {
                forceFormData: true,
                onStart: startLoading,
                onSuccess: () => {
                    stopLoading();
                    Swal.fire({
                        icon: 'success',
                        title: 'Tersimpan',
                        text: 'Paket diperbarui.',
                    });
                },
                onError: (errors) => {
                    stopLoading();
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: getFirstError(errors),
                    });
                },
            });
            return;
        }
        form.transform((data) => normalizePayload(data)).post(
            '/admin/special-programs',
            {
                forceFormData: true,
                onStart: startLoading,
                onSuccess: () => {
                    stopLoading();
                    Swal.fire({
                        icon: 'success',
                        title: 'Tersimpan',
                        text: 'Paket dibuat.',
                    });
                },
                onError: (errors) => {
                    stopLoading();
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: getFirstError(errors),
                    });
                },
            },
        );
    };

    const addVariant = () => {
        form.setData('variants', [
            ...form.data.variants,
            { name: '', price: '', capacity: '' },
        ]);
    };

    const updateVariant = (
        index: number,
        field: keyof VariantForm,
        value: string,
    ) => {
        const updated = [...form.data.variants];
        updated[index] = { ...updated[index], [field]: value };
        form.setData('variants', updated);
    };

    const removeVariant = (index: number) => {
        form.setData(
            'variants',
            form.data.variants.filter((_, idx) => idx !== index),
        );
    };

    const addFacility = () => {
        form.setData('facilities', [...form.data.facilities, '']);
    };

    const updateFacility = (index: number, value: string) => {
        const updated = [...form.data.facilities];
        updated[index] = value;
        form.setData('facilities', updated);
    };

    const removeFacility = (index: number) => {
        form.setData(
            'facilities',
            form.data.facilities.filter((_, idx) => idx !== index),
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Form Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <p className="text-xs font-semibold tracking-[0.3em] text-sky-600 uppercase">
                        Special Program
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                        {program ? 'Edit Paket' : 'Buat Paket'}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Kelola paket special program untuk ditampilkan di
                        publik.
                    </p>
                    <form
                        className="mt-6 grid gap-4 md:grid-cols-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            submit();
                        }}
                    >
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">
                                Nama Paket
                            </label>
                            <input
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">
                                Kategori
                            </label>
                            <select
                                value={form.data.category}
                                onChange={(e) =>
                                    form.setData('category', e.target.value)
                                }
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Pilih kategori</option>
                                {categoryOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.category} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">
                                Harga Dasar
                            </label>
                            <input
                                value={form.data.base_price}
                                onChange={(e) =>
                                    form.setData(
                                        'base_price',
                                        formatRupiah(e.target.value),
                                    )
                                }
                                inputMode="numeric"
                                autoComplete="off"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.base_price} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">
                                Deskripsi
                            </label>
                            <textarea
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">
                                Kapasitas
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={form.data.capacity}
                                onChange={(e) =>
                                    form.setData('capacity', e.target.value)
                                }
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.capacity} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">
                                Publish
                            </label>
                            <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_active',
                                            e.target.checked,
                                        )
                                    }
                                />
                                Tampilkan di publik
                            </label>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">
                                Gambar
                            </label>
                            {form.data.image_url && (
                                <img
                                    src={form.data.image_url}
                                    alt={form.data.name}
                                    className="mt-2 h-32 rounded-xl border border-slate-100 object-cover"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    form.setData(
                                        'image',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                                className="mt-2 block w-full text-sm"
                            />
                            <InputError message={form.errors.image} />
                        </div>

                        <div className="mt-4 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase">
                                    Variant
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addVariant}
                                >
                                    Tambah Variant
                                </Button>
                            </div>
                            <div className="mt-3 grid gap-3">
                                {form.data.variants.map((variant, index) => (
                                    <div
                                        key={index}
                                        className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-4"
                                    >
                                        <input
                                            value={variant.name}
                                            onChange={(e) =>
                                                updateVariant(
                                                    index,
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            placeholder="Nama variant"
                                        />
                                        <input
                                            value={variant.price}
                                            onChange={(e) =>
                                                updateVariant(
                                                    index,
                                                    'price',
                                                    formatRupiah(
                                                        e.target.value,
                                                    ),
                                                )
                                            }
                                            inputMode="numeric"
                                            autoComplete="off"
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            placeholder="Harga override"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            value={variant.capacity}
                                            onChange={(e) =>
                                                updateVariant(
                                                    index,
                                                    'capacity',
                                                    e.target.value,
                                                )
                                            }
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            placeholder="Kapasitas"
                                        />
                                        <div className="flex items-center justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() =>
                                                    removeVariant(index)
                                                }
                                            >
                                                Hapus
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {form.data.variants.length === 0 && (
                                    <p className="text-sm text-slate-500">
                                        Belum ada variant.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase">
                                    Fasilitas
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addFacility}
                                >
                                    Tambah Fasilitas
                                </Button>
                            </div>
                            <div className="mt-3 grid gap-3">
                                {form.data.facilities.map((facility, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3"
                                    >
                                        <input
                                            value={facility}
                                            onChange={(e) =>
                                                updateFacility(
                                                    index,
                                                    e.target.value,
                                                )
                                            }
                                            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            placeholder="Contoh: 1x meal, hotel, dll"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                removeFacility(index)
                                            }
                                        >
                                            Hapus
                                        </Button>
                                    </div>
                                ))}
                                {form.data.facilities.length === 0 && (
                                    <p className="text-sm text-slate-500">
                                        Belum ada fasilitas.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end md:col-span-2">
                            <Button
                                type="submit"
                                className="bg-sky-600 text-white hover:bg-sky-700"
                                disabled={form.processing}
                            >
                                {form.processing
                                    ? 'Menyimpan...'
                                    : program
                                      ? 'Simpan Perubahan'
                                      : 'Simpan Paket'}
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
