import { Head, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
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

type ClassImage = {
    id: number;
    image_path: string;
};

type AcademyClass = {
    id: number;
    title: string;
    description?: string | null;
    category?: string | null;
    start_at: string;
    end_at: string;
    duration_minutes?: number | null;
    location_type?: string | null;
    location_detail?: string | null;
    capacity_total: number;
    capacity_sold: number;
    status: string;
    is_active: boolean;
    images?: ClassImage[];
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
    images: [] as File[],
};

const toDate = (value?: string | null) => {
    if (!value) return null;
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
};

const toDatetimeLocal = (value?: string | null) => {
    const date = toDate(value);
    if (!date) return '';
    return format(date, "yyyy-MM-dd'T'HH:mm");
};

const formatSchedule = (start?: string | null, end?: string | null) => {
    const startDate = toDate(start);
    const endDate = toDate(end);
    if (!startDate || !endDate) return start ?? '-';

    const sameDay =
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getDate() === endDate.getDate();

    if (sameDay) {
        return `${format(startDate, 'd MMM yyyy', { locale: localeId })}, ${format(startDate, 'HH:mm', { locale: localeId })} - ${format(endDate, 'HH:mm', { locale: localeId })}`;
    }

    return `${format(startDate, 'd MMM yyyy HH:mm', { locale: localeId })} - ${format(endDate, 'd MMM yyyy HH:mm', { locale: localeId })}`;
};

export default function AcademyClassesIndex({ classes, filters }: Props) {
    const [editing, setEditing] = useState<AcademyClass | null>(null);
    const form = useForm({ ...emptyForm });
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [existingImages, setExistingImages] = useState<ClassImage[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    const openCreate = () => {
        setEditing(null);
        form.setData({ ...emptyForm });
        setExistingImages([]);
        setPreviewImages([]);
        setIsFormOpen(true);
    };

    const openEdit = (item: AcademyClass) => {
        setEditing(item);
        form.setData({
            ...emptyForm,
            title: item.title,
            description: item.description ?? '',
            category: item.category ?? '',
            start_at: toDatetimeLocal(item.start_at),
            end_at: toDatetimeLocal(item.end_at),
            duration_minutes: item.duration_minutes ?? 0,
            location_type: item.location_type ?? 'offline',
            location_detail: item.location_detail ?? '',
            capacity_total: item.capacity_total,
            status: item.status,
            is_active: item.is_active,
            images: [],
        });
        setExistingImages(item.images ?? []);
        setPreviewImages([]);
        setIsFormOpen(true);
    };

    const submit = () => {
        if (editing) {
            form.transform((data) => ({
                ...data,
                _method: 'put',
            }));
            form.post(`/admin/academy/classes/${editing.id}`, {
                forceFormData: true,
                onSuccess: () => {
                    Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Kelas diperbarui.' });
                    setIsFormOpen(false);
                },
                onError: (errors: Record<string, string | string[]>) => {
                    const message =
                        Object.values(errors).flat().join('\n') ||
                        'Periksa data kelas, jadwal, kapasitas, dan gambar.';

                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: message,
                    });
                },
                onFinish: () => {
                    form.transform((data) => data);
                },
            });
        } else {
            form.post('/admin/academy/classes', {
                forceFormData: true,
                onSuccess: () => {
                    Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Kelas dibuat.' });
                    setIsFormOpen(false);
                },
                onError: (errors: Record<string, string | string[]>) => {
                    const message =
                        Object.values(errors).flat().join('\n') ||
                        'Periksa data kelas, jadwal, kapasitas, dan gambar.';

                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: message,
                    });
                },
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
                            <p className="text-xs font-semibold uppercase text-sky-600">Academy</p>
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
                                                {formatSchedule(item.start_at, item.end_at)}
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
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                                        onClick={() => {
                                                            Swal.fire({
                                                                icon: 'warning',
                                                                title: 'Hapus kelas?',
                                                                text: 'Kelas akan dihapus permanen.',
                                                                showCancelButton: true,
                                                                confirmButtonText: 'Hapus',
                                                                cancelButtonText: 'Batal',
                                                            }).then((result) => {
                                                            if (result.isConfirmed) {
                                                                router.delete(`/admin/academy/classes/${item.id}`, {
                                                                    onSuccess: () => {
                                                                        Swal.fire({
                                                                            icon: 'success',
                                                                            title: 'Terhapus',
                                                                            text: 'Kelas dihapus.',
                                                                        });
                                                                    },
                                                                    onError: (errors) => {
                                                                        Swal.fire({
                                                                            icon: 'error',
                                                                            title: 'Gagal',
                                                                            text: errors.class ?? 'Kelas gagal dihapus.',
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
                    <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Kelas' : 'Buat Kelas'}</DialogTitle>
                            <DialogDescription>Lengkapi data kelas sebelum disimpan.</DialogDescription>
                        </DialogHeader>
                        <form
                            className="grid gap-3 md:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                submit();
                            }}
                        >
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-slate-600">Nama kelas</label>
                                <input
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value)}
                                    placeholder="Contoh: Kelas Public Speaking"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <InputError message={form.errors.title} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-600">Kategori kelas</label>
                                <input
                                    value={form.data.category}
                                    onChange={(event) => form.setData('category', event.target.value)}
                                    placeholder="Contoh: Komunikasi"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-slate-600">Deskripsi kelas</label>
                                <textarea
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.target.value)}
                                    placeholder="Tuliskan ringkasan kelas"
                                    rows={3}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-600">Mulai</label>
                                <input
                                    type="datetime-local"
                                    value={form.data.start_at}
                                    onChange={(event) => form.setData('start_at', event.target.value)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-600">Selesai</label>
                                <input
                                    type="datetime-local"
                                    value={form.data.end_at}
                                    onChange={(event) => form.setData('end_at', event.target.value)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-600">Durasi (menit)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.data.duration_minutes}
                                    onChange={(event) => form.setData('duration_minutes', Number(event.target.value))}
                                    placeholder="120"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-600">Tipe lokasi</label>
                                <select
                                    value={form.data.location_type}
                                    onChange={(event) => form.setData('location_type', event.target.value)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="offline">Offline</option>
                                    <option value="online">Online</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-slate-600">Alamat / Link</label>
                                <input
                                    value={form.data.location_detail}
                                    onChange={(event) => form.setData('location_detail', event.target.value)}
                                    placeholder="Alamat lengkap atau link meeting"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-600">Kapasitas maksimum</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.data.capacity_total}
                                    onChange={(event) => form.setData('capacity_total', Number(event.target.value))}
                                    placeholder="50"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-600">Status kelas</label>
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
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-600">Status aktif</label>
                                <select
                                    value={form.data.is_active ? '1' : '0'}
                                    onChange={(event) => form.setData('is_active', event.target.value === '1')}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif</option>
                                </select>
                            </div>
                            <div className="rounded-lg border border-dashed border-slate-200 p-4 md:col-span-2">
                                <div className="text-xs font-semibold uppercase text-slate-500">Gambar Kelas</div>
                                <p className="mt-1 text-xs text-slate-500">Maksimal 5 gambar (JPG/PNG/WEBP).</p>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="mt-3 block w-full text-sm"
                                    onChange={(event) => {
                                        const files = Array.from(event.target.files ?? []);
                                        form.setData('images', files);
                                        setPreviewImages(files.map((file) => URL.createObjectURL(file)));
                                    }}
                                />
                                <InputError message={form.errors.images} />
                                {existingImages.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                                        {existingImages.map((image) => (
                                            <div key={image.id} className="relative overflow-hidden rounded-xl border border-slate-100">
                                                <img
                                                    src={`/storage/${image.image_path}`}
                                                    alt="Kelas"
                                                    className="h-24 w-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs text-rose-600 shadow"
                                                    onClick={() => {
                                                        Swal.fire({
                                                            icon: 'warning',
                                                            title: 'Hapus gambar?',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Hapus',
                                                            cancelButtonText: 'Batal',
                                                        }).then((result) => {
                                                            if (result.isConfirmed && editing) {
                                                                router.delete(
                                                                    `/admin/academy/classes/${editing.id}/images/${image.id}`,
                                                                    {
                                                                        onSuccess: () => {
                                                                            Swal.fire({
                                                                                icon: 'success',
                                                                                title: 'Terhapus',
                                                                                text: 'Gambar dihapus.',
                                                                            });
                                                                        },
                                                                    },
                                                                );
                                                            }
                                                        });
                                                    }}
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {previewImages.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                                        {previewImages.map((preview, index) => (
                                            <div key={preview} className="overflow-hidden rounded-xl border border-slate-100">
                                                <img src={preview} alt={`Preview ${index + 1}`} className="h-24 w-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="gap-2 md:col-span-2">
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
