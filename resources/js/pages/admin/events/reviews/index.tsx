import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Review & Rating', href: '/admin/events/reviews' },
];

export default function EventReviewsIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Review & Rating Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Monitoring Review & Rating</h1>
                    <p className="text-sm text-slate-500">Pantau review mencurigakan dan lakukan take down.</p>
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                        Modul review akan menampilkan daftar review dan aksi take down dengan alasan.
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
