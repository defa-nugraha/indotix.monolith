import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/partners' },
    { title: 'Partner Kami', href: '/admin/public/partners' },
    { title: 'Edit', href: '#' },
];

type Partner = {
    id: number;
    name: string | null;
    image_path: string | null;
    link_url: string | null;
    sort_order: number;
    is_active: boolean;
};

const storageUrl = (path?: string | null) => {
    const cleanPath = path?.trim();

    return cleanPath ? `/storage/${cleanPath}` : null;
};

export default function PartnerEdit({ partner }: { partner: Partner }) {
    const form = useForm({
        name: partner.name ?? '',
        link_url: partner.link_url ?? '',
        sort_order: partner.sort_order ?? 0,
        is_active: partner.is_active ?? true,
        image: null as File | null,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Partner">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Edit Partner</h1>
                    <form
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(`/admin/public/partners/${partner.id}`, {
                                forceFormData: true,
                                onSuccess: () =>
                                    Swal.fire({ title: 'Berhasil', text: 'Partner diperbarui.', icon: 'success' }),
                                onError: () =>
                                    Swal.fire({ title: 'Gagal', text: 'Partner gagal diperbarui.', icon: 'error' }),
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label>Nama</Label>
                            <Input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Link</Label>
                            <Input value={form.data.link_url} onChange={(event) => form.setData('link_url', event.target.value)} />
                            <InputError message={form.errors.link_url} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Urutan</Label>
                            <Input type="number" value={form.data.sort_order} onChange={(event) => form.setData('sort_order', Number(event.target.value))} />
                            <InputError message={form.errors.sort_order} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Logo saat ini</Label>
                            {storageUrl(partner.image_path) ? (
                                <img
                                    src={storageUrl(partner.image_path) ?? ''}
                                    alt={partner.name ?? 'Partner'}
                                    className="h-16 w-24 rounded-md bg-slate-50 object-contain"
                                />
                            ) : (
                                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-slate-50 text-xs font-medium text-slate-400">
                                    No logo
                                </div>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label>Ganti logo (opsional)</Label>
                            <Input type="file" accept="image/*" onChange={(event) => form.setData('image', event.target.files?.[0] ?? null)} />
                            <p className="text-xs text-slate-500">Gunakan logo JPG, PNG, atau WebP yang jelas, maksimal 2 MB.</p>
                            <InputError message={form.errors.image} />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} />
                            Aktif
                        </label>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">Simpan Perubahan</Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
