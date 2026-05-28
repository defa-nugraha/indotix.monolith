import { Head, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type UserDetail = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    gender?: string | null;
    is_suspended?: boolean;
    suspended_reason?: string | null;
    suspended_at?: string | null;
    email_verified_at?: string | null;
    created_at?: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Kelola User', href: '/admin/users' },
    { title: 'Detail User', href: '#' },
];

type TransactionRow = {
    id: number;
    type: string;
    title: string;
    code: string | number;
    total: number | null;
    status: string | null;
    payment_status: string | null;
    created_at: string | null;
};

export default function AdminUserShow({
    user,
    transactions = [],
}: {
    user: UserDetail;
    transactions?: TransactionRow[];
}) {
    const handleSuspend = async () => {
        const result = await Swal.fire({
            title: user.is_suspended ? 'Aktifkan user?' : 'Suspend user?',
            text: user.is_suspended
                ? 'Akun user akan diaktifkan kembali.'
                : 'User tidak bisa login hingga diaktifkan kembali.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: user.is_suspended ? 'Aktifkan' : 'Suspend',
            cancelButtonText: 'Batal',
            input: user.is_suspended ? undefined : 'textarea',
            inputLabel: user.is_suspended ? undefined : 'Alasan suspend',
            inputPlaceholder: user.is_suspended
                ? undefined
                : 'Tulis alasan suspend',
            inputValidator: (value: string | null) => {
                if (!user.is_suspended && !value) {
                    return 'Alasan suspend wajib diisi.';
                }
                return null;
            },
        });

        if (!result.isConfirmed) return;

        router.post(
            `/admin/users/${user.id}/suspend`,
            {
                action: user.is_suspended ? 'unsuspend' : 'suspend',
                reason: user.is_suspended ? null : result.value,
            },
            {
                onSuccess: () =>
                    Swal.fire({
                        title: 'Berhasil',
                        text: user.is_suspended
                            ? 'User diaktifkan kembali.'
                            : 'User berhasil disuspend.',
                        icon: 'success',
                    }),
                onError: () =>
                    Swal.fire({
                        title: 'Gagal',
                        text: 'Tidak dapat memperbarui status user.',
                        icon: 'error',
                    }),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail User" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.3em] text-sky-600 uppercase">
                                User
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                {user.name}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {user.email}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                className={
                                    user.is_suspended
                                        ? 'bg-sky-600 text-white hover:bg-sky-700'
                                        : 'bg-rose-600 text-white hover:bg-rose-700'
                                }
                                onClick={handleSuspend}
                            >
                                {user.is_suspended
                                    ? 'Aktifkan User'
                                    : 'Suspend User'}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    Swal.fire({
                                        icon: 'warning',
                                        title: 'Hapus user?',
                                        text: 'User akan dihapus permanen jika tidak memiliki transaksi.',
                                        showCancelButton: true,
                                        confirmButtonText: 'Hapus',
                                        cancelButtonText: 'Batal',
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            router.delete(
                                                `/admin/users/${user.id}`,
                                                {
                                                    onSuccess: () => {
                                                        Swal.fire({
                                                            icon: 'success',
                                                            title: 'Terhapus',
                                                            text: 'User dihapus.',
                                                        }).then(() => {
                                                            router.get(
                                                                '/admin/users',
                                                            );
                                                        });
                                                    },
                                                    onError: (errors) => {
                                                        Swal.fire({
                                                            icon: 'error',
                                                            title: 'Gagal',
                                                            text:
                                                                errors.user ??
                                                                'User gagal dihapus.',
                                                        });
                                                    },
                                                },
                                            );
                                        }
                                    });
                                }}
                            >
                                Hapus User
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Informasi Akun
                        </h2>
                        <div className="mt-4 space-y-3 text-sm text-slate-700">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Email</span>
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Nomor HP</span>
                                <span>{user.phone ?? '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Jenis Kelamin
                                </span>
                                <span>{user.gender ?? '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Terdaftar
                                </span>
                                <span>{user.created_at ?? '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Status Akun
                        </h2>
                        <div className="mt-4 space-y-3 text-sm text-slate-700">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Verifikasi Email
                                </span>
                                <Badge
                                    className={
                                        user.email_verified_at
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-amber-50 text-amber-700'
                                    }
                                >
                                    {user.email_verified_at
                                        ? 'verified'
                                        : 'unverified'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Status</span>
                                <Badge
                                    className={
                                        user.is_suspended
                                            ? 'bg-rose-50 text-rose-700'
                                            : 'bg-emerald-50 text-emerald-700'
                                    }
                                >
                                    {user.is_suspended ? 'suspended' : 'active'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Suspend sejak
                                </span>
                                <span>{user.suspended_at ?? '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Alasan suspend
                                </span>
                                <span className="text-right">
                                    {user.suspended_reason ?? '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Riwayat Transaksi
                    </h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Produk
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Kode
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Pembayaran
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Tanggal
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((trx) => (
                                    <tr
                                        key={`${trx.type}-${trx.id}`}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">
                                                {trx.title}
                                            </div>
                                            <div className="text-xs text-slate-400 uppercase">
                                                {trx.type}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {trx.code}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {typeof trx.total === 'number'
                                                ? `Rp ${trx.total.toLocaleString('id-ID')}`
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {trx.status ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {trx.payment_status ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {trx.created_at ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-8 text-center text-sm text-slate-500"
                                        >
                                            Belum ada transaksi.
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
