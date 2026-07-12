import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';

type Staff = {
    id: number;
    name: string;
    email: string | null;
    role: string;
    is_active: boolean;
};

type Props = {
    organizer: { id: number; name?: string | null };
    staff: Staff[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Staff & Role', href: '/mitra/events/staff' },
];

export default function MitraEventStaffIndex({ organizer, staff }: Props) {
    const form = useForm({
        name: '',
        email: '',
        role: 'staff_checkin',
        is_active: true,
    });

    const handleSubmit = () => {
        form.post('/mitra/events/staff', {
            onSuccess: () => {
                Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Staff ditambahkan.' });
                form.reset();
            },
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menyimpan staff.' }),
        });
    };

    const updateStaff = (item: Staff, field: string, value: string | boolean) => {
        router.put(
            `/mitra/events/staff/${item.id}`,
            {
                name: field === 'name' ? value : item.name,
                email: field === 'email' ? value : item.email,
                role: field === 'role' ? value : item.role,
                is_active: field === 'is_active' ? value : item.is_active,
            },
            {
                preserveScroll: true,
                onSuccess: () => Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Staff diperbarui.' }),
                onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memperbarui staff.' }),
            }
        );
    };

    const deleteStaff = async (staffId: number) => {
        const result = await Swal.fire({
            title: 'Hapus staff?',
            text: 'Data staff akan dihapus.',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.delete(`/mitra/events/staff/${staffId}`, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Staff dihapus.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menghapus staff.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Staff Mitra Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-sky-600">Akses Mitra</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                        Staff {organizer.name ?? ''}
                    </h1>
                    <p className="text-sm text-slate-500">Tambah staff dan atur role akses.</p>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSubmit();
                        }}
                    >
                        <FormField label="Nama staff">
                            <input
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.name} />
                        </FormField>
                        <FormField label="Email">
                            <input
                                value={form.data.email}
                                onChange={(event) => form.setData('email', event.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </FormField>
                        <FormField label="Role akses">
                            <select
                                value={form.data.role}
                                onChange={(event) => form.setData('role', event.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="owner">Owner</option>
                                <option value="admin_event">Admin Event</option>
                                <option value="staff_checkin">Staff Check-in</option>
                            </select>
                        </FormField>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Tambah
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Nama</th>
                                    <th className="px-4 py-3 text-left">Email</th>
                                    <th className="px-4 py-3 text-left">Role</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                <span>Nama staff</span>
                                                <input
                                                    defaultValue={item.name}
                                                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                                    onBlur={(event) => updateStaff(item, 'name', event.target.value)}
                                                />
                                            </label>
                                        </td>
                                        <td className="px-4 py-3">
                                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                <span>Email staff</span>
                                                <input
                                                    defaultValue={item.email ?? ''}
                                                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                                    onBlur={(event) => updateStaff(item, 'email', event.target.value)}
                                                />
                                            </label>
                                        </td>
                                        <td className="px-4 py-3">
                                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                <span>Role staff</span>
                                                <select
                                                    defaultValue={item.role}
                                                    className="rounded border border-slate-200 px-2 py-1 text-xs"
                                                    onChange={(event) => updateStaff(item, 'role', event.target.value)}
                                                >
                                                    <option value="owner">Owner</option>
                                                    <option value="admin_event">Admin Event</option>
                                                    <option value="staff_checkin">Staff Check-in</option>
                                                </select>
                                            </label>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}>
                                                {item.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateStaff(item, 'is_active', !item.is_active)}
                                                >
                                                    {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                                    onClick={() => deleteStaff(item.id)}
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {staff.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada staff.
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
