import { Head, Link } from '@inertiajs/react';
import { Check, CircleAlert, Home, ReceiptText } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';

type Props = {
    transaction: {
        is_paid: boolean;
        order_id: string;
        booking_code: string;
        destination_name?: string | null;
        booking_url: string;
    };
};

export default function TransactionFinish({ transaction }: Props) {
    const title = transaction.is_paid
        ? 'Pembayaran Berhasil'
        : 'Pembayaran Sedang Diproses';

    return (
        <PublicLayout
            showSearch={false}
            showCategories={false}
            showChips={false}
        >
            <Head title={title} />
            <main className="flex min-h-[calc(100vh-12rem)] items-center px-4 py-10 sm:px-6">
                <section className="mx-auto w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white text-center shadow-xl shadow-slate-200/60">
                    <div className="bg-gradient-to-b from-sky-50 to-white px-6 pt-10 pb-8 sm:px-10">
                        <div
                            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border-8 shadow-lg ${
                                transaction.is_paid
                                    ? 'animate-[pulse_1.2s_ease-in-out_2] border-emerald-100 bg-emerald-500 text-white shadow-emerald-200/70'
                                    : 'border-amber-100 bg-amber-500 text-white shadow-amber-200/70'
                            }`}
                            aria-hidden="true"
                        >
                            {transaction.is_paid ? (
                                <Check className="h-10 w-10 stroke-[3]" />
                            ) : (
                                <CircleAlert className="h-9 w-9" />
                            )}
                        </div>
                        <p
                            className={`mt-7 text-xs font-bold tracking-[0.18em] uppercase ${
                                transaction.is_paid
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                            }`}
                        >
                            {transaction.is_paid
                                ? 'Transaksi selesai'
                                : 'Menunggu konfirmasi'}
                        </p>
                        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                            {title}
                        </h1>
                        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
                            {transaction.is_paid
                                ? `Terima kasih. Tiket${transaction.destination_name ? ` ${transaction.destination_name}` : ''} kamu sudah aktif.`
                                : 'Kami belum menerima konfirmasi pembayaran dari penyedia pembayaran. Detail pesanan akan diperbarui otomatis.'}
                        </p>
                    </div>

                    <div className="space-y-5 px-6 py-6 sm:px-10">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                ID Pesanan
                            </p>
                            <p className="mt-1 break-all font-mono text-sm font-bold text-slate-800">
                                {transaction.booking_code || transaction.order_id}
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Link
                                href={transaction.booking_url}
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-bold text-white transition hover:bg-sky-700 focus-visible:ring-4 focus-visible:ring-sky-200"
                            >
                                <ReceiptText className="h-4 w-4" />
                                Detail Pesanan
                            </Link>
                            <Link
                                href="/"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-slate-100"
                            >
                                <Home className="h-4 w-4" />
                                Kembali ke Beranda
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </PublicLayout>
    );
}
