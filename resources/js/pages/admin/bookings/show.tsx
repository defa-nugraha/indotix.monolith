import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Banknote, CalendarDays, CreditCard, Hotel, Mail, Phone, User, Users } from 'lucide-react';
import Swal from 'sweetalert2';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type BookingDetail = {
    id: number;
    midtrans_order_id?: string | null;
    status: string;
    stay_status?: string | null;
    payment_status?: string | null;
    payment_deadline?: string | null;
    total?: number | null;
    subtotal?: number | null;
    currency?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    nights?: number | null;
    rooms_count?: number | null;
    guests_count?: number | null;
    special_request?: string | null;
    internal_notes?: string | null;
    checked_in_at?: string | null;
    checked_out_at?: string | null;
    no_show_at?: string | null;
    created_at?: string | null;
    hotel: {
        id?: number | null;
        name?: string | null;
        address?: string | null;
    };
    guest: {
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        user?: string | null;
    };
    rooms: Array<{
        id: number;
        room_type?: string | null;
        rooms_count?: number | null;
        guests_count?: number | null;
        price_per_night?: number | null;
        subtotal?: number | null;
    }>;
    payments: Array<{
        id: number;
        status?: string | null;
        payment_type?: string | null;
        gross_amount?: number | null;
        created_at?: string | null;
    }>;
    audit_logs: Array<{
        id: number;
        action: string;
        reason?: string | null;
        admin_name?: string | null;
        created_at?: string | null;
    }>;
};

type Props = {
    booking: BookingDetail;
    isMitra?: boolean;
    basePath?: string;
};

const statusBadge = (status: string) => {
    switch (status) {
        case 'paid':
            return 'bg-emerald-50 text-emerald-700';
        case 'pending_payment':
            return 'bg-amber-50 text-amber-700';
        case 'cancelled':
            return 'bg-rose-50 text-rose-700';
        case 'expired':
            return 'bg-slate-100 text-slate-600';
        case 'completed':
            return 'bg-sky-50 text-sky-700';
        case 'no_show':
            return 'bg-orange-50 text-orange-700';
        default:
            return 'bg-slate-100 text-slate-600';
    }
};

export default function AdminBookingShow({ booking, isMitra = false, basePath = '/admin/bookings' }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Booking & Transaksi', href: basePath },
        { title: 'Detail Booking', href: '#' },
    ];
    const handleAction = async (type: 'cancel' | 'refund' | 'dispute') => {
        const labels: Record<typeof type, { title: string; confirm: string }> = {
            cancel: { title: 'Batalkan booking?', confirm: 'Batalkan' },
            refund: { title: 'Trigger refund?', confirm: 'Refund' },
            dispute: { title: 'Catat dispute?', confirm: 'Simpan' },
        };

        const result = await Swal.fire({
            title: labels[type].title,
            input: 'textarea',
            inputLabel: 'Alasan',
            inputPlaceholder: 'Tulis alasan tindakan ini',
            inputValidator: (value) => {
                if (!value) {
                    return 'Alasan wajib diisi.';
                }
                return null;
            },
            showCancelButton: true,
            confirmButtonText: labels[type].confirm,
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;

        router.post(`${basePath}/${booking.id}/${type}`, { reason: result.value }, {
            onSuccess: () => {
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Tindakan tersimpan.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Gagal',
                    text: 'Tindakan gagal diproses.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            },
        });
    };

    const handleStayStatus = async (stayStatus: 'checked_in' | 'checked_out' | 'no_show') => {
        const labelMap: Record<typeof stayStatus, string> = {
            checked_in: 'Tandai Check-in',
            checked_out: 'Tandai Check-out',
            no_show: 'Tandai No-show',
        };

        const result = await Swal.fire({
            title: `${labelMap[stayStatus]}?`,
            text: 'Status tamu akan diperbarui.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, simpan',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;

        router.post(`${basePath}/${booking.id}/stay-status`, { stay_status: stayStatus }, {
            onSuccess: () => {
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Status tamu diperbarui.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Gagal',
                    text: 'Status tamu gagal diperbarui.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            },
        });
    };

    const handleNotesSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.patch(`${basePath}/${booking.id}/notes`, Object.fromEntries(form.entries()), {
            onSuccess: () => {
                Swal.fire({
                    title: 'Tersimpan',
                    text: 'Catatan internal diperbarui.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Gagal',
                    text: 'Catatan internal gagal diperbarui.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Booking" />
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-sky-600">
                                Detail Booking
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                {booking.hotel?.name ?? 'Hotel'} · {booking.midtrans_order_id ?? `INDOTIX-${booking.id}`}
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(booking.status)}`}>
                                    {booking.status}
                                </span>
                                {booking.stay_status && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                        Stay: {booking.stay_status}
                                    </span>
                                )}
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    Pembayaran: {booking.payment_status ?? '-'}
                                </span>
                            </div>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={basePath}>
                                <ArrowLeft className="mr-2 size-4" />
                                Kembali
                            </Link>
                        </Button>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Informasi Booking</h2>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="flex items-start gap-3">
                                <Hotel className="mt-1 size-4 text-sky-500" />
                                <div>
                                    <p className="text-xs uppercase text-slate-400">Hotel</p>
                                    <p className="font-semibold">{booking.hotel?.name ?? '-'}</p>
                                    <p className="text-xs text-slate-500">{booking.hotel?.address ?? '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CalendarDays className="mt-1 size-4 text-sky-500" />
                                <div>
                                    <p className="text-xs uppercase text-slate-400">Tanggal</p>
                                    <p className="font-semibold">{booking.check_in ?? '-'} → {booking.check_out ?? '-'}</p>
                                    <p className="text-xs text-slate-500">{booking.nights ?? 0} malam · {booking.rooms_count ?? 0} kamar</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="mt-1 size-4 text-sky-500" />
                                <div>
                                    <p className="text-xs uppercase text-slate-400">Tamu</p>
                                    <p className="font-semibold">{booking.guest?.name ?? '-'}</p>
                                    <p className="text-xs text-slate-500">{booking.guests_count ?? 0} tamu</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Banknote className="mt-1 size-4 text-sky-500" />
                                <div>
                                    <p className="text-xs uppercase text-slate-400">Total</p>
                                    <p className="font-semibold">Rp {booking.total?.toLocaleString('id-ID') ?? '-'}</p>
                                    <p className="text-xs text-slate-500">Subtotal Rp {booking.subtotal?.toLocaleString('id-ID') ?? '-'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-slate-900">Detail Kontak</h3>
                            <div className="mt-3 grid gap-3 md:grid-cols-3">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <User className="size-4 text-slate-400" />
                                    {booking.guest?.user ?? '-'}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Mail className="size-4 text-slate-400" />
                                    {booking.guest?.email ?? '-'}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone className="size-4 text-slate-400" />
                                    {booking.guest?.phone ?? '-'}
                                </div>
                            </div>
                        </div>

                        {booking.special_request && (
                            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                                <p className="font-semibold text-slate-800">Permintaan khusus</p>
                                <p className="mt-2">{booking.special_request}</p>
                            </div>
                        )}

                        {isMitra && (
                            <form onSubmit={handleNotesSave} className="mt-6 rounded-2xl border border-slate-100 bg-white p-4">
                                <p className="text-sm font-semibold text-slate-900">Catatan internal</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Hanya terlihat oleh tim hotel Anda.
                                </p>
                                <label className="mt-3 grid gap-1.5 text-sm font-medium text-slate-700">
                                    <span>Catatan untuk tim operasional</span>
                                    <textarea
                                        name="internal_notes"
                                        defaultValue={booking.internal_notes ?? ''}
                                        rows={4}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-sky-300 focus:outline-none"
                                        placeholder="Tambahkan catatan untuk tim operasional..."
                                    />
                                </label>
                                <div className="mt-3 flex justify-end">
                                    <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                        Simpan catatan
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900">Aksi Operasional</h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Semua aksi dicatat sebagai audit log.
                            </p>
                            <div className="mt-4 flex flex-col gap-3">
                                {isMitra && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleStayStatus('checked_in')}
                                            className="justify-start border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                        >
                                            Tandai check-in
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleStayStatus('checked_out')}
                                            className="justify-start border-sky-200 text-sky-600 hover:bg-sky-50"
                                        >
                                            Tandai check-out
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleStayStatus('no_show')}
                                            className="justify-start border-orange-200 text-orange-600 hover:bg-orange-50"
                                        >
                                            Tandai no-show
                                        </Button>
                                    </>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => handleAction('cancel')}
                                    className="justify-start border-rose-200 text-rose-600 hover:bg-rose-50"
                                >
                                    Batalkan booking
                                </Button>
                                {!isMitra && (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleAction('refund')}
                                        className="justify-start border-amber-200 text-amber-600 hover:bg-amber-50"
                                    >
                                        Trigger refund
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => handleAction('dispute')}
                                    className="justify-start border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    Catat dispute
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900">Audit Log</h3>
                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                {booking.audit_logs.length === 0 && (
                                    <div className="text-xs text-slate-500">Belum ada catatan.</div>
                                )}
                                {booking.audit_logs.map((log) => (
                                    <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{log.admin_name ?? 'Admin'}</span>
                                            <span>{log.created_at ?? '-'}</span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Badge variant="secondary">{log.action}</Badge>
                                            <span className="text-sm">{log.reason ?? '-'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Detail Kamar</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {booking.rooms.map((room) => (
                            <div key={room.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                                <p className="font-semibold text-slate-900">{room.room_type ?? '-'}</p>
                                <p className="text-xs text-slate-500">
                                    {room.rooms_count ?? 0} kamar · {room.guests_count ?? 0} tamu
                                </p>
                                <p className="mt-2 text-sm text-slate-600">
                                    Harga/malam: Rp {room.price_per_night?.toLocaleString('id-ID') ?? '-'}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Subtotal: Rp {room.subtotal?.toLocaleString('id-ID') ?? '-'}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Riwayat Pembayaran</h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                        {booking.payments.length === 0 && (
                            <div className="text-xs text-slate-500">Belum ada transaksi pembayaran.</div>
                        )}
                        {booking.payments.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="size-4 text-sky-500" />
                                    <div>
                                        <div className="font-semibold">{payment.payment_type ?? '-'}</div>
                                        <div className="text-xs text-slate-500">{payment.created_at ?? '-'}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-slate-900">Rp {payment.gross_amount?.toLocaleString('id-ID') ?? '-'}</div>
                                    <div className="text-xs text-slate-500">{payment.status ?? '-'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
