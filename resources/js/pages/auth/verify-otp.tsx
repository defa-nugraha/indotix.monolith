import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';

export default function VerifyOtp({
    email,
    expiresAt,
    status,
}: {
    email: string;
    expiresAt?: string | null;
    status?: string;
}) {
    const form = useForm({ code: '' });
    const resendForm = useForm({});
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
        null
    );

    const expiresAtMs = useMemo(() => {
        if (!expiresAt) {
            return null;
        }
        const parsed = Date.parse(expiresAt);
        return Number.isNaN(parsed) ? null : parsed;
    }, [expiresAt]);

    useEffect(() => {
        if (!expiresAtMs) {
            setRemainingSeconds(null);
            return;
        }

        const updateRemaining = () => {
            const diff = Math.max(0, expiresAtMs - Date.now());
            setRemainingSeconds(Math.floor(diff / 1000));
        };

        updateRemaining();
        const intervalId = window.setInterval(updateRemaining, 1000);

        return () => window.clearInterval(intervalId);
    }, [expiresAtMs]);

    const isExpired = remainingSeconds !== null && remainingSeconds <= 0;
    const formattedCountdown =
        remainingSeconds === null
            ? null
            : `${String(Math.floor(remainingSeconds / 60)).padStart(
                  2,
                  '0'
              )}:${String(remainingSeconds % 60).padStart(2, '0')}`;

    return (
        <AuthLayout
            title="Verifikasi Email"
            description={`Masukkan kode OTP yang dikirim ke ${email}`}
        >
            <Head title="Verifikasi OTP">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 p-6 font-['Plus_Jakarta_Sans'] text-slate-900 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
                <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-sky-200/30 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-amber-200/30 blur-3xl" />

                {status === 'otp-sent' && (
                    <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
                        Kode OTP baru telah dikirim ke email Anda.
                    </div>
                )}
                {status === 'otp-failed' && (
                    <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
                        Gagal mengirim OTP. Silakan coba kirim ulang.
                    </div>
                )}

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/email/otp');
                    }}
                    className="flex flex-col gap-4"
                >
                    <div className="grid gap-2">
                        <Label
                            htmlFor="code"
                            required
                            className="text-xs font-semibold uppercase text-sky-600"
                        >
                            Kode OTP
                        </Label>
                        <InputOTP
                            maxLength={6}
                            value={form.data.code}
                            onChange={(value) =>
                                form.setData('code', value.replace(/\D/g, ''))
                            }
                            disabled={form.processing}
                            autoFocus
                            inputMode="numeric"
                        >
                            <InputOTPGroup className="justify-center gap-2">
                                <InputOTPSlot
                                    index={0}
                                    className="h-12 w-12 rounded-2xl border border-sky-100 bg-sky-50/60 text-lg font-semibold text-slate-900 shadow-sm"
                                />
                                <InputOTPSlot
                                    index={1}
                                    className="h-12 w-12 rounded-2xl border border-sky-100 bg-sky-50/60 text-lg font-semibold text-slate-900 shadow-sm"
                                />
                                <InputOTPSlot
                                    index={2}
                                    className="h-12 w-12 rounded-2xl border border-sky-100 bg-sky-50/60 text-lg font-semibold text-slate-900 shadow-sm"
                                />
                                <InputOTPSlot
                                    index={3}
                                    className="h-12 w-12 rounded-2xl border border-sky-100 bg-sky-50/60 text-lg font-semibold text-slate-900 shadow-sm"
                                />
                                <InputOTPSlot
                                    index={4}
                                    className="h-12 w-12 rounded-2xl border border-sky-100 bg-sky-50/60 text-lg font-semibold text-slate-900 shadow-sm"
                                />
                                <InputOTPSlot
                                    index={5}
                                    className="h-12 w-12 rounded-2xl border border-sky-100 bg-sky-50/60 text-lg font-semibold text-slate-900 shadow-sm"
                                />
                            </InputOTPGroup>
                        </InputOTP>
                        <InputError message={form.errors.code} />
                        {formattedCountdown && !isExpired && (
                            <p className="text-xs text-slate-500">
                                OTP berakhir dalam {formattedCountdown}
                            </p>
                        )}
                        {isExpired && (
                            <p className="text-xs font-medium text-red-600">
                                Kode OTP sudah kedaluwarsa. Silakan kirim ulang.
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="bg-sky-600 text-white hover:bg-sky-700"
                        disabled={form.processing || isExpired}
                    >
                        {form.processing && <Spinner />}
                        Verifikasi
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm text-slate-500">
                    Tidak menerima OTP?{' '}
                    <button
                        type="button"
                        onClick={() =>
                            resendForm.post('/email/otp/resend', {
                                preserveScroll: true,
                                onSuccess: () => form.setData('code', ''),
                            })
                        }
                        className="font-semibold text-sky-600 hover:underline"
                        disabled={resendForm.processing}
                    >
                        Kirim ulang
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
}
