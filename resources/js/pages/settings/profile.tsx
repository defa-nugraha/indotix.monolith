import { Transition } from '@headlessui/react';
import { Form, Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import { UserCircle, Mail, Phone } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_menu, affiliate_status } = usePage().props as {
        auth?: { user?: any };
        unread_notifications?: number;
        souvenir_cart_count?: number;
        affiliate_menu?: boolean;
        affiliate_status?: string | null;
    };
    const [passwordOpen, setPasswordOpen] = useState(false);
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    return (
        <PublicLayout showCategories={false} showChips={false}>
            <Head title="Profil Saya">
                <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700" rel="stylesheet" />
            </Head>

                        <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h1 className="text-2xl font-semibold text-slate-900">Profil Saya</h1>
                            <p className="mt-2 text-sm text-slate-500">Kelola informasi pribadi agar pemesanan kamu makin lancar.</p>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Informasi Pribadi</h2>
                            <p className="mt-2 text-sm text-slate-500">Update nama dan email yang akan digunakan untuk konfirmasi.</p>

                            <Form {...ProfileController.update.form()} options={{ preserveScroll: true }} className="mt-6 grid gap-5">
                                {({ processing, recentlySuccessful, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                                <UserCircle className="h-4 w-4 text-slate-400" />
                                                <input
                                                    name="name"
                                                    required
                                                    defaultValue={auth?.user?.name ?? ''}
                                                    className="h-10 w-full bg-transparent text-sm outline-none"
                                                    placeholder="Nama lengkap"
                                                    autoComplete="name"
                                                />
                                            </div>
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-slate-700">Email</label>
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                <input
                                                    name="email"
                                                    type="email"
                                                    required
                                                    defaultValue={auth?.user?.email ?? ''}
                                                    className="h-10 w-full bg-transparent text-sm outline-none"
                                                    placeholder="Email aktif"
                                                    autoComplete="username"
                                                />
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        {mustVerifyEmail && auth?.user?.email_verified_at === null && (
                                            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                                Email kamu belum terverifikasi.{' '}
                                                <Link
                                                    href="/email/verification-notification"
                                                    method="post"
                                                    as="button"
                                                    className="font-semibold underline underline-offset-4"
                                                >
                                                    Klik untuk kirim ulang verifikasi
                                                </Link>
                                                {status === 'verification-link-sent' && (
                                                    <div className="mt-2 text-sm font-semibold text-emerald-600">
                                                        Tautan verifikasi baru sudah dikirim ke email kamu.
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                            </button>
                                            <Transition
                                                show={recentlySuccessful}
                                                enter="transition ease-in-out"
                                                enterFrom="opacity-0"
                                                leave="transition ease-in-out"
                                                leaveTo="opacity-0"
                                            >
                                                <span className="text-sm text-emerald-600">Perubahan tersimpan.</span>
                                            </Transition>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Akun & Keamanan</h2>
                            <p className="mt-2 text-sm text-slate-500">Kelola kata sandi dan sesi akun kamu.</p>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPasswordOpen(true)}
                                    className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                                >
                                    Ubah Password
                                </button>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="rounded-lg border border-rose-200 px-5 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300"
                                >
                                    Logout
                                </Link>
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                                    <UserCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">{auth?.user?.name ?? 'User'}</div>
                                    <div className="text-xs text-slate-500">{auth?.user?.email}</div>
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-slate-500">Terakhir diperbarui otomatis setelah kamu menyimpan perubahan.</div>
                        </div>

                        {affiliate_menu ? (
                            <div className="rounded-2xl bg-white p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-900">Afiliasi Wisata</h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    Status akun: <span className="font-semibold capitalize">{affiliate_status ?? 'pending'}</span>
                                </p>
                                <Link
                                    href="/affiliate"
                                    className="mt-4 inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                                >
                                    Buka Dashboard Afiliasi
                                </Link>
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-white p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-900">Program Afiliasi</h3>
                                <p className="mt-2 text-sm text-slate-600">Daftarkan diri sebagai afiliator dan dapatkan komisi.</p>
                                <Link
                                    href="/affiliate/register"
                                    className="mt-4 inline-flex items-center justify-center rounded-lg border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-50"
                                >
                                    Daftar Afiliasi
                                </Link>
                            </div>
                        )}

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900">Kontak Bantuan</h3>
                            <p className="mt-2 text-sm text-slate-600">Butuh bantuan cepat? Hubungi tim INDOTIX.</p>
                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-sky-500" />
                                    0812 9205 9888
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-sky-500" />
                                    info@indotix.co.id
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            {passwordOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Ubah Password</h3>
                                <p className="mt-1 text-sm text-slate-500">Pastikan password baru aman dan mudah diingat.</p>
                            </div>
                            <button
                                type="button"
                                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-slate-200"
                                onClick={() => {
                                    setPasswordOpen(false);
                                    passwordForm.reset();
                                }}
                            >
                                Tutup
                            </button>
                        </div>

                        <form
                            className="mt-5 grid gap-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                passwordForm.put('/settings/password', {
                                    onSuccess: () => {
                                        passwordForm.reset();
                                        setPasswordOpen(false);
                                    },
                                });
                            }}
                        >
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-slate-700">Password Saat Ini</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(event) => passwordForm.setData('current_password', event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                                    placeholder="Masukkan password lama"
                                />
                                <InputError message={passwordForm.errors.current_password} />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-slate-700">Password Baru</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(event) => passwordForm.setData('password', event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                                    placeholder="Minimal 8 karakter"
                                />
                                <InputError message={passwordForm.errors.password} />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-slate-700">Konfirmasi Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(event) => passwordForm.setData('password_confirmation', event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                                    placeholder="Ulangi password baru"
                                />
                                <InputError message={passwordForm.errors.password_confirmation} />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                                    onClick={() => {
                                        setPasswordOpen(false);
                                        passwordForm.reset();
                                    }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {passwordForm.processing ? 'Menyimpan...' : 'Simpan Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </main>

            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <Link href="/"><img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" /></Link>
                        <p className="mt-3 text-sm text-slate-600">
                            Neo Soho Capital 40th Floor<br />
                            Jl. Tanjung Duren Raya No 1<br />
                            Jakarta Barat, DKI Jakarta 11470
                        </p>
                        <p className="mt-4 text-sm text-slate-600">0812 9205 9888</p>
                        <p className="text-sm text-slate-600">info@indotix.co.id</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Layanan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Wisata</li>
                            <li>Special Program</li>
                            <li>Event</li>
                            <li>Hotel</li>
                            <li>Souvenir</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Perusahaan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Tentang Kami</li>
                            <li>Karir</li>
                            <li>Blog</li>
                            <li>Kebijakan Privasi</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Download Indotix</h4>
                        <div className="mt-3 h-12 w-40 rounded-lg bg-slate-900" />
                        <h4 className="mt-6 text-sm font-semibold text-slate-900">Ikuti Kami</h4>
                        <div className="mt-3 flex gap-2">
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                        </div>
                    </div>
                </div>
                <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Indotix. All rights reserved.
                </div>
            </footer>
        </PublicLayout>
    );
}
