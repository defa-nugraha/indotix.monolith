import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { formRoute } from '@/lib/form-route';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <div className="relative min-h-svh overflow-hidden bg-[#f6fbff] font-['Plus_Jakarta_Sans'] text-slate-900">
            <Head title="Masuk">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="pointer-events-none absolute top-10 -left-32 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="pointer-events-none absolute top-0 right-[-10%] h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-[-15%] left-[15%] h-80 w-80 rounded-full bg-amber-300/25 blur-[140px]" />

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
                                Masuk
                            </p>
                            <h2 className="font-['Space_Grotesk'] text-2xl font-semibold text-slate-900">
                                Selamat datang kembali
                            </h2>
                            <p className="text-sm text-slate-500">
                                Masuk untuk melanjutkan ke akun Anda.
                            </p>
                        </div>

                        <Form
                            {...formRoute(store())}
                            resetOnSuccess={['password']}
                            className="mt-6 flex flex-col gap-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <a
                                        href="/auth/google/redirect"
                                        className="flex h-11 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:border-sky-200"
                                    >
                                        <img
                                            src="/images/google.svg"
                                            alt="Google"
                                            className="h-5 w-5"
                                        />
                                        Masuk dengan Google
                                    </a>
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span className="h-px flex-1 bg-slate-200" />
                                        atau masuk dengan email
                                        <span className="h-px flex-1 bg-slate-200" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">
                                            Email terdaftar
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            autoComplete="email"
                                            placeholder="nama@indotix.id"
                                            className="bg-white"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password">
                                                Password
                                            </Label>
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="ml-auto text-xs"
                                                >
                                                    Lupa password?
                                                </TextLink>
                                            )}
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            autoComplete="current-password"
                                            placeholder="Masukkan password"
                                            className="bg-white"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                        />
                                        <Label htmlFor="remember">
                                            Ingat saya
                                        </Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="mt-1 w-full bg-sky-600 text-white hover:bg-sky-700"
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && <Spinner />}
                                        Masuk sekarang
                                    </Button>
                                </>
                            )}
                        </Form>

                        {canRegister && (
                            <div className="mt-6 text-center text-sm text-slate-500">
                                Belum punya akun?{' '}
                                <TextLink href={register()}>
                                    Daftar sekarang
                                </TextLink>
                            </div>
                        )}

                        {status && (
                            <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-2 text-center text-xs font-semibold text-emerald-700">
                                {status}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
