import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import CkeditorField from '@/components/ckeditor-field';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/privacy-policy' },
    { title: 'Dokumen Legal', href: '/admin/public/privacy-policy' },
];

type Policy = {
    id: number;
    title: string;
    content: string;
    terms_content?: string | null;
    refund_content?: string | null;
    version: string | null;
    effective_at: string | null;
    is_active: boolean;
};

export default function PrivacyPolicyEdit({ policy }: { policy: Policy }) {
    const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'refund'>(
        'privacy',
    );
    const form = useForm({
        title: policy.title ?? 'Kebijakan Privasi Indotix',
        content: policy.content ?? '',
        terms_content: policy.terms_content ?? '',
        refund_content: policy.refund_content ?? '',
        version: policy.version ?? '1.0',
        effective_at: policy.effective_at ?? '',
        is_active: policy.is_active ?? true,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dokumen Legal">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-sans text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Dokumen Legal Pengguna
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Kelola Syarat dan Ketentuan serta Kebijakan Privasi yang
                        ditampilkan kepada pengguna Indotix.
                    </p>
                    <form
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put('/admin/public/privacy-policy', {
                                onSuccess: () =>
                                    Swal.fire({
                                        title: 'Berhasil',
                                        text: 'Dokumen legal pengguna berhasil diperbarui.',
                                        icon: 'success',
                                    }),
                                onError: () =>
                                    Swal.fire({
                                        title: 'Gagal',
                                        text: 'Dokumen legal pengguna gagal diperbarui. Periksa kembali isian yang wajib diisi.',
                                        icon: 'error',
                                    }),
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label required>Judul dokumen</Label>
                            <Input
                                required
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                            />
                            <InputError message={form.errors.title} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Versi dokumen</Label>
                            <Input
                                value={form.data.version}
                                onChange={(event) =>
                                    form.setData('version', event.target.value)
                                }
                            />
                            <InputError message={form.errors.version} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Tanggal mulai berlaku</Label>
                            <Input
                                type="date"
                                value={form.data.effective_at}
                                onChange={(event) =>
                                    form.setData(
                                        'effective_at',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.effective_at} />
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
                            <div
                                className="grid grid-cols-3 gap-1"
                                role="tablist"
                                aria-label="Dokumen legal"
                            >
                                {[
                                    ['privacy', 'Kebijakan Privasi'],
                                    ['terms', 'Syarat dan Ketentuan'],
                                    ['refund', 'Refund Policy'],
                                ].map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTab === value}
                                        onClick={() =>
                                            setActiveTab(
                                                value as
                                                    | 'privacy'
                                                    | 'terms'
                                                    | 'refund',
                                            )
                                        }
                                        className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                                            activeTab === value
                                                ? 'bg-white text-sky-700 shadow-sm'
                                                : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {activeTab === 'privacy' && (
                            <div className="grid gap-2">
                                <Label required>Kebijakan Privasi</Label>
                                <CkeditorField
                                    value={form.data.content}
                                    onChange={(value) =>
                                        form.setData('content', value)
                                    }
                                    minHeightClassName="min-h-[320px]"
                                />
                                <InputError message={form.errors.content} />
                            </div>
                        )}
                        {activeTab === 'terms' && (
                            <div className="grid gap-2">
                                <Label required>Syarat dan Ketentuan</Label>
                                <CkeditorField
                                    value={form.data.terms_content}
                                    onChange={(value) =>
                                        form.setData('terms_content', value)
                                    }
                                    minHeightClassName="min-h-[320px]"
                                />
                                <InputError
                                    message={form.errors.terms_content}
                                />
                            </div>
                        )}
                        {activeTab === 'refund' && (
                            <div className="grid gap-2">
                                <Label required>Refund Policy</Label>
                                <CkeditorField
                                    value={form.data.refund_content}
                                    onChange={(value) =>
                                        form.setData('refund_content', value)
                                    }
                                    minHeightClassName="min-h-[320px]"
                                />
                                <InputError
                                    message={form.errors.refund_content}
                                />
                            </div>
                        )}
                        <div className="flex gap-2">
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(event) =>
                                        form.setData(
                                            'is_active',
                                            event.target.checked,
                                        )
                                    }
                                />
                                Publikasikan dokumen legal ini
                            </label>
                        </div>
                        <Button
                            type="submit"
                            className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                            Simpan dokumen legal
                        </Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
