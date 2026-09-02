import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/partners' },
    { title: 'Partner Kami', href: '/admin/public/partners' },
];

type Partner = {
    id: number;
    name: string | null;
    image_path: string;
    link_url: string | null;
    sort_order: number;
    is_active: boolean;
};

export default function PartnerIndex({ partners }: { partners: Partner[] }) {
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus partner?',
            text: 'Data akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });

        if (!result.isConfirmed) return;

        router.delete(`/admin/public/partners/${id}`, {
            onSuccess: () =>
                Swal.fire({ title: 'Berhasil', text: 'Data dihapus.', icon: 'success' }),
            onError: () =>
                Swal.fire({ title: 'Gagal', text: 'Data gagal dihapus.', icon: 'error' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Partner Kami">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/85 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-sky-600">
                                Partner Kami
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                Kelola partner
                            </h1>
                            <p className="text-sm text-slate-600">
                                Update logo dan tautan partner.
                            </p>
                            <p className="text-xs text-slate-500">
                                Gunakan logo yang jelas dan mudah terbaca.
                            </p>
                        </div>
                        <Button asChild className="bg-sky-600 text-white hover:bg-sky-700">
                            <Link href="/admin/public/partners/create">Tambah Partner</Link>
                        </Button>
                    </div>
                </section>

                <section className="overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Nama</th>
                                    <th className="px-4 py-3 text-left">Logo</th>
                                    <th className="px-4 py-3 text-left">Link</th>
                                    <th className="px-4 py-3 text-left">Urutan</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {partners.map((partner) => (
                                    <tr key={partner.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{partner.name ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <img
                                                src={`/storage/${partner.image_path}`}
                                                alt={partner.name ?? 'Partner'}
                                                className="h-10 w-16 rounded-md object-contain bg-slate-50"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {partner.link_url ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">{partner.sort_order}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={partner.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                                                {partner.is_active ? 'active' : 'inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button asChild variant="outline" className="border-sky-200 text-slate-700 hover:bg-sky-50">
                                                    <Link href={`/admin/public/partners/${partner.id}/edit`}>Edit</Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(partner.id)}
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {partners.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada partner.
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
