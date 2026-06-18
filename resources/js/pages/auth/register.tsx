import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    const [mode, setMode] = useState<'user' | 'mitra'>('user');
    const isMitra = mode === 'mitra';

    return (
        <div className="relative min-h-svh overflow-hidden bg-[#f6fbff] font-['Plus_Jakarta_Sans'] text-slate-900">
            <Head title="Daftar">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="pointer-events-none absolute -left-24 top-[-10%] h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="pointer-events-none absolute right-[-8%] top-[15%] h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-[-20%] left-[25%] h-80 w-80 rounded-full bg-amber-300/20 blur-[140px]" />

            <div className="relative mx-auto flex min-h-svh max-w-6xl flex-col items-center justify-center gap-10 px-6 py-14 lg:flex-row lg:items-stretch">
                <div className="flex w-full max-w-xl flex-col justify-center gap-8 lg:pr-10">
                    <div className="flex items-center gap-4">
                        <img
                            src="/logo.png"
                            alt="Indotix"
                            className="h-12 w-auto"
                        />
                        <div>
                            <p className="text-xs font-semibold uppercase text-sky-700">
                                Indotix
                            </p>
                            <p className="text-sm text-slate-500">
                                Tiket Digital Indonesia
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <p className="text-sm font-semibold text-sky-600">
                            Mulai Sekarang
                        </p>
                        <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
                            Buat akun baru untuk akses tiket digital dan
                            kolaborasi event.
                        </h1>
                        <p className="text-base text-slate-600">
                            Pilih jenis pendaftaran untuk pengguna atau mitra,
                            lalu lengkapi informasi dasar agar tim kami dapat
                            memverifikasi akses Anda.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {[
                            {
                                title: 'User',
                                description:
                                    'Beli tiket, simpan riwayat, dan akses event favorit.',
                            },
                            {
                                title: 'Mitra',
                                description:
                                    'Kelola event, tiket, dan laporan penjualan dengan mudah.',
                            },
                            {
                                title: 'Verifikasi Cepat',
                                description:
                                    'Proses validasi akun mitra dilakukan maksimal 1x24 jam.',
                            },
                            {
                                title: 'Support Lokal',
                                description:
                                    'Tim support Indotix siap membantu Anda kapan pun.',
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="rounded-2xl border border-sky-100/80 bg-white/80 p-4 text-sm text-slate-600 shadow-sm backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-700"
                            >
                                <p className="text-sm font-semibold text-slate-900">
                                    {item.title}
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex w-full max-w-md items-center justify-center">
                    <div className="w-full rounded-3xl border border-sky-100/80 bg-white/90 p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="space-y-2 text-left">
                            <p className="text-xs font-semibold uppercase text-sky-600">
                                Registrasi
                            </p>
                            <h2 className="text-2xl font-semibold text-slate-900 font-['Space_Grotesk']">
                                Buat akun Indotix
                            </h2>
                            <p className="text-sm text-slate-500">
                                Daftarkan akun user atau mitra sesuai kebutuhan
                                Anda.
                            </p>
                        </div>

                        <div className="mt-6 space-y-3">
                            <Label className="text-xs font-semibold uppercase text-slate-500">
                                Jenis akun
                            </Label>
                            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50/80 p-2">
                                {[
                                    { value: 'user', label: 'User' },
                                    { value: 'mitra', label: 'Mitra' },
                                ].map((item) => {
                                    const isActive = mode === item.value;
                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() =>
                                                setMode(item.value as 'user' | 'mitra')
                                            }
                                            aria-pressed={isActive}
                                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                                isActive
                                                    ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                                                    : 'border-transparent bg-white text-slate-600 hover:border-sky-200'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password', 'password_confirmation']}
                            disableWhileProcessing
                            className="mt-6 flex flex-col gap-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <a
                                        href={`/auth/google/redirect?role=${mode}`}
                                        className="flex h-11 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:border-sky-200"
                                    >
                                        <img src="/images/google.svg" alt="Google" className="h-5 w-5" />
                                        Daftar dengan Google
                                    </a>
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span className="h-px flex-1 bg-slate-200" />
                                        atau daftar dengan email
                                        <span className="h-px flex-1 bg-slate-200" />
                                    </div>
                                    <input
                                        type="hidden"
                                        name="role"
                                        value={mode}
                                    />
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">
                                            {isMitra
                                                ? 'Nama PIC'
                                                : 'Nama lengkap'}
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            autoFocus
                                            autoComplete="name"
                                            name="name"
                                            placeholder={
                                                isMitra
                                                    ? 'Nama penanggung jawab'
                                                    : 'Nama lengkap'
                                            }
                                            className="bg-white"
                                        />
                                        <InputError
                                            message={errors.name}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">
                                            Email aktif
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            name="email"
                                            placeholder="nama@indotix.id"
                                            className="bg-white"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    {isMitra && (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="company_name">
                                                    Nama usaha / event
                                                </Label>
                                                <Input
                                                    id="company_name"
                                                    type="text"
                                                    autoComplete="organization"
                                                    name="company_name"
                                                    placeholder="Nama brand atau event"
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="phone">
                                                    Nomor WhatsApp
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    autoComplete="tel"
                                                    name="phone"
                                                    placeholder="08xxxxxxxxxx"
                                                    className="bg-white"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="password">
                                            Password
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            name="password"
                                            placeholder="Buat password"
                                            className="bg-white"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation">
                                            Konfirmasi password
                                        </Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            name="password_confirmation"
                                            placeholder="Ulangi password"
                                            className="bg-white"
                                        />
                                        <InputError
                                            message={errors.password_confirmation}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="mt-1 w-full bg-sky-600 text-white hover:bg-sky-700"
                                        data-test="register-user-button"
                                    >
                                        {processing && <Spinner />}
                                        Buat akun
                                    </Button>
                                </>
                            )}
                        </Form>

                        <div className="mt-6 text-center text-sm text-slate-500">
                            Sudah punya akun?{' '}
                            <TextLink href={login()}>
                                Masuk
                            </TextLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
