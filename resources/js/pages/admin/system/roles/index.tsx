import { Head, router, useForm } from '@inertiajs/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sistem, Audit & Kontrol', href: '/admin/system/roles' },
    { title: 'Manajemen Role', href: '/admin/system/roles' },
];

type RoleOption = {
    value: string;
    label: string;
};

type AdminRole = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    users_count: number;
    permissions: string[];
};

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    admin_role_id?: number | null;
    admin_role_name?: string | null;
    mitra_onboarding_type?: string | null;
    is_suspended?: boolean;
    email_verified_at?: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PermissionMatrix = {
    actions: Array<{ key: string; label: string }>;
    features: Array<{ key: string; label: string; parent?: string | null }>;
};

type Props = {
    users: {
        data: UserRow[];
        links: PaginationLink[];
    };
    roles: AdminRole[];
    filters: {
        search?: string;
        role?: string;
    };
    roleOptions: RoleOption[];
    permissionMatrix: PermissionMatrix;
};

const roleTone = (role: string) => {
    if (role === 'admin') return 'border-transparent bg-sky-600 text-white';
    if (role === 'admin_custom')
        return 'border-emerald-100 bg-emerald-50 text-emerald-700';
    if (role.startsWith('admin_'))
        return 'border-indigo-100 bg-indigo-50 text-indigo-700';
    if (role === 'mitra') return 'border-amber-100 bg-amber-50 text-amber-700';
    return 'border-slate-100 bg-slate-50 text-slate-600';
};

const emptyRoleForm = {
    name: '',
    description: '',
    is_active: true,
    permissions: [] as string[],
};

export default function RoleManagementIndex({
    users,
    roles,
    filters,
    roleOptions,
    permissionMatrix,
}: Props) {
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [assignments, setAssignments] = useState<Record<number, string>>({});
    const [savingUserId, setSavingUserId] = useState<number | null>(null);

    const form = useForm(emptyRoleForm);

    const assignmentOptions = useMemo(() => {
        return [
            ...roleOptions,
            ...roles.map((role) => ({
                value: `custom:${role.id}`,
                label: `RBAC - ${role.name}`,
            })),
        ];
    }, [roleOptions, roles]);

    const groupedFeatures = useMemo(() => {
        return permissionMatrix.features.reduce<
            Array<{ group: string; features: PermissionMatrix['features'] }>
        >((groups, feature) => {
            const group = feature.parent ?? feature.label;
            const existing = groups.find((item) => item.group === group);

            if (existing) {
                existing.features.push(feature);
                return groups;
            }

            groups.push({ group, features: [feature] });
            return groups;
        }, []);
    }, [permissionMatrix.features]);

    const roleLabelMap = useMemo(() => {
        return assignmentOptions.reduce<Record<string, string>>(
            (acc, option) => {
                acc[option.value] = option.label;
                return acc;
            },
            {},
        );
    }, [assignmentOptions]);

    useEffect(() => {
        const initial = users.data.reduce<Record<number, string>>(
            (acc, user) => {
                acc[user.id] = user.admin_role_id
                    ? `custom:${user.admin_role_id}`
                    : (user.role ?? 'user');
                return acc;
            },
            {},
        );
        setAssignments(initial);
    }, [users.data]);

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const filterForm = new FormData(event.currentTarget);
        router.get(
            '/admin/system/roles',
            Object.fromEntries(filterForm.entries()),
            {
                preserveState: true,
            },
        );
    };

    const startCreate = () => {
        setEditingRoleId(null);
        form.setData(emptyRoleForm);
        form.clearErrors();
        setRoleModalOpen(true);
    };

    const resetRoleForm = () => {
        setEditingRoleId(null);
        form.setData(emptyRoleForm);
        form.clearErrors();
    };

    const startEdit = (role: AdminRole) => {
        setEditingRoleId(role.id);
        form.setData({
            name: role.name,
            description: role.description ?? '',
            is_active: role.is_active,
            permissions: role.permissions,
        });
        form.clearErrors();
        setRoleModalOpen(true);
    };

    const togglePermission = (permission: string, checked: boolean) => {
        form.setData(
            'permissions',
            checked
                ? Array.from(new Set([...form.data.permissions, permission]))
                : form.data.permissions.filter((item) => item !== permission),
        );
    };

    const toggleFeature = (feature: string, checked: boolean) => {
        const featurePermissions = permissionMatrix.actions.map(
            (action) => `${feature}.${action.key}`,
        );

        form.setData(
            'permissions',
            checked
                ? Array.from(
                      new Set([
                          ...form.data.permissions,
                          ...featurePermissions,
                      ]),
                  )
                : form.data.permissions.filter(
                      (item) => !featurePermissions.includes(item),
                  ),
        );
    };

    const toggleFeatureGroup = (
        features: PermissionMatrix['features'],
        checked: boolean,
    ) => {
        const groupPermissions = features.flatMap((feature) =>
            permissionMatrix.actions.map(
                (action) => `${feature.key}.${action.key}`,
            ),
        );

        form.setData(
            'permissions',
            checked
                ? Array.from(
                      new Set([...form.data.permissions, ...groupPermissions]),
                  )
                : form.data.permissions.filter(
                      (item) => !groupPermissions.includes(item),
                  ),
        );
    };

    const submitRole = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: editingRoleId
                        ? 'Role berhasil diperbarui.'
                        : 'Role berhasil dibuat.',
                });
                resetRoleForm();
                setRoleModalOpen(false);
            },
            onError: () => {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Periksa kembali nama role dan permission yang dipilih.',
                });
            },
        };

        if (editingRoleId) {
            form.put(`/admin/system/roles/${editingRoleId}`, options);
            return;
        }

        form.post('/admin/system/roles', options);
    };

    const deleteRole = async (role: AdminRole) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Hapus role?',
            text: `Role ${role.name} akan dihapus permanen.`,
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });

        if (!result.isConfirmed) return;

        router.delete(`/admin/system/roles/${role.id}`, {
            preserveScroll: true,
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Role berhasil dihapus.',
                }),
            onError: (errors) =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: errors?.role ?? 'Role tidak dapat dihapus.',
                }),
        });
    };

    const saveAssignment = (user: UserRow) => {
        const assignment = assignments[user.id] ?? user.role;
        setSavingUserId(user.id);

        router.put(
            `/admin/system/roles/users/${user.id}`,
            { assignment },
            {
                preserveScroll: true,
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Role user berhasil diperbarui.',
                    });
                },
                onError: (errors) => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text:
                            errors?.assignment ??
                            'Tidak dapat memperbarui role user.',
                    });
                },
                onFinish: () => setSavingUserId(null),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Role" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold text-sky-600 uppercase">
                        RBAC Admin
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                        Manajemen Role & Permission
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Buat role admin custom, pilih akses CRUD per fitur, lalu
                        assign role ke user admin.
                    </p>
                </section>

                <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Daftar Role RBAC
                            </h2>
                            <p className="text-sm text-slate-500">
                                Role custom untuk admin selain Admin Utama.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={startCreate}
                        >
                            Role Baru
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {roles.length === 0 && (
                            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                Belum ada role RBAC.
                            </div>
                        )}
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                className="rounded-lg border border-slate-200 p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold text-slate-900">
                                                {role.name}
                                            </h3>
                                            <Badge
                                                className={
                                                    role.is_active
                                                        ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                                        : 'border-slate-100 bg-slate-50 text-slate-500'
                                                }
                                            >
                                                {role.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </div>
                                        {role.description && (
                                            <p className="mt-1 text-sm text-slate-500">
                                                {role.description}
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs text-slate-400">
                                            {role.permissions.length}{' '}
                                            permission, {role.users_count} user
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => startEdit(role)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={role.users_count > 0}
                                            onClick={() => deleteRole(role)}
                                        >
                                            Hapus
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <Dialog
                    open={roleModalOpen}
                    onOpenChange={(open) => {
                        setRoleModalOpen(open);
                        if (!open) resetRoleForm();
                    }}
                >
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRoleId ? 'Edit Role' : 'Buat Role Baru'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={submitRole} className="grid gap-5">
                            <p className="text-sm text-slate-500">
                                Permission disediakan sebagai pilihan CRUD per
                                fitur.
                            </p>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase">
                                        Nama Role
                                    </label>
                                    <input
                                        value={form.data.name}
                                        onChange={(event) =>
                                            form.setData(
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                        placeholder="Contoh: Admin Finance"
                                    />
                                    {form.errors.name && (
                                        <p className="text-xs text-rose-600">
                                            {form.errors.name}
                                        </p>
                                    )}
                                </div>

                                <label className="flex items-center gap-2 self-end text-sm font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_active}
                                        onChange={(event) =>
                                            form.setData(
                                                'is_active',
                                                event.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    Role aktif
                                </label>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase">
                                    Deskripsi
                                </label>
                                <textarea
                                    value={form.data.description}
                                    onChange={(event) =>
                                        form.setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                                    placeholder="Ruang lingkup role"
                                />
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-100">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-400 uppercase">
                                        <tr>
                                            <th className="py-3 pr-4 pl-4">
                                                Fitur
                                            </th>
                                            {permissionMatrix.actions.map(
                                                (action) => (
                                                    <th
                                                        key={action.key}
                                                        className="px-3 py-3 text-center"
                                                    >
                                                        {action.label}
                                                    </th>
                                                ),
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {groupedFeatures.map((group) => {
                                            const groupKeys =
                                                group.features.flatMap(
                                                    (feature) =>
                                                        permissionMatrix.actions.map(
                                                            (action) =>
                                                                `${feature.key}.${action.key}`,
                                                        ),
                                                );
                                            const groupChecked =
                                                groupKeys.length > 0 &&
                                                groupKeys.some((key) =>
                                                    form.data.permissions.includes(
                                                        key,
                                                    ),
                                                );

                                            return (
                                                <Fragment key={group.group}>
                                                    <tr className="bg-slate-50/70">
                                                        <td
                                                            colSpan={
                                                                permissionMatrix
                                                                    .actions
                                                                    .length + 1
                                                            }
                                                            className="px-4 py-2"
                                                        >
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        groupChecked
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        toggleFeatureGroup(
                                                                            group.features,
                                                                            event
                                                                                .target
                                                                                .checked,
                                                                        )
                                                                    }
                                                                    className="h-4 w-4 rounded border-slate-300"
                                                                />
                                                                {group.group}
                                                            </label>
                                                        </td>
                                                    </tr>
                                                    {group.features.map(
                                                        (feature) => {
                                                            const featureKeys =
                                                                permissionMatrix.actions.map(
                                                                    (action) =>
                                                                        `${feature.key}.${action.key}`,
                                                                );
                                                            const anyChecked =
                                                                featureKeys.some(
                                                                    (key) =>
                                                                        form.data.permissions.includes(
                                                                            key,
                                                                        ),
                                                                );

                                                            return (
                                                                <tr
                                                                    key={
                                                                        feature.key
                                                                    }
                                                                >
                                                                    <td className="py-3 pr-4 pl-8">
                                                                        <label className="flex items-center gap-2 font-medium text-slate-700">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={
                                                                                    anyChecked
                                                                                }
                                                                                onChange={(
                                                                                    event,
                                                                                ) =>
                                                                                    toggleFeature(
                                                                                        feature.key,
                                                                                        event
                                                                                            .target
                                                                                            .checked,
                                                                                    )
                                                                                }
                                                                                className="h-4 w-4 rounded border-slate-300"
                                                                            />
                                                                            {
                                                                                feature.label
                                                                            }
                                                                        </label>
                                                                    </td>
                                                                    {permissionMatrix.actions.map(
                                                                        (
                                                                            action,
                                                                        ) => {
                                                                            const permission = `${feature.key}.${action.key}`;

                                                                            return (
                                                                                <td
                                                                                    key={
                                                                                        permission
                                                                                    }
                                                                                    className="px-3 py-3 text-center"
                                                                                >
                                                                                    <label className="inline-flex items-center justify-center">
                                                                                        <span className="sr-only">
                                                                                            Permission {permission}
                                                                                        </span>
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={form.data.permissions.includes(
                                                                                                permission,
                                                                                            )}
                                                                                            onChange={(
                                                                                                event,
                                                                                            ) =>
                                                                                                togglePermission(
                                                                                                    permission,
                                                                                                    event
                                                                                                        .target
                                                                                                        .checked,
                                                                                                )
                                                                                            }
                                                                                            className="h-4 w-4 rounded border-slate-300"
                                                                                        />
                                                                                    </label>
                                                                                </td>
                                                                            );
                                                                        },
                                                                    )}
                                                                </tr>
                                                            );
                                                        },
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setRoleModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                    disabled={form.processing}
                                >
                                    {editingRoleId
                                        ? 'Simpan Role'
                                        : 'Buat Role'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                    <form
                        onSubmit={applyFilters}
                        className="grid gap-4 md:grid-cols-3"
                    >
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase">
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
                            <label className="text-xs font-semibold text-slate-400 uppercase">
                                Role
                            </label>
                            <select
                                name="role"
                                defaultValue={filters.role ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua</option>
                                {assignmentOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <Button
                                type="submit"
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                Terapkan Filter
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">
                            Assign Role ke User
                        </h2>
                        <p className="text-sm text-slate-500">
                            Pilih role bawaan atau role RBAC custom untuk user.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs text-slate-400 uppercase">
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
                                        <td
                                            colSpan={5}
                                            className="py-10 text-center text-slate-500"
                                        >
                                            Tidak ada user ditemukan.
                                        </td>
                                    </tr>
                                )}
                                {users.data.map((user) => {
                                    const currentAssignment = user.admin_role_id
                                        ? `custom:${user.admin_role_id}`
                                        : user.role;
                                    const nextAssignment =
                                        assignments[user.id] ??
                                        currentAssignment;
                                    const statusLabel = user.is_suspended
                                        ? 'Suspend'
                                        : user.email_verified_at
                                          ? 'Terverifikasi'
                                          : 'Belum verifikasi';

                                    return (
                                        <tr key={user.id}>
                                            <td className="py-4 pr-4">
                                                <div className="font-semibold text-slate-900">
                                                    {user.name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {user.email}
                                                </div>
                                                {user.mitra_onboarding_type && (
                                                    <div className="text-xs text-slate-400">
                                                        Mitra:{' '}
                                                        {
                                                            user.mitra_onboarding_type
                                                        }
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 pr-4">
                                                <Badge
                                                    className={roleTone(
                                                        user.admin_role_id
                                                            ? 'admin_custom'
                                                            : user.role,
                                                    )}
                                                >
                                                    {roleLabelMap[
                                                        currentAssignment
                                                    ] ??
                                                        user.admin_role_name ??
                                                        user.role}
                                                </Badge>
                                            </td>
                                            <td className="py-4 pr-4">
                                                <Badge className="border-slate-100 bg-slate-50 text-slate-600">
                                                    {statusLabel}
                                                </Badge>
                                            </td>
                                            <td className="py-4 pr-4">
                                                <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                    <span>Role</span>
                                                    <select
                                                        value={nextAssignment}
                                                        onChange={(event) =>
                                                            setAssignments(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [user.id]:
                                                                        event.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                                    >
                                                        {assignmentOptions.map(
                                                            (option) => (
                                                                <option
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    value={
                                                                        option.value
                                                                    }
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </label>
                                            </td>
                                            <td className="py-4 text-right">
                                                <Button
                                                    size="sm"
                                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                                    disabled={
                                                        savingUserId ===
                                                            user.id ||
                                                        nextAssignment ===
                                                            currentAssignment
                                                    }
                                                    onClick={() =>
                                                        saveAssignment(user)
                                                    }
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
                </section>
            </div>
        </AppLayout>
    );
}
