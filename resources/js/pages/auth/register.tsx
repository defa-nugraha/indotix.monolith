import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { formRoute } from '@/lib/form-route';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    const [mode, setMode] = useState<'user' | 'mitra'>('user');
    const [legalAccepted, setLegalAccepted] = useState(false);
    const [legalError, setLegalError] = useState<string | null>(null);
    const isMitra = mode === 'mitra';

    return (
        <div className="relative min-h-svh overflow-hidden bg-[#f6fbff] font-['Plus_Jakarta_Sans'] text-slate-900">
            <Head title="Daftar">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="pointer-events-none absolute top-[-10%] -left-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="pointer-events-none absolute top-[15%] right-[-8%] h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-[-20%] left-[25%] h-80 w-80 rounded-full bg-amber-300/20 blur-[140px]" />

            <div className="relative mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 py-14">
                <div className="flex w-full max-w-md items-center justify-center">
                    <div className="w-full animate-in rounded-3xl border border-sky-100/80 bg-white/90 p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur duration-700 fade-in slide-in-from-bottom-4">
                        <div className="mb-6 flex justify-center">
                            <img
                                src="/logo.png"
                                alt="Indotix"
                                className="h-12 w-auto"
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Registrasi
                            </p>
                            <h2 className="font-['Space_Grotesk'] text-2xl font-semibold text-slate-900">
                                Buat akun Indotix
                            </h2>
                            <p className="text-sm text-slate-500">
                                Daftarkan akun user atau mitra sesuai kebutuhan
                                Anda.
                            </p>
                        </div>

                        <div className="mt-6 space-y-3">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">
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
                                                setMode(
                                                    item.value as
                                                        | 'user'
                                                        | 'mitra',
                                                )
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
                            {...formRoute(store())}
                            resetOnSuccess={[
                                'password',
                                'password_confirmation',
                            ]}
                            disableWhileProcessing
                            className="mt-6 flex flex-col gap-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <a
                                        href={`/auth/google/redirect?role=${mode}&legal_accepted=1`}
                                        onClick={(event) => {
                                            if (!legalAccepted) {
                                                event.preventDefault();
                                                setLegalError(
                                                    'Silakan setujui Syarat dan Ketentuan serta Kebijakan Privasi terlebih dahulu.',
                                                );
                                            }
                                        }}
                                        aria-disabled={!legalAccepted}
                                        className={`flex h-11 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 ${
                                            legalAccepted
                                                ? ''
                                                : 'cursor-not-allowed opacity-70'
                                        }`}
                                    >
                                        <img
                                            src="/images/google.svg"
                                            alt="Google"
                                            className="h-5 w-5"
                                        />
                                        Daftar dengan Google
                                    </a>
                                    {legalError && (
                                        <p className="-mt-1 text-xs font-medium text-red-600">
                                            {legalError}
                                        </p>
                                    )}
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
                                                <InputError
                                                    message={errors.phone}
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
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                        <div className="flex items-start gap-3">
                                            <input
                                                id="terms_accepted"
                                                name="terms_accepted"
                                                type="checkbox"
                                                value="1"
                                                required
                                                checked={legalAccepted}
                                                onChange={(event) => {
                                                    setLegalAccepted(
                                                        event.target.checked,
                                                    );
                                                    if (event.target.checked) {
                                                        setLegalError(null);
                                                    }
                                                }}
                                                className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            />
                                            <Label
                                                htmlFor="terms_accepted"
                                                className="text-sm leading-6 text-slate-600"
                                            >
                                                Saya telah membaca, memahami,
                                                dan menyetujui{' '}
                                                <Link
                                                    href="/terms-and-conditions"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-semibold text-sky-700 underline-offset-4 hover:underline"
                                                >
                                                    Syarat dan Ketentuan
                                                </Link>{' '}
                                                serta{' '}
                                                <Link
                                                    href="/privacy-policy"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-semibold text-sky-700 underline-offset-4 hover:underline"
                                                >
                                                    Kebijakan Privasi
                                                </Link>{' '}
                                                Indotix.
                                            </Label>
                                        </div>
                                        <InputError
                                            message={errors.terms_accepted}
                                            className="mt-2"
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
                            <TextLink href={login()}>Masuk</TextLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
