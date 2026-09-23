import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Mobile App', href: '/admin/mobile/home' },
    { title: 'Promo Banners', href: '/admin/mobile/promos' },
];

export default function MobilePromosIndex({
    promos,
}: {
    promos: Array<Record<string, any>>;
}) {
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus promo mobile?',
            text: 'Banner ini akan dihapus dari aplikasi Mobile Indotix.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });
        if (result.isConfirmed) router.delete(`/admin/mobile/promos/${id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Promo Mobile" />
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-sans text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold tracking-wide text-sky-600 uppercase">
                                Mobile App · Home
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                Promo Banners
                            </h1>
                            <p className="text-sm text-slate-600">
                                Banner ini hanya digunakan pada aplikasi Mobile
                                Indotix dan tidak memengaruhi Website.
                            </p>
                        </div>
                        <Button
                            asChild
                            className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                            <Link href="/admin/mobile/promos/create">
                                Tambah Promo
                            </Link>
                        </Button>
                    </div>
                </section>
                <section className="overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Preview
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Urutan
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {promos.map((promo) => (
                                    <tr
                                        className="border-t border-slate-100"
                                        key={promo.id}
                                    >
                                        <td className="px-4 py-3">
                                            <img
                                                src={promo.image_url}
                                                alt={
                                                    promo.alt_text ?? promo.name
                                                }
                                                className="aspect-[2.26/1] w-36 rounded-lg bg-slate-50 object-cover"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-900">
                                            {promo.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={
                                                    promo.is_active
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }
                                            >
                                                {promo.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {promo.sort_order}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="border-sky-200 text-slate-700 hover:bg-sky-50"
                                                >
                                                    <Link
                                                        href={`/admin/mobile/promos/${promo.id}/edit`}
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() =>
                                                        handleDelete(promo.id)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {promos.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-10 text-center text-sm text-slate-500"
                                        >
                                            Belum ada promo Mobile.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
