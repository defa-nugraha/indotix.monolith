import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Mobile App', href: '/admin/mobile/home' },
    { title: 'Hero Media', href: '/admin/mobile/home' },
];

export default function MobileHeroesIndex({
    heroes,
}: {
    heroes: Array<Record<string, any>>;
}) {
    const canDelete = heroes.length > 1;
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Hero Mobile?',
            text: 'Media ini akan dihapus dari carousel aplikasi.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });
        if (result.isConfirmed)
            router.delete(`/admin/mobile/home/heroes/${id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hero Mobile" />
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-sans text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold tracking-wide text-sky-600 uppercase">
                                Mobile App · Home
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                Hero Media
                            </h1>
                            <p className="text-sm text-slate-600">
                                Konten ini hanya digunakan aplikasi Mobile
                                Indotix dan tidak memengaruhi Website.
                            </p>
                        </div>
                        <Button
                            asChild
                            className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                            <Link href="/admin/mobile/home/heroes/create">
                                Tambah Hero
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
                                        Konten
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Media
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
                                {heroes.map((hero) => (
                                    <tr
                                        className="border-t border-slate-100"
                                        key={hero.id}
                                    >
                                        <td className="px-4 py-3">
                                            {hero.media_type === 'video' ? (
                                                <video
                                                    src={hero.media_url}
                                                    poster={
                                                        hero.poster_url ??
                                                        undefined
                                                    }
                                                    muted
                                                    className="h-20 w-32 rounded-lg bg-slate-50 object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={
                                                        hero.media_url ??
                                                        hero.poster_url
                                                    }
                                                    alt={hero.title}
                                                    className="h-20 w-32 rounded-lg bg-slate-50 object-cover"
                                                />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">
                                                {hero.title}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {hero.highlight_title ||
                                                    'Tanpa highlight'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-600 uppercase">
                                            {hero.media_type}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={
                                                    hero.is_active
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }
                                            >
                                                {hero.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {hero.sort_order}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="border-sky-200 text-slate-700 hover:bg-sky-50"
                                                >
                                                    <Link
                                                        href={`/admin/mobile/home/heroes/${hero.id}/edit`}
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() =>
                                                        handleDelete(hero.id)
                                                    }
                                                    disabled={!canDelete}
                                                    title={
                                                        canDelete
                                                            ? 'Hapus Hero'
                                                            : 'Hero terakhir tidak dapat dihapus'
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {heroes.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-10 text-center text-sm text-slate-500"
                                        >
                                            Belum ada Hero Mobile.
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
