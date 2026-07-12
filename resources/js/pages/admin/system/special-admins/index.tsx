import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InputError from '@/components/input-error';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sistem, Audit & Kontrol', href: '/admin/system/special-admins' },
    { title: 'Kelola Admin Spesialis', href: '/admin/system/special-admins' },
];

type RoleOption = {
    value: string;
    label: string;
};

type AdminRow = {
    id: number;
    name: string;
    email: string;
    role: string;
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
    admins: {
        data: AdminRow[];
        links: PaginationLink[];
    };
    filters: {
        search?: string;
        role?: string;
    };
    roleOptions: RoleOption[];
};

const roleTone = (role: string) => {
    if (role === 'admin_academy') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    if (role === 'admin_retail') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (role === 'admin_special_program') return 'bg-sky-50 text-sky-700 border-sky-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
};

export default function SpecialAdminIndex({ admins, filters, roleOptions }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminRow | null>(null);
    const [roleChanges, setRoleChanges] = useState<Record<number, string>>({});
    const [savingId, setSavingId] = useState<number | null>(null);

    const roleLabelMap = useMemo(() => {
        return roleOptions.reduce<Record<string, string>>((acc, option) => {
            acc[option.value] = option.label;
            return acc;
        }, {});
    }, [roleOptions]);

    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        role: roleOptions[0]?.value ?? 'admin_academy',
    });

    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        role: roleOptions[0]?.value ?? 'admin_academy',
    });

    useEffect(() => {
        const initial = admins.data.reduce<Record<number, string>>((acc, admin) => {
            acc[admin.id] = admin.role ?? roleOptions[0]?.value ?? 'admin_academy';
            return acc;
        }, {});
        setRoleChanges(initial);
    }, [admins.data, roleOptions]);

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/admin/system/special-admins', Object.fromEntries(form.entries()), {
            preserveState: true,
        });
    };

    const submitCreate = (event: React.FormEvent) => {
        event.preventDefault();
        createForm.post('/admin/system/special-admins', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setCreateOpen(false);
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Akun admin dibuat.' });
            },
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat membuat akun admin.' }),
        });
    };

    const openEditModal = (admin: AdminRow) => {
        setSelectedAdmin(admin);
        editForm.clearErrors();
        editForm.setData({
            name: admin.name,
            email: admin.email,
            password: '',
            role: admin.role,
        });
        setEditOpen(true);
    };

    const submitEdit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedAdmin) return;

        editForm.put(`/admin/system/special-admins/${selectedAdmin.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                editForm.reset('password');
                setEditOpen(false);
                setSelectedAdmin(null);
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data admin diperbarui.' });
            },
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memperbarui data admin.' }),
        });
    };

    const handleSave = (admin: AdminRow) => {
        const role = roleChanges[admin.id] ?? admin.role;
        setSavingId(admin.id);
        router.put(
            `/admin/system/special-admins/${admin.id}`,
            {
                name: admin.name,
                email: admin.email,
                role,
                password: '',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Role diperbarui.' });
                },
                onError: (errors) => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: errors?.role ?? errors?.email ?? errors?.name ?? 'Tidak dapat memperbarui role.',
                    });
                },
                onFinish: () => setSavingId(null),
            },
        );
    };

    const handleDelete = async (admin: AdminRow) => {
        const result = await Swal.fire({
            title: `Hapus ${admin.name}?`,
            text: 'Akun admin akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;

        router.delete(`/admin/system/special-admins/${admin.id}`, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Akun dihapus.' }),
            onError: (errors) => Swal.fire({ icon: 'error', title: 'Gagal', text: errors?.delete ?? 'Tidak dapat menghapus akun.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Admin Spesialis" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-sky-600">
                                Admin Spesialis
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Kelola akun admin Academy, Retail Shop, Special Program
                            </h1>
                            <p className="text-sm text-slate-500">
                                Buat akun admin baru dan atur role aksesnya.
                            </p>
                        </div>
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-sky-600 text-white hover:bg-sky-700">Tambah Admin</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Admin Spesialis</DialogTitle>
                                </DialogHeader>
                                <form className="grid gap-4" onSubmit={submitCreate}>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Nama</label>
                                        <input
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={createForm.data.name}
                                            onChange={(event) => createForm.setData('name', event.target.value)}
                                        />
                                        <InputError message={createForm.errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={createForm.data.email}
                                            onChange={(event) => createForm.setData('email', event.target.value)}
                                        />
                                        <InputError message={createForm.errors.email} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Password</label>
                                        <input
                                            type="password"
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={createForm.data.password}
                                            onChange={(event) => createForm.setData('password', event.target.value)}
                                        />
                                        <InputError message={createForm.errors.password} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Role</label>
                                        <select
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={createForm.data.role}
                                            onChange={(event) => createForm.setData('role', event.target.value)}
                                        >
                                            {roleOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={createForm.errors.role} />
                                    </div>
                                    <DialogFooter className="gap-2 sm:justify-end">
                                        <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                                            Batal
                                        </Button>
                                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700" disabled={createForm.processing}>
                                            Simpan
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <Dialog
                            open={editOpen}
                            onOpenChange={(open) => {
                                setEditOpen(open);
                                if (!open) {
                                    setSelectedAdmin(null);
                                    editForm.reset();
                                    editForm.clearErrors();
                                }
                            }}
                        >
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Edit Admin Spesialis</DialogTitle>
                                </DialogHeader>
                                <form className="grid gap-4" onSubmit={submitEdit}>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Nama</label>
                                        <input
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={editForm.data.name}
                                            onChange={(event) => editForm.setData('name', event.target.value)}
                                        />
                                        <InputError message={editForm.errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={editForm.data.email}
                                            onChange={(event) => editForm.setData('email', event.target.value)}
                                        />
                                        <InputError message={editForm.errors.email} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Password Baru</label>
                                        <input
                                            type="password"
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={editForm.data.password}
                                            onChange={(event) => editForm.setData('password', event.target.value)}
                                            placeholder="Kosongkan jika tidak ingin mengganti password"
                                        />
                                        <InputError message={editForm.errors.password} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Role</label>
                                        <select
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                            value={editForm.data.role}
                                            onChange={(event) => editForm.setData('role', event.target.value)}
                                        >
                                            {roleOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={editForm.errors.role} />
                                    </div>
                                    <DialogFooter className="gap-2 sm:justify-end">
                                        <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                                            Batal
                                        </Button>
                                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700" disabled={editForm.processing}>
                                            Simpan Perubahan
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-3">
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Cari admin
                            </label>
                            <input
                                name="search"
                                defaultValue={filters.search ?? ''}
                                placeholder="Nama atau email"
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
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
                            <thead className="text-xs uppercase text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">Admin</th>
                                    <th className="py-3 pr-4">Role</th>
                                    <th className="py-3 pr-4">Assign Role</th>
                                    <th className="py-3 pr-4">Dibuat</th>
                                    <th className="py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {admins.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-slate-500">
                                            Belum ada admin spesialis.
                                        </td>
                                    </tr>
                                )}
                                {admins.data.map((admin) => {
                                    const nextRole = roleChanges[admin.id] ?? admin.role;
                                    return (
                                        <tr key={admin.id}>
                                            <td className="py-4 pr-4">
                                                <div className="font-semibold text-slate-900">{admin.name}</div>
                                                <div className="text-xs text-slate-500">{admin.email}</div>
                                            </td>
                                            <td className="py-4 pr-4">
                                                <Badge className={roleTone(admin.role)}>
                                                    {roleLabelMap[admin.role] ?? admin.role}
                                                </Badge>
                                            </td>
                                            <td className="py-4 pr-4">
                                                <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                    <span>Role</span>
                                                    <select
                                                        value={nextRole}
                                                        onChange={(event) =>
                                                            setRoleChanges((prev) => ({
                                                                ...prev,
                                                                [admin.id]: event.target.value,
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
                                                </label>
                                            </td>
                                            <td className="py-4 pr-4 text-xs text-slate-500">
                                                {admin.created_at ?? '-'}
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-sky-600 text-white hover:bg-sky-700"
                                                        disabled={savingId === admin.id || nextRole === admin.role}
                                                        onClick={() => handleSave(admin)}
                                                    >
                                                        Simpan
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => openEditModal(admin)}>
                                                        Edit
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleDelete(admin)}>
                                                        Hapus
                                                    </Button>
                                                </div>
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
