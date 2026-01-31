import { Head, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sistem, Audit & Kontrol', href: '/admin/system/notifications' },
    { title: 'Notification Control', href: '/admin/system/notifications' },
];

type Template = {
    id: number;
    key: string;
    channel: string;
    subject?: string | null;
    body?: string | null;
    is_active: boolean;
};

type Trigger = {
    id: number;
    event_key: string;
    template_id?: number | null;
    template_key?: string | null;
    is_active: boolean;
};

type Props = {
    templates: Template[];
    triggers: Trigger[];
    eventOptions: string[];
};

export default function NotificationControl({ templates, triggers, eventOptions }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({
        key: '',
        channel: 'email',
        subject: '',
        body: '',
        is_active: true,
    });

    const startEdit = (template: Template) => {
        setEditingId(template.id);
        setForm({
            key: template.key,
            channel: template.channel,
            subject: template.subject ?? '',
            body: template.body ?? '',
            is_active: template.is_active,
        });
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({ key: '', channel: 'email', subject: '', body: '', is_active: true });
    };

    const submitTemplate = (event: React.FormEvent) => {
        event.preventDefault();
        const payload = { ...form, is_active: form.is_active ? 1 : 0 };

        if (editingId) {
            router.put(`/admin/system/notifications/templates/${editingId}`, payload, {
                onSuccess: () => {
                    Swal.fire({ title: 'Berhasil', text: 'Template diperbarui.', icon: 'success' });
                    resetForm();
                },
                onError: () => Swal.fire({ title: 'Gagal', text: 'Template gagal diperbarui.', icon: 'error' }),
            });
            return;
        }

        router.post('/admin/system/notifications/templates', payload, {
            onSuccess: () => {
                Swal.fire({ title: 'Berhasil', text: 'Template dibuat.', icon: 'success' });
                resetForm();
            },
            onError: () => Swal.fire({ title: 'Gagal', text: 'Template gagal dibuat.', icon: 'error' }),
        });
    };

    const handleDelete = async (templateId: number) => {
        const result = await Swal.fire({
            title: 'Hapus template?',
            text: 'Template akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;

        router.delete(`/admin/system/notifications/templates/${templateId}`, {
            onSuccess: () => Swal.fire({ title: 'Berhasil', text: 'Template dihapus.', icon: 'success' }),
            onError: () => Swal.fire({ title: 'Gagal', text: 'Template gagal dihapus.', icon: 'error' }),
        });
    };

    const updateTrigger = (triggerId: number, payload: Record<string, any>) => {
        router.put(`/admin/system/notifications/triggers/${triggerId}`, payload, {
            onSuccess: () => Swal.fire({ title: 'Berhasil', text: 'Trigger diperbarui.', icon: 'success' }),
            onError: () => Swal.fire({ title: 'Gagal', text: 'Trigger gagal diperbarui.', icon: 'error' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification Control" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                            Notification Control
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Template email & trigger notifikasi
                        </h1>
                        <p className="text-sm text-slate-500">
                            Atur template dan event yang memicu notifikasi.
                        </p>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={submitTemplate} className="grid gap-4 md:grid-cols-3">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Key</label>
                            <input
                                value={form.key}
                                onChange={(event) => setForm((prev) => ({ ...prev, key: event.target.value }))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder="booking_created"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Subject</label>
                            <input
                                value={form.subject}
                                onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder="Subjek email"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Channel</label>
                            <select
                                value={form.channel}
                                onChange={(event) => setForm((prev) => ({ ...prev, channel: event.target.value }))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="email">Email</option>
                            </select>
                        </div>
                        <div className="grid gap-2 md:col-span-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Body</label>
                            <textarea
                                value={form.body}
                                onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                                className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                                placeholder="Isi template email..."
                            />
                        </div>
                        <div className="flex items-end gap-3 md:col-span-2">
                            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                                />
                                Aktif
                            </label>
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                {editingId ? 'Simpan perubahan' : 'Tambah template'}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Batal edit
                                </Button>
                            )}
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">Key</th>
                                    <th className="py-3 pr-4">Channel</th>
                                    <th className="py-3 pr-4">Subject</th>
                                    <th className="py-3 pr-4">Status</th>
                                    <th className="py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {templates.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500">
                                            Belum ada template.
                                        </td>
                                    </tr>
                                )}
                                {templates.map((template) => (
                                    <tr key={template.id}>
                                        <td className="py-4 pr-4 font-semibold text-slate-900">{template.key}</td>
                                        <td className="py-4 pr-4 text-slate-600">{template.channel}</td>
                                        <td className="py-4 pr-4 text-slate-600">{template.subject ?? '-'}</td>
                                        <td className="py-4 pr-4 text-slate-600">{template.is_active ? 'Aktif' : 'Nonaktif'}</td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => startEdit(template)}>
                                                    Edit
                                                </Button>
                                                <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleDelete(template.id)}>
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Trigger Notifikasi</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {eventOptions.map((eventKey) => {
                            const trigger = triggers.find((item) => item.event_key === eventKey);
                            return (
                                <div key={eventKey} className="rounded-2xl border border-slate-100 bg-white p-4">
                                    <div className="text-sm font-semibold text-slate-900">{eventKey}</div>
                                    <div className="mt-3 grid gap-2">
                                        <select
                                            value={trigger?.template_id ?? ''}
                                            onChange={(event) =>
                                                updateTrigger(trigger!.id, { template_id: event.target.value || null })
                                            }
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                        >
                                            <option value="">Tidak ada template</option>
                                            {templates.map((template) => (
                                                <option key={template.id} value={template.id}>
                                                    {template.key}
                                                </option>
                                            ))}
                                        </select>
                                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                                            <input
                                                type="checkbox"
                                                checked={trigger?.is_active ?? false}
                                                onChange={(event) => updateTrigger(trigger!.id, { is_active: event.target.checked ? 1 : 0 })}
                                            />
                                            Aktif
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
