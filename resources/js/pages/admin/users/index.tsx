import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type UserRow = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    gender?: string | null;
    is_suspended: boolean;
    email_verified_at?: string | null;
    created_at?: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PageProps = {
    users: {
        data: UserRow[];
        links: PaginationLink[];
    };
    filters: {
        search?: string;
        status?: string;
        verified?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Kelola User', href: '/admin/users' },
];

export default function AdminUsersIndex({ users, filters }: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola User" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Users</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Kelola User</h1>
                        </div>
                    </div>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-[1.2fr_0.6fr_0.6fr_auto]"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get('/admin/users', Object.fromEntries(data.entries()), { preserveState: true });
                        }}
                    >
                        <input
                            name="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Cari nama, email, atau nomor HP"
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                        />
                        <select
                            name="status"
                            defaultValue={filters.status ?? ''}
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                        >
                            <option value="">Semua status</option>
                            <option value="active">Aktif</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <select
                            name="verified"
                            defaultValue={filters.verified ?? ''}
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                        >
                            <option value="">Semua verifikasi</option>
                            <option value="verified">Terverifikasi</option>
                            <option value="unverified">Belum verifikasi</option>
                        </select>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Terapkan filter
                        </Button>
                    </form>
                </section>

                <section className="overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">User</th>
                                    <th className="px-4 py-3 text-left">Kontak</th>
                                    <th className="px-4 py-3 text-left">Verifikasi</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((row) => (
                                    <tr key={row.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{row.name}</div>
                                            <div className="text-xs text-slate-500">{row.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-700">{row.phone ?? '-'}</div>
                                            <div className="text-xs text-slate-500">{row.gender ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={row.email_verified_at ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                                                {row.email_verified_at ? 'verified' : 'unverified'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={row.is_suspended ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}>
                                                {row.is_suspended ? 'suspended' : 'active'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="border-sky-200 text-slate-700 hover:bg-sky-50"
                                                >
                                                    <Link href={`/admin/users/${row.id}`}>Detail</Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        Swal.fire({
                                                            icon: 'warning',
                                                            title: 'Hapus user?',
                                                            text: 'User akan dihapus permanen jika tidak punya transaksi.',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Hapus',
                                                            cancelButtonText: 'Batal',
                                                        }).then((result) => {
                                                            if (result.isConfirmed) {
                                                                router.delete(`/admin/users/${row.id}`, {
                                                                    onSuccess: () => {
                                                                        Swal.fire({
                                                                            icon: 'success',
                                                                            title: 'Terhapus',
                                                                            text: 'User dihapus.',
                                                                        });
                                                                    },
                                                                    onError: (errors) => {
                                                                        Swal.fire({
                                                                            icon: 'error',
                                                                            title: 'Gagal',
                                                                            text: errors.user ?? 'User gagal dihapus.',
                                                                        });
                                                                    },
                                                                });
                                                            }
                                                        });
                                                    }}
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada user.
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
