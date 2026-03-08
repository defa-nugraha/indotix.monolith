import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import CkeditorField from '@/components/ckeditor-field';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/faqs' },
    { title: 'FAQ', href: '/admin/public/faqs' },
    { title: 'Edit', href: '#' },
];

type Faq = {
    id: number;
    question: string;
    answer: string;
    category: string | null;
    sort_order: number;
    is_active: boolean;
};

export default function FaqEdit({ faq }: { faq: Faq }) {
    const form = useForm({
        question: faq.question,
        answer: faq.answer,
        category: faq.category ?? '',
        sort_order: faq.sort_order ?? 0,
        is_active: faq.is_active ?? true,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit FAQ">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Edit FAQ</h1>
                    <form
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(`/admin/public/faqs/${faq.id}`, {
                                onSuccess: () =>
                                    Swal.fire({
                                        title: 'Berhasil',
                                        text: 'FAQ diperbarui.',
                                        icon: 'success',
                                    }),
                                onError: () =>
                                    Swal.fire({
                                        title: 'Gagal',
                                        text: 'FAQ gagal diperbarui.',
                                        icon: 'error',
                                    }),
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label>Pertanyaan</Label>
                            <Input value={form.data.question} onChange={(event) => form.setData('question', event.target.value)} />
                            <InputError message={form.errors.question} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Kategori (opsional)</Label>
                            <Input value={form.data.category} onChange={(event) => form.setData('category', event.target.value)} />
                            <InputError message={form.errors.category} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Jawaban</Label>
                            <CkeditorField
                                value={form.data.answer}
                                onChange={(value) => form.setData('answer', value)}
                                minHeightClassName="min-h-[180px]"
                            />
                            <InputError message={form.errors.answer} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Urutan</Label>
                            <Input
                                type="number"
                                value={form.data.sort_order}
                                onChange={(event) => form.setData('sort_order', Number(event.target.value))}
                            />
                            <InputError message={form.errors.sort_order} />
                        </div>
                        <div className="flex gap-2">
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(event) => form.setData('is_active', event.target.checked)}
                                />
                                Aktif
                            </label>
                        </div>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Simpan Perubahan
                        </Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
