// Components
import { Form, Head } from '@inertiajs/react';
import { MailCheck } from 'lucide-react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { formRoute } from '@/lib/form-route';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({
    status,
    email,
}: {
    status?: string;
    email?: string;
}) {
    return (
        <AuthLayout
            title="Verifikasi email Anda"
            description="Kami sudah mengirim link verifikasi ke email terdaftar. Klik link tersebut untuk mengaktifkan akun."
        >
            <Head title="Verifikasi email" />

            <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-center">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-white text-sky-600 shadow-sm">
                    <MailCheck className="size-6" />
                </div>
                <p className="text-sm font-semibold text-slate-900">
                    Cek inbox email Anda
                </p>
                <p className="mt-1 text-sm text-slate-600">
                    {email
                        ? `Link verifikasi dikirim ke ${email}.`
                        : 'Link verifikasi dikirim ke email yang Anda gunakan saat mendaftar.'}
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
                    Link verifikasi baru sudah dikirim.
                </div>
            )}

            <Form {...formRoute(send())} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary" className="w-full">
                            {processing && <Spinner />}
                            Kirim ulang link verifikasi
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            Keluar
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
