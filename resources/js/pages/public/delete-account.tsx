import { Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import { PublicSeo } from '@/components/public-seo';

export default function DeleteAccountPage({ status }: { status?: string }) {
    const isSuccess = status === 'success';

    return (
        <PublicLayout showCategories={false} showChips={false}>
            <PublicSeo
                title="Panduan Hapus Akun - Indotix"
                description="Panduan resmi penghapusan akun INDOTIX dan informasi data yang dihapus maupun disimpan."
                canonicalPath="/delete-account"
                keywords={['hapus akun Indotix', 'penghapusan data Indotix']}
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'HowTo',
                    name: 'Cara Menghapus Akun INDOTIX',
                    step: [
                        {
                            '@type': 'HowToStep',
                            text: 'Buka aplikasi INDOTIX.',
                        },
                        { '@type': 'HowToStep', text: 'Masuk ke menu Profil.' },
                        {
                            '@type': 'HowToStep',
                            text: 'Pilih Hapus Akun Permanen.',
                        },
                        {
                            '@type': 'HowToStep',
                            text: 'Masukkan password dan konfirmasi penghapusan.',
                        },
                    ],
                }}
            />

            <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <nav className="text-xs text-slate-500">
                        <Link
                            href="/"
                            className="transition hover:text-sky-600"
                        >
                            Beranda
                        </Link>
                        <span className="mx-2">/</span>
                        <span className="text-slate-700">Hapus Akun</span>
                    </nav>

                    <h1 className="mt-3 text-3xl font-semibold text-slate-900">
                        Hapus Akun INDOTIX
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Informasi resmi tentang cara menghapus akun dan
                        pengelolaan data setelah penghapusan.
                    </p>

                    {isSuccess && (
                        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            Akun kamu berhasil dihapus. Terima kasih telah
                            menggunakan INDOTIX.
                        </div>
                    )}

                    <div className="mt-8 grid gap-6">
                        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Cara Menghapus Akun
                            </h2>
                            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
                                <li>Buka aplikasi INDOTIX.</li>
                                <li>Masuk ke menu Profil.</li>
                                <li>
                                    Pilih <strong>Hapus Akun Permanen</strong>.
                                </li>
                                <li>
                                    Masukkan password dan konfirmasi
                                    penghapusan.
                                </li>
                            </ol>
                            <p className="mt-3 text-xs text-slate-500">
                                Penghapusan akun akan ditolak jika masih ada
                                transaksi aktif.
                            </p>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Data yang Dihapus
                            </h2>
                            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                                <li>Profil pengguna dan informasi kontak.</li>
                                <li>Alamat pengiriman dan data preferensi.</li>
                                <li>Chat, notifikasi, dan token perangkat.</li>
                                <li>Ulasan dan data non-transaksional.</li>
                            </ul>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Data yang Tetap Disimpan
                            </h2>
                            <p className="mt-3 text-sm text-slate-600">
                                Riwayat transaksi dan bukti pembayaran dapat
                                disimpan untuk memenuhi kewajiban hukum, audit,
                                dan keamanan. Retensi mengikuti ketentuan
                                peraturan yang berlaku.
                            </p>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Bantuan
                            </h2>
                            <p className="mt-3 text-sm text-slate-600">
                                Jika kamu tidak dapat mengakses aplikasi atau
                                membutuhkan bantuan penghapusan akun, hubungi
                                kami:
                            </p>
                            <div className="mt-3 text-sm text-slate-600">
                                Email: info@indotix.co.id
                                <br />
                                WhatsApp: 0812 9205 9888
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <Link href="/">
                            <img
                                src="/logo.png"
                                alt="Indotix"
                                className="h-11 w-36 object-contain"
                            />
                        </Link>
                        <p className="mt-3 text-sm text-slate-600">
                            Neo Soho Capital 40th Floor
                            <br />
                            Jl. Tanjung Duren Raya No 1
                            <br />
                            Jakarta Barat, DKI Jakarta 11470
                        </p>
                        <p className="mt-4 text-sm text-slate-600">
                            0812 9205 9888
                        </p>
                        <p className="text-sm text-slate-600">
                            info@indotix.co.id
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                            Layanan
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Wisata</li>
                            <li>Special Program</li>
                            <li>Event</li>
                            <li>Hotel</li>
                            <li>Retail Shop</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                            Perusahaan
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>
                                <Link
                                    href="/about"
                                    className="transition hover:text-sky-600"
                                >
                                    Tentang Kami
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/jelajah"
                                    className="transition hover:text-sky-600"
                                >
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/faq"
                                    className="transition hover:text-sky-600"
                                >
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy-policy"
                                    className="transition hover:text-sky-600"
                                >
                                    Kebijakan Privasi
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <FooterDownloadSocial />
                </div>
                <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Indotix. All rights reserved.
                </div>
            </footer>
        </PublicLayout>
    );
}
