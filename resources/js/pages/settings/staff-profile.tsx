import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Mail, Phone, ShieldCheck, UserCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type PageProps = {
    auth?: {
        user?: {
            name?: string | null;
            email?: string | null;
            phone?: string | null;
            gender?: string | null;
            role?: string | null;
        };
    };
    status?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Kelola Profil', href: '/settings/profile' },
];

const roleLabel = (role?: string | null) => {
    if (role === 'admin') return 'Admin Utama';
    if (role === 'admin_academy') return 'Admin Academy';
    if (role === 'admin_retail') return 'Admin Retail Shop';
    if (role === 'admin_special_program') return 'Admin Special Program';
    if (role === 'mitra') return 'Mitra';
    return 'Akun Operasional';
};

export default function StaffProfile() {
    const { auth } = usePage().props as PageProps;
    const user = auth?.user;

    const profileForm = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        gender: user?.gender ?? '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitProfile = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        profileForm.patch('/settings/profile', {
            preserveScroll: true,
        });
    };

    const submitPassword = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        passwordForm.put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Profil" />

            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 md:px-8">
                <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase text-sky-600">Profil Akun</p>
                    <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-950">Kelola profil operasional</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-600">
                                Perbarui nama, kontak, dan password akun yang digunakan untuk mengakses panel INDOTIX.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                            <ShieldCheck className="h-4 w-4" />
                            {roleLabel(user?.role)}
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <form onSubmit={submitProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-950">Informasi Profil</h2>
                        <p className="mt-2 text-sm text-slate-600">Gunakan data yang aktif agar koordinasi dan notifikasi sistem tetap mudah dilacak.</p>

                        <div className="mt-6 grid gap-5">
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Nama Lengkap <span className="text-red-600">*</span>
                                </label>
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                    <UserCircle className="h-4 w-4 text-slate-400" />
                                    <input
                                        value={profileForm.data.name}
                                        onChange={(event) => profileForm.setData('name', event.target.value)}
                                        className="h-10 w-full bg-transparent text-sm outline-none"
                                        placeholder="Nama lengkap"
                                        autoComplete="name"
                                        required
                                    />
                                </div>
                                <InputError message={profileForm.errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Email <span className="text-red-600">*</span>
                                </label>
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <input
                                        type="email"
                                        value={profileForm.data.email}
                                        onChange={(event) => profileForm.setData('email', event.target.value)}
                                        className="h-10 w-full bg-transparent text-sm outline-none"
                                        placeholder="Email aktif"
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                                <InputError message={profileForm.errors.email} />
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Nomor HP <span className="text-red-600">*</span>
                                    </label>
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <input
                                            value={profileForm.data.phone}
                                            onChange={(event) => profileForm.setData('phone', event.target.value)}
                                            className="h-10 w-full bg-transparent text-sm outline-none"
                                            placeholder="0812xxxxxxx"
                                            required
                                        />
                                    </div>
                                    <InputError message={profileForm.errors.phone} />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-semibold text-slate-700">Jenis Kelamin</label>
                                    <select
                                        value={profileForm.data.gender}
                                        onChange={(event) => profileForm.setData('gender', event.target.value)}
                                        className="h-[58px] rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                                    >
                                        <option value="">Tidak diisi</option>
                                        <option value="male">Laki-laki</option>
                                        <option value="female">Perempuan</option>
                                        <option value="other">Lainnya</option>
                                    </select>
                                    <InputError message={profileForm.errors.gender} />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-70"
                                >
                                    {profileForm.processing ? 'Menyimpan...' : 'Simpan Profil'}
                                </button>
                                <Transition show={profileForm.recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0">
                                    <span className="text-sm font-semibold text-emerald-600">Profil tersimpan.</span>
                                </Transition>
                            </div>
                        </div>
                    </form>

                    <aside className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                                    <UserCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-950">{user?.name ?? 'Pengguna'}</div>
                                    <div className="text-xs text-slate-500">{user?.email}</div>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-slate-500">Perubahan profil berlaku untuk akun login dan identitas yang tampil di panel.</p>
                        </div>
                    </aside>
                </div>

                <form onSubmit={submitPassword} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-950">Keamanan Akun</h2>
                    <p className="mt-2 text-sm text-slate-600">Ubah password secara berkala untuk menjaga akses panel tetap aman.</p>

                    <div className="mt-6 grid gap-5 md:grid-cols-3">
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">
                                Password Saat Ini <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(event) => passwordForm.setData('current_password', event.target.value)}
                                className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                                placeholder="Password lama"
                                autoComplete="current-password"
                                required
                            />
                            <InputError message={passwordForm.errors.current_password} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">
                                Password Baru <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(event) => passwordForm.setData('password', event.target.value)}
                                className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                                placeholder="Minimal 8 karakter"
                                autoComplete="new-password"
                                required
                            />
                            <InputError message={passwordForm.errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">
                                Konfirmasi Password <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(event) => passwordForm.setData('password_confirmation', event.target.value)}
                                className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                                placeholder="Ulangi password baru"
                                autoComplete="new-password"
                                required
                            />
                            <InputError message={passwordForm.errors.password_confirmation} />
                        </div>
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={passwordForm.processing}
                            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-70"
                        >
                            {passwordForm.processing ? 'Menyimpan...' : 'Simpan Password'}
                        </button>
                        <Transition show={passwordForm.recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0">
                            <span className="text-sm font-semibold text-emerald-600">Password berhasil diperbarui.</span>
                        </Transition>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
