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

type RoleOption = {
    value: string;
    label: string;
};

type Props = {
    templates: Template[];
    triggers: Trigger[];
    eventOptions: string[];
    roleOptions: RoleOption[];
};

export default function NotificationControl({
    templates,
    triggers,
    eventOptions,
    roleOptions,
}: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({
        key: '',
        channel: 'email',
        subject: '',
        body: '',
        is_active: true,
    });
    const [broadcastForm, setBroadcastForm] = useState({
        title: '',
        message: '',
        type: 'info',
        target: 'roles',
        roles: ['user'],
        userIds: '',
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
        setForm({
            key: '',
            channel: 'email',
            subject: '',
            body: '',
            is_active: true,
        });
    };

    const resetBroadcast = () => {
        setBroadcastForm({
            title: '',
            message: '',
            type: 'info',
            target: 'roles',
            roles: ['user'],
            userIds: '',
        });
    };

    const submitTemplate = (event: React.FormEvent) => {
        event.preventDefault();
        const payload = { ...form, is_active: form.is_active ? 1 : 0 };

        if (editingId) {
            router.put(
                `/admin/system/notifications/templates/${editingId}`,
                payload,
                {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Berhasil',
                            text: 'Template diperbarui.',
                            icon: 'success',
                        });
                        resetForm();
                    },
                    onError: () =>
                        Swal.fire({
                            title: 'Gagal',
                            text: 'Template gagal diperbarui.',
                            icon: 'error',
                        }),
                },
            );
            return;
        }

        router.post('/admin/system/notifications/templates', payload, {
            onSuccess: () => {
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Template dibuat.',
                    icon: 'success',
                });
                resetForm();
            },
            onError: () =>
                Swal.fire({
                    title: 'Gagal',
                    text: 'Template gagal dibuat.',
                    icon: 'error',
                }),
        });
    };

    const submitBroadcast = (event: React.FormEvent) => {
        event.preventDefault();
        const userIds = broadcastForm.userIds
            .split(',')
            .map((value) => parseInt(value.trim(), 10))
            .filter((value) => Number.isFinite(value));

        const payload: Record<string, any> = {
            title: broadcastForm.title,
            message: broadcastForm.message,
            type: broadcastForm.type,
            target: broadcastForm.target,
        };

        if (broadcastForm.target === 'roles') {
            payload.roles = broadcastForm.roles;
        }

        if (broadcastForm.target === 'users') {
            payload.user_ids = userIds;
        }

        router.post('/admin/system/notifications/broadcast', payload, {
            onSuccess: () => {
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Notifikasi berhasil dikirim.',
                    icon: 'success',
                });
                resetBroadcast();
            },
            onError: () =>
                Swal.fire({
                    title: 'Gagal',
                    text: 'Notifikasi gagal dikirim.',
                    icon: 'error',
                }),
        });
    };

    const toggleRole = (role: string) => {
        setBroadcastForm((prev) => {
            const exists = prev.roles.includes(role);
            return {
                ...prev,
                roles: exists
                    ? prev.roles.filter((item) => item !== role)
                    : [...prev.roles, role],
            };
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
            onSuccess: () =>
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Template dihapus.',
                    icon: 'success',
                }),
            onError: () =>
                Swal.fire({
                    title: 'Gagal',
                    text: 'Template gagal dihapus.',
                    icon: 'error',
                }),
        });
    };

    const updateTrigger = (triggerId: number, payload: Record<string, any>) => {
        router.put(
            `/admin/system/notifications/triggers/${triggerId}`,
            payload,
            {
                onSuccess: () =>
                    Swal.fire({
                        title: 'Berhasil',
                        text: 'Trigger diperbarui.',
                        icon: 'success',
                    }),
                onError: () =>
                    Swal.fire({
                        title: 'Gagal',
                        text: 'Trigger gagal diperbarui.',
                        icon: 'error',
                    }),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification Control" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-[0.3em] text-sky-600 uppercase">
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
                    <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-[0.3em] text-sky-600 uppercase">
                            Push Notification
                        </p>
                        <h2 className="text-xl font-semibold text-slate-900">
                            Kirim notifikasi ke aplikasi
                        </h2>
                        <p className="text-sm text-slate-500">
                            Gunakan untuk informasi penting, promo, atau update
                            aplikasi.
                        </p>
                    </div>
                    <form
                        onSubmit={submitBroadcast}
                        className="mt-6 grid gap-4 md:grid-cols-3"
                    >
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                Judul
                            </label>
                            <input
                                value={broadcastForm.title}
                                onChange={(event) =>
                                    setBroadcastForm((prev) => ({
                                        ...prev,
                                        title: event.target.value,
                                    }))
                                }
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder="Promo Spesial"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                Tipe
                            </label>
                            <select
                                value={broadcastForm.type}
                                onChange={(event) =>
                                    setBroadcastForm((prev) => ({
                                        ...prev,
                                        type: event.target.value,
                                    }))
                                }
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="info">Informasi</option>
                                <option value="promo">Promo</option>
                                <option value="update">Update</option>
                                <option value="other">Lainnya</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                Target
                            </label>
                            <select
                                value={broadcastForm.target}
                                onChange={(event) =>
                                    setBroadcastForm((prev) => ({
                                        ...prev,
                                        target: event.target.value,
                                    }))
                                }
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="roles">Berdasarkan role</option>
                                <option value="users">User tertentu</option>
                                <option value="all">Semua user</option>
                            </select>
                        </div>
                        <div className="grid gap-2 md:col-span-3">
                            <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                Pesan
                            </label>
                            <textarea
                                value={broadcastForm.message}
                                onChange={(event) =>
                                    setBroadcastForm((prev) => ({
                                        ...prev,
                                        message: event.target.value,
                                    }))
                                }
                                className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                                placeholder="Tuliskan pesan notifikasi..."
                                required
                            />
                        </div>
                        {broadcastForm.target === 'roles' && (
                            <div className="grid gap-3 md:col-span-3">
                                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                    Pilih Role
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {roleOptions.map((role) => (
                                        <label
                                            key={role.value}
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={broadcastForm.roles.includes(
                                                    role.value,
                                                )}
                                                onChange={() =>
                                                    toggleRole(role.value)
                                                }
                                            />
                                            {role.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        {broadcastForm.target === 'users' && (
                            <div className="grid gap-2 md:col-span-3">
                                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                    User ID (pisahkan dengan koma)
                                </label>
                                <input
                                    value={broadcastForm.userIds}
                                    onChange={(event) =>
                                        setBroadcastForm((prev) => ({
                                            ...prev,
                                            userIds: event.target.value,
                                        }))
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                    placeholder="1, 12, 25"
                                />
                            </div>
                        )}
                        <div className="flex items-end gap-3 md:col-span-3">
                            <Button
                                type="submit"
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                Kirim notifikasi
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetBroadcast}
                            >
                                Reset
                            </Button>
                            <p className="text-xs text-slate-500">
                                Notifikasi dikirim ke user yang memiliki token
                                perangkat aktif.
                            </p>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form
                        onSubmit={submitTemplate}
                        className="grid gap-4 md:grid-cols-3"
                    >
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                Key
                            </label>
                            <input
                                value={form.key}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        key: event.target.value,
                                    }))
                                }
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder="booking_created"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                Subject
                            </label>
                            <input
                                value={form.subject}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        subject: event.target.value,
                                    }))
                                }
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder="Subjek email"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                Channel
                            </label>
                            <select
                                value={form.channel}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        channel: event.target.value,
                                    }))
                                }
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="email">Email</option>
                            </select>
                        </div>
                        <div className="grid gap-2 md:col-span-3">
                            <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                Body
                            </label>
                            <textarea
                                value={form.body}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        body: event.target.value,
                                    }))
                                }
                                className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                                placeholder="Isi template email..."
                            />
                        </div>
                        <div className="flex items-end gap-3 md:col-span-2">
                            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            is_active: event.target.checked,
                                        }))
                                    }
                                />
                                Aktif
                            </label>
                            <Button
                                type="submit"
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                {editingId
                                    ? 'Simpan perubahan'
                                    : 'Tambah template'}
                            </Button>
                            {editingId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                >
                                    Batal edit
                                </Button>
                            )}
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs tracking-wider text-slate-400 uppercase">
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
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-slate-500"
                                        >
                                            Belum ada template.
                                        </td>
                                    </tr>
                                )}
                                {templates.map((template) => (
                                    <tr key={template.id}>
                                        <td className="py-4 pr-4 font-semibold text-slate-900">
                                            {template.key}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {template.channel}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {template.subject ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {template.is_active
                                                ? 'Aktif'
                                                : 'Nonaktif'}
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        startEdit(template)
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() =>
                                                        handleDelete(
                                                            template.id,
                                                        )
                                                    }
                                                >
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
                    <h3 className="text-lg font-semibold text-slate-900">
                        Trigger Notifikasi
                    </h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {eventOptions.map((eventKey) => {
                            const trigger = triggers.find(
                                (item) => item.event_key === eventKey,
                            );
                            return (
                                <div
                                    key={eventKey}
                                    className="rounded-2xl border border-slate-100 bg-white p-4"
                                >
                                    <div className="text-sm font-semibold text-slate-900">
                                        {eventKey}
                                    </div>
                                    <div className="mt-3 grid gap-2">
                                        <select
                                            value={trigger?.template_id ?? ''}
                                            onChange={(event) =>
                                                updateTrigger(trigger!.id, {
                                                    template_id:
                                                        event.target.value ||
                                                        null,
                                                })
                                            }
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                        >
                                            <option value="">
                                                Tidak ada template
                                            </option>
                                            {templates.map((template) => (
                                                <option
                                                    key={template.id}
                                                    value={template.id}
                                                >
                                                    {template.key}
                                                </option>
                                            ))}
                                        </select>
                                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    trigger?.is_active ?? false
                                                }
                                                onChange={(event) =>
                                                    updateTrigger(trigger!.id, {
                                                        is_active: event.target
                                                            .checked
                                                            ? 1
                                                            : 0,
                                                    })
                                                }
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
