import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import CkeditorField from '@/components/ckeditor-field';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/contacts' },
    { title: 'Kontak', href: '/admin/public/contacts' },
];

type Contact = {
    id: number;
    company_name: string | null;
    address: string | null;
    address_html?: string | null;
    phone: string | null;
    email: string | null;
    download_url: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
    twitter_url: string | null;
    tiktok_url: string | null;
    youtube_url: string | null;
};

export default function ContactEdit({ contact }: { contact: Contact }) {
    const form = useForm({
        company_name: contact.company_name ?? '',
        address: contact.address_html ?? contact.address ?? '',
        phone: contact.phone ?? '',
        email: contact.email ?? '',
        download_url: contact.download_url ?? '',
        instagram_url: contact.instagram_url ?? '',
        facebook_url: contact.facebook_url ?? '',
        twitter_url: contact.twitter_url ?? '',
        tiktok_url: contact.tiktok_url ?? '',
        youtube_url: contact.youtube_url ?? '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kontak Publik">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-sans text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Kontak Publik</h1>
                    <form
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put('/admin/public/contacts', {
                                onSuccess: () =>
                                    Swal.fire({ title: 'Berhasil', text: 'Kontak diperbarui.', icon: 'success' }),
                                onError: () =>
                                    Swal.fire({ title: 'Gagal', text: 'Kontak gagal diperbarui.', icon: 'error' }),
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label>Nama Perusahaan</Label>
                            <Input value={form.data.company_name} onChange={(event) => form.setData('company_name', event.target.value)} />
                            <InputError message={form.errors.company_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Alamat</Label>
                            <CkeditorField
                                value={form.data.address}
                                onChange={(value) => form.setData('address', value)}
                                minHeightClassName="min-h-28"
                            />
                            <InputError message={form.errors.address} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Telepon</Label>
                            <Input value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} />
                            <InputError message={form.errors.phone} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} />
                            <InputError message={form.errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Link Download</Label>
                            <Input value={form.data.download_url} onChange={(event) => form.setData('download_url', event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Instagram</Label>
                            <Input value={form.data.instagram_url} onChange={(event) => form.setData('instagram_url', event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Facebook</Label>
                            <Input value={form.data.facebook_url} onChange={(event) => form.setData('facebook_url', event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Twitter/X</Label>
                            <Input value={form.data.twitter_url} onChange={(event) => form.setData('twitter_url', event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>TikTok</Label>
                            <Input value={form.data.tiktok_url} onChange={(event) => form.setData('tiktok_url', event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>YouTube</Label>
                            <Input value={form.data.youtube_url} onChange={(event) => form.setData('youtube_url', event.target.value)} />
                        </div>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">Simpan</Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
