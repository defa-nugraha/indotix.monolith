import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';

type ProgramDetail = {
    id: number;
    name: string;
    category: string | null;
    description?: string | null;
    base_price: number;
    capacity?: number | null;
    is_active: boolean;
    image_url?: string | null;
    variants: Array<{
        id: number;
        name: string;
        price: number | null;
        capacity: number | null;
        facilities: string[];
    }>;
    facilities: string[];
    inventories: Array<{
        date: string;
        capacity: number;
    }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Manajemen Special Program', href: '/admin/special-programs' },
    { title: 'Detail', href: '#' },
];

export default function SpecialProgramShow({
    program,
}: {
    program: ProgramDetail;
}) {
    const formatCapacity = (value?: number | null) =>
        value && value > 0 ? value : 'Tidak terbatas';

    const handleDelete = () => {
        Swal.fire({
            icon: 'warning',
            title: 'Hapus paket?',
            text: 'Paket akan dihapus permanen.',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/special-programs/${program.id}`);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                {program.name}
                            </h1>
                            <p className="text-sm text-slate-500">
                                Kategori: {program.category ?? '-'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                className={
                                    program.is_active
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-600'
                                }
                            >
                                {program.is_active ? 'published' : 'draft'}
                            </Badge>
                            <Link
                                href={`/admin/special-programs/${program.id}/edit`}
                                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-sky-300 hover:text-sky-700"
                            >
                                Edit
                            </Link>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleDelete}
                                className="text-rose-600 hover:text-rose-700"
                            >
                                Hapus
                            </Button>
                        </div>
                    </div>
                    {program.description && (
                        <p className="mt-3 text-sm text-slate-500">
                            {program.description}
                        </p>
                    )}
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Ringkasan Paket
                        </h2>
                        <div className="mt-4 grid gap-3 text-sm text-slate-600">
                            <div>
                                Harga dasar: Rp{' '}
                                {Number(program.base_price ?? 0).toLocaleString(
                                    'id-ID',
                                )}
                            </div>
                            <div>
                                Kapasitas: {formatCapacity(program.capacity)}
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.post(
                                        `/admin/special-programs/${program.id}/status`,
                                        { is_active: !program.is_active },
                                    )
                                }
                            >
                                {program.is_active ? 'Unpublish' : 'Publish'}
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Gambar
                        </h2>
                        {program.image_url ? (
                            <img
                                src={program.image_url}
                                alt={program.name}
                                className="mt-4 h-40 w-full rounded-2xl object-cover"
                            />
                        ) : (
                            <p className="mt-4 text-sm text-slate-500">
                                Belum ada gambar.
                            </p>
                        )}
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Variant
                        </h2>
                        <div className="mt-4 grid gap-3">
                            {program.variants.map((variant) => (
                                <div
                                    key={variant.id}
                                    className="rounded-2xl border border-slate-100 p-4"
                                >
                                    <div className="font-semibold text-slate-900">
                                        {variant.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Harga:{' '}
                                        {variant.price !== null
                                            ? `Rp ${Number(variant.price).toLocaleString('id-ID')}`
                                            : 'Ikuti harga dasar'}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Kapasitas:{' '}
                                        {formatCapacity(variant.capacity)}
                                    </div>
                                    {variant.facilities.length > 0 && (
                                        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                                            {variant.facilities.map(
                                                (facility, facilityIndex) => (
                                                    <li
                                                        key={`${variant.id}-${facilityIndex}`}
                                                    >
                                                        {facility}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    )}
                                </div>
                            ))}
                            {program.variants.length === 0 && (
                                <div className="text-sm text-slate-500">
                                    Belum ada variant.
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Fasilitas
                        </h2>
                        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                            {program.facilities.map((facility, index) => (
                                <li key={index}>{facility}</li>
                            ))}
                            {program.facilities.length === 0 && (
                                <li className="list-none text-sm text-slate-500">
                                    Belum ada fasilitas.
                                </li>
                            )}
                        </ul>
                    </div>
                </section>
                {program.category === 'travel' && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Inventory Tanggal
                        </h2>
                        <div className="mt-4 grid gap-3 text-sm text-slate-600">
                            {program.inventories.map((inventory, index) => (
                                <div
                                    key={`${inventory.date}-${index}`}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-2"
                                >
                                    <span>{inventory.date}</span>
                                    <span>
                                        Kapasitas:{' '}
                                        {formatCapacity(inventory.capacity)}
                                    </span>
                                </div>
                            ))}
                            {program.inventories.length === 0 && (
                                <p className="text-sm text-slate-500">
                                    Belum ada inventory tanggal.
                                </p>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
