import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sistem, Audit & Kontrol', href: '/admin/system/roles' },
    { title: 'Manajemen Role', href: '/admin/system/roles' },
];

type RoleOption = {
    value: string;
    label: string;
};

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    mitra_onboarding_type?: string | null;
    is_suspended?: boolean;
    email_verified_at?: string | null;
    created_at?: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    users: {
        data: UserRow[];
        links: PaginationLink[];
    };
    filters: {
        search?: string;
        role?: string;
    };
    roleOptions: RoleOption[];
};

const roleTone = (role: string) => {
    if (role === 'admin') return 'bg-sky-600 text-white border-transparent';
    if (role.startsWith('admin_')) return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    if (role === 'mitra') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
};

const statusTone = (status: string) => {
    if (status === 'Suspend') return 'bg-rose-50 text-rose-700 border-rose-100';
    if (status === 'Terverifikasi') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
};

export default function RoleManagementIndex({ users, filters, roleOptions }: Props) {
    const [roleChanges, setRoleChanges] = useState<Record<number, string>>({});
    const [savingId, setSavingId] = useState<number | null>(null);

    const roleLabelMap = useMemo(() => {
        return roleOptions.reduce<Record<string, string>>((acc, option) => {
            acc[option.value] = option.label;
            return acc;
        }, {});
    }, [roleOptions]);

    useEffect(() => {
        const initial = users.data.reduce<Record<number, string>>((acc, user) => {
            acc[user.id] = user.role ?? 'user';
            return acc;
        }, {});
        setRoleChanges(initial);
    }, [users.data]);

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/admin/system/roles', Object.fromEntries(form.entries()), {
            preserveState: true,
        });
    };

    const handleSave = (user: UserRow) => {
        const role = roleChanges[user.id] ?? user.role;
        setSavingId(user.id);
        router.put(`/admin/system/roles/${user.id}`, { role }, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Role berhasil diperbarui.' });
            },
            onError: (errors) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: errors?.role ?? 'Tidak dapat memperbarui role.',
                });
            },
            onFinish: () => setSavingId(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Role" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                            Role Management
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Manajemen Role User & Admin
                        </h1>
                        <p className="text-sm text-slate-500">
                            Atur akses admin, mitra, dan user dari satu panel.
                        </p>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-3">
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Cari user
                            </label>
                            <input
                                name="search"
                                defaultValue={filters.search ?? ''}
                                placeholder="Nama atau email"
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Role
                            </label>
                            <select
                                name="role"
                                defaultValue={filters.role ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua</option>
                                {roleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Terapkan Filter
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">User</th>
                                    <th className="py-3 pr-4">Role Saat Ini</th>
                                    <th className="py-3 pr-4">Status</th>
                                    <th className="py-3 pr-4">Assign Role</th>
                                    <th className="py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-slate-500">
                                            Tidak ada user ditemukan.
                                        </td>
                                    </tr>
                                )}
                                {users.data.map((user) => {
                                    const nextRole = roleChanges[user.id] ?? user.role;
                                    const statusLabel = user.is_suspended
                                        ? 'Suspend'
                                        : user.email_verified_at
                                            ? 'Terverifikasi'
                                            : 'Belum verifikasi';
                                    return (
                                        <tr key={user.id}>
                                            <td className="py-4 pr-4">
                                                <div className="font-semibold text-slate-900">{user.name}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                                {user.mitra_onboarding_type && (
                                                    <div className="text-xs text-slate-400">
                                                        Mitra: {user.mitra_onboarding_type}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 pr-4">
                                                <Badge className={roleTone(user.role)}>
                                                    {roleLabelMap[user.role] ?? user.role}
                                                </Badge>
                                            </td>
                                            <td className="py-4 pr-4">
                                                <Badge className={statusTone(statusLabel)}>{statusLabel}</Badge>
                                            </td>
                                            <td className="py-4 pr-4">
                                                <select
                                                    value={nextRole}
                                                    onChange={(event) =>
                                                        setRoleChanges((prev) => ({
                                                            ...prev,
                                                            [user.id]: event.target.value,
                                                        }))
                                                    }
                                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                                >
                                                    {roleOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-4 text-right">
                                                <Button
                                                    size="sm"
                                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                                    disabled={savingId === user.id || nextRole === user.role}
                                                    onClick={() => handleSave(user)}
                                                >
                                                    Simpan
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {users.links?.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                            {users.links.map((link) => (
                                <Button
                                    key={link.label}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                </Button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
