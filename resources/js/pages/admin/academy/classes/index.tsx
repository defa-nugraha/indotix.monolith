import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';

type AcademyClass = {
    id: number;
    title: string;
    category?: string | null;
    start_at: string;
    end_at: string;
    capacity_total: number;
    capacity_sold: number;
    status: string;
    is_active: boolean;
};

type Props = {
    classes: { data: AcademyClass[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    filters: { status?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Eljohn Academy', href: '/admin/academy/classes' },
    { title: 'Master Kelas', href: '/admin/academy/classes' },
];

const emptyForm = {
    title: '',
    description: '',
    category: '',
    start_at: '',
    end_at: '',
    duration_minutes: 0,
    location_type: 'offline',
    location_detail: '',
    capacity_total: 0,
    status: 'draft',
    is_active: true,
};

export default function AcademyClassesIndex({ classes, filters }: Props) {
    const [editing, setEditing] = useState<AcademyClass | null>(null);
    const form = useForm({ ...emptyForm });
    const [isFormOpen, setIsFormOpen] = useState(false);

    const openCreate = () => {
        setEditing(null);
        form.setData({ ...emptyForm });
        setIsFormOpen(true);
    };

    const openEdit = (item: AcademyClass) => {
        setEditing(item);
        form.setData({
            ...emptyForm,
            title: item.title,
            category: item.category ?? '',
            start_at: item.start_at?.replace(' ', 'T') ?? '',
            end_at: item.end_at?.replace(' ', 'T') ?? '',
            capacity_total: item.capacity_total,
            status: item.status,
            is_active: item.is_active,
        });
        setIsFormOpen(true);
    };

    const submit = () => {
        const payload = {
            ...form.data,
            duration_minutes: Number(form.data.duration_minutes || 0),
            capacity_total: Number(form.data.capacity_total || 0),
            is_active: Boolean(form.data.is_active),
        };

        if (editing) {
            router.put(`/admin/academy/classes/${editing.id}`, payload, {
                onSuccess: () => {
                    Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Kelas diperbarui.' });
                    setIsFormOpen(false);
                },
                onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Periksa data.' }),
            });
        } else {
            form.post('/admin/academy/classes', {
                onSuccess: () => {
                    Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Kelas dibuat.' });
                    setIsFormOpen(false);
                },
                onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Periksa data.' }),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master Kelas Academy" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Academy</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Master Kelas</h1>
                            <p className="text-sm text-slate-500">Kelola kelas dan jadwal.</p>
                        </div>
                        <div className="flex gap-2">
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const data = new FormData(event.currentTarget);
                                    router.get('/admin/academy/classes', Object.fromEntries(data.entries()));
                                }}
                            >
                                <select
                                    name="status"
                                    defaultValue={filters.status ?? ''}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="draft">draft</option>
                                    <option value="scheduled">scheduled</option>
                                    <option value="open_for_sale">open_for_sale</option>
                                    <option value="closed">closed</option>
                                    <option value="completed">completed</option>
                                    <option value="cancelled">cancelled</option>
                                </select>
                            </form>
                            <Button className="bg-sky-600 text-white hover:bg-sky-700" onClick={openCreate}>
                                Buat Kelas
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="overflow-hidden rounded-2xl border border-slate-100">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Judul</th>
                                        <th className="px-4 py-3 text-left">Jadwal</th>
                                        <th className="px-4 py-3 text-left">Kapasitas</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.data.map((item) => (
                                        <tr key={item.id} className="border-t border-slate-100">
                                            <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.start_at} → {item.end_at}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.capacity_sold}/{item.capacity_total}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge className="bg-slate-100 text-slate-700">{item.status}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" asChild>
                                                        <a href={`/admin/academy/classes/${item.id}`}>Detail</a>
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                                                        Edit
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {classes.data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Belum ada kelas.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Kelas' : 'Buat Kelas'}</DialogTitle>
                            <DialogDescription>Lengkapi data kelas sebelum disimpan.</DialogDescription>
                        </DialogHeader>
                        <form
                            className="grid gap-3"
                            onSubmit={(event) => {
                                event.preventDefault();
                                submit();
                            }}
                        >
                            <input
                                value={form.data.title}
                                onChange={(event) => form.setData('title', event.target.value)}
                                placeholder="Nama kelas"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.title} />
                            <input
                                value={form.data.category}
                                onChange={(event) => form.setData('category', event.target.value)}
                                placeholder="Kategori"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <textarea
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                                placeholder="Deskripsi"
                                rows={3}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <input
                                type="datetime-local"
                                value={form.data.start_at}
                                onChange={(event) => form.setData('start_at', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <input
                                type="datetime-local"
                                value={form.data.end_at}
                                onChange={(event) => form.setData('end_at', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <input
                                type="number"
                                min={0}
                                value={form.data.duration_minutes}
                                onChange={(event) => form.setData('duration_minutes', Number(event.target.value))}
                                placeholder="Durasi (menit)"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <select
                                value={form.data.location_type}
                                onChange={(event) => form.setData('location_type', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="offline">Offline</option>
                                <option value="online">Online</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                            <input
                                value={form.data.location_detail}
                                onChange={(event) => form.setData('location_detail', event.target.value)}
                                placeholder="Alamat / Link"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <input
                                type="number"
                                min={0}
                                value={form.data.capacity_total}
                                onChange={(event) => form.setData('capacity_total', Number(event.target.value))}
                                placeholder="Kapasitas"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <select
                                value={form.data.status}
                                onChange={(event) => form.setData('status', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="draft">draft</option>
                                <option value="scheduled">scheduled</option>
                                <option value="open_for_sale">open_for_sale</option>
                                <option value="closed">closed</option>
                                <option value="completed">completed</option>
                                <option value="cancelled">cancelled</option>
                            </select>
                            <select
                                value={form.data.is_active ? '1' : '0'}
                                onChange={(event) => form.setData('is_active', event.target.value === '1')}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="1">Aktif</option>
                                <option value="0">Nonaktif</option>
                            </select>
                            <DialogFooter className="gap-2">
                                <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                    Simpan
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                    Batal
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
