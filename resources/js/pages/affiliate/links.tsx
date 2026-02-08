import { Head, Link as InertiaLink, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AffiliateLayout from '@/layouts/affiliate-layout';
import Swal from 'sweetalert2';

type LinkData = {
    id: number;
    code: string;
    token: string;
    landing_url?: string | null;
    status: string;
    attribution_model: string;
    cookie_days: number;
};

type Destination = {
    encrypted_id: string;
};

export default function AffiliateLinks({
    link,
    destination,
    app_url,
}: {
    link?: LinkData | null;
    destination?: Destination | null;
    app_url: string;
}) {
    const form = useForm({});

    const createLink = () => {
        form.post('/affiliate/links', {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Link afiliasi dibuat.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak bisa membuat link.' }),
        });
    };

    const referralUrl = link && destination
        ? `${app_url.replace(/\/$/, '')}/wisata/${link.code}`
        : '';

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralUrl);
            Swal.fire({ icon: 'success', title: 'Tersalin', text: 'Link afiliasi sudah disalin.' });
        } catch {
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak bisa menyalin link.' });
        }
    };

    return (
        <>
            <Head title="Link Afiliasi" />
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Link Afiliasi</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">Bagikan link untuk dapat komisi</h1>
                    <p className="mt-1 text-sm text-slate-500">Gunakan link ini untuk tracking penjualan wisata afiliasi.</p>
                </div>

                {!link && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8">
                        <p className="text-sm text-slate-600">
                            Kamu belum memiliki link afiliasi. Klik tombol di bawah untuk membuatnya.
                        </p>
                        <button
                            type="button"
                            onClick={createLink}
                            className="mt-4 h-11 rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white hover:bg-sky-700"
                        >
                            Buat Link Afiliasi
                        </button>
                    </div>
                )}

                {link && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Referral Link</p>
                                <p className="mt-2 break-all text-sm font-semibold text-slate-900">{referralUrl}</p>
                                <p className="mt-2 text-xs text-slate-500">
                                    Model: {link.attribution_model.replace('_', ' ')} · Cookie {link.cookie_days} hari
                                </p>
                                <p className="mt-1 text-xs text-slate-500">Kode afiliasi: {link.code}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={copyLink}
                                    className="h-11 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700"
                                >
                                    Salin Link
                                </button>
                                {destination && (
                                    <InertiaLink
                                        href={`/wisata/${destination.encrypted_id}`}
                                        className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Buka Wisata
                                    </InertiaLink>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

AffiliateLinks.layout = (page: ReactNode) => <AffiliateLayout active="links">{page}</AffiliateLayout>;
