import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Moderasi Konten', href: '/admin/special-programs/content' },
];

export default function EventContentIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Moderasi Konten Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Moderasi Konten Special Program</h1>
                    <p className="text-sm text-slate-500">Review foto/deskripsi program dan hide konten bermasalah.</p>
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                        Modul moderasi akan menampilkan daftar konten yang perlu direview.
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
