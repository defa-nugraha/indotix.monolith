import { Head, Link, router } from '@inertiajs/react';
import {
    Clock3,
    Copy,
    ExternalLink,
    PackageCheck,
    PencilLine,
    RotateCcw,
    Search,
    Truck,
    TriangleAlert,
} from 'lucide-react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Order = {
    id: number;
    status: string;
    payment_status?: string | null;
    total_price: number;
    shipping_method: string;
    shipping_status?: string | null;
    tracking_number?: string | null;
    guest_name?: string | null;
    guest_email?: string | null;
    created_at?: string | null;
    user?: { id: number; name: string; email: string } | null;
    items?: Array<{ id: number }>;
};

type Paginator<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page?: number;
    last_page?: number;
    per_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
};

type Filters = {
    q?: string;
    status?: string;
    shipping_status?: string;
    shipping_method?: string;
};

type Props = {
    orders: Paginator<Order>;
    filters: Filters;
    mode?: 'orders' | 'fulfillment';
    summary?: {
        paid: number;
        processing: number;
        shipped: number;
        missing_tracking: number;
    };
};

const orderStatusLabels: Record<string, string> = {
    pending_payment: 'Menunggu pembayaran',
    paid: 'Siap diproses',
    processing: 'Sedang diproses',
    shipped: 'Dikirim',
    ready_pickup: 'Siap diambil',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
};

const shippingStatusLabels: Record<string, string> = {
    pending: 'Menunggu diproses',
    processing: 'Sedang disiapkan',
    shipped: 'Sudah dikirim',
};

const orderStatusClass: Record<string, string> = {
    paid: 'bg-amber-50 text-amber-700',
    processing: 'bg-sky-50 text-sky-700',
    shipped: 'bg-indigo-50 text-indigo-700',
    completed: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-rose-50 text-rose-700',
};

const formatDate = (value?: string | null) => {
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
};

const firstError = (errors: Record<string, string>) =>
    Object.values(errors)[0] ?? 'Tidak dapat memperbarui pesanan.';

export default function SouvenirOrdersIndex({
    orders,
    filters,
    mode = 'orders',
    summary,
}: Props) {
    const isFulfillment = mode === 'fulfillment';
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Retail Shop', href: '/admin/retail-shop/products' },
        {
            title: isFulfillment
                ? 'Fulfillment & Pengiriman'
                : 'Order & Transaksi',
            href: isFulfillment
                ? '/admin/retail-shop/fulfillment'
                : '/admin/retail-shop/orders',
        },
    ];

    const updateStatus = (orderId: number, status: string) => {
        router.post(
            `/admin/retail-shop/orders/${orderId}/status`,
            { status },
            {
                preserveScroll: true,
                onSuccess: () =>
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Status pesanan diperbarui.',
                    }),
                onError: (errors) =>
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: firstError(errors),
                    }),
            },
        );
    };

    const updateShipping = (order: Order, initialStatus?: string) => {
        Swal.fire({
            title: 'Perbarui Pengiriman',
            html: `
                <label for="shipping-status" class="swal2-label">Status pengiriman</label>
                <select id="shipping-status" class="swal2-select">
                    <option value="pending">Menunggu diproses</option>
                    <option value="processing">Sedang disiapkan</option>
                    <option value="shipped">Sudah dikirim</option>
                </select>
                <label for="tracking-number" class="swal2-label">Nomor resi</label>
                <input id="tracking-number" class="swal2-input" placeholder="Masukkan nomor resi" />
            `,
            didOpen: () => {
                const statusInput = document.getElementById(
                    'shipping-status',
                ) as HTMLSelectElement | null;
                const trackingInput = document.getElementById(
                    'tracking-number',
                ) as HTMLInputElement | null;

                if (statusInput) {
                    statusInput.value =
                        initialStatus ?? order.shipping_status ?? 'pending';
                }
                if (trackingInput) {
                    trackingInput.value = order.tracking_number ?? '';
                }
            },
            preConfirm: () => {
                const shippingStatus = (
                    document.getElementById(
                        'shipping-status',
                    ) as HTMLSelectElement
                ).value;
                const trackingNumber = (
                    document.getElementById(
                        'tracking-number',
                    ) as HTMLInputElement
                ).value.trim();

                if (
                    shippingStatus === 'shipped' &&
                    order.shipping_method === 'delivery' &&
                    trackingNumber === ''
                ) {
                    Swal.showValidationMessage(
                        'Nomor resi wajib diisi untuk pengiriman delivery.',
                    );
                    return false;
                }

                return {
                    shipping_status: shippingStatus,
                    tracking_number: trackingNumber,
                };
            },
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            cancelButtonText: 'Batal',
            focusConfirm: false,
        }).then((result) => {
            if (!result.isConfirmed || !result.value) return;

            router.post(
                `/admin/retail-shop/orders/${order.id}/shipping`,
                result.value,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil',
                            text: 'Data pengiriman diperbarui.',
                        }),
                    onError: (errors) =>
                        Swal.fire({
                            icon: 'error',
                            title: 'Gagal',
                            text: firstError(errors),
                        }),
                },
            );
        });
    };

    const copyTrackingNumber = async (trackingNumber: string) => {
        await navigator.clipboard.writeText(trackingNumber);
        void Swal.fire({
            icon: 'success',
            title: 'Nomor resi disalin',
            timer: 1200,
            showConfirmButton: false,
        });
    };

    const summaryItems = [
        {
            label: 'Siap diproses',
            value: summary?.paid ?? 0,
            icon: Clock3,
            style: 'bg-amber-50 text-amber-700',
        },
        {
            label: 'Sedang diproses',
            value: summary?.processing ?? 0,
            icon: PackageCheck,
            style: 'bg-sky-50 text-sky-700',
        },
        {
            label: 'Sudah dikirim',
            value: summary?.shipped ?? 0,
            icon: Truck,
            style: 'bg-indigo-50 text-indigo-700',
        },
        {
            label: 'Resi perlu dilengkapi',
            value: summary?.missing_tracking ?? 0,
            icon: TriangleAlert,
            style: 'bg-rose-50 text-rose-700',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={
                    isFulfillment
                        ? 'Fulfillment Retail Shop'
                        : 'Order Retail Shop'
                }
            />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-4 py-6 md:px-6 md:py-8">
                <section className="border-b border-sky-100 pb-6">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {isFulfillment
                            ? 'Fulfillment & Pengiriman'
                            : 'Monitoring Order Retail Shop'}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {isFulfillment
                            ? 'Proses pesanan yang sudah dibayar hingga dikirim dan lengkapi informasi pelacakannya.'
                            : 'Pantau pembayaran dan status seluruh transaksi retail shop.'}
                    </p>

                    {isFulfillment && (
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {summaryItems.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex min-h-24 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4"
                                >
                                    <div
                                        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${item.style}`}
                                    >
                                        <item.icon className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-semibold text-slate-900">
                                            {item.value}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {item.label}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-lg border border-slate-200 bg-white">
                    <form
                        className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[minmax(260px,1fr)_180px_190px_160px_auto] lg:items-end"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const formData = new FormData(event.currentTarget);
                            router.get(
                                isFulfillment
                                    ? '/admin/retail-shop/fulfillment'
                                    : '/admin/retail-shop/orders',
                                Object.fromEntries(formData.entries()),
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                },
                            );
                        }}
                    >
                        {isFulfillment && (
                            <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                                Cari pesanan
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="q"
                                        defaultValue={filters.q ?? ''}
                                        placeholder="ID, nama, email, atau nomor resi"
                                        className="h-10 w-full rounded-md border border-slate-200 bg-white pr-3 pl-9 text-sm"
                                    />
                                </div>
                            </label>
                        )}
                        <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                            Status pesanan
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                            >
                                <option value="">Semua status</option>
                                {(isFulfillment
                                    ? ['paid', 'processing', 'shipped']
                                    : [
                                          'pending_payment',
                                          'paid',
                                          'processing',
                                          'shipped',
                                          'ready_pickup',
                                          'completed',
                                          'cancelled',
                                      ]
                                ).map((status) => (
                                    <option key={status} value={status}>
                                        {orderStatusLabels[status] ?? status}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {isFulfillment && (
                            <>
                                <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                                    Status pengiriman
                                    <select
                                        name="shipping_status"
                                        defaultValue={
                                            filters.shipping_status ?? ''
                                        }
                                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                                    >
                                        <option value="">
                                            Semua pengiriman
                                        </option>
                                        {Object.entries(
                                            shippingStatusLabels,
                                        ).map(([status, label]) => (
                                            <option key={status} value={status}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                                    Metode
                                    <select
                                        name="shipping_method"
                                        defaultValue={
                                            filters.shipping_method ?? ''
                                        }
                                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                                    >
                                        <option value="">Semua metode</option>
                                        <option value="delivery">
                                            Delivery
                                        </option>
                                        <option value="pickup">
                                            Ambil di tempat
                                        </option>
                                    </select>
                                </label>
                            </>
                        )}
                        <div className="flex gap-2">
                            <Button
                                className="bg-sky-600 text-white hover:bg-sky-700"
                                type="submit"
                            >
                                <Search className="mr-2 size-4" />
                                Terapkan
                            </Button>
                            <Button variant="outline" asChild>
                                <Link
                                    href={
                                        isFulfillment
                                            ? '/admin/retail-shop/fulfillment'
                                            : '/admin/retail-shop/orders'
                                    }
                                >
                                    <RotateCcw className="mr-2 size-4" />
                                    Reset
                                </Link>
                            </Button>
                        </div>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Pesanan
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Pelanggan
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Total
                                    </th>
                                    {isFulfillment && (
                                        <th className="px-4 py-3 text-left">
                                            Pengiriman
                                        </th>
                                    )}
                                    <th className="px-4 py-3 text-left">
                                        Status
                                    </th>
                                    {isFulfillment && (
                                        <th className="px-4 py-3 text-left">
                                            Nomor resi
                                        </th>
                                    )}
                                    <th className="px-4 py-3 text-left">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.data.map((order) => {
                                    const customerName =
                                        order.user?.name ??
                                        order.guest_name ??
                                        'Guest';
                                    const customerEmail =
                                        order.user?.email ??
                                        order.guest_email ??
                                        '-';

                                    return (
                                        <tr
                                            key={order.id}
                                            className="border-t border-slate-100 align-top"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="font-semibold text-slate-900">
                                                    INDOTIX-SOUV-{order.id}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {order.items?.length ?? 0}{' '}
                                                    item ·{' '}
                                                    {formatDate(
                                                        order.created_at,
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-medium text-slate-800">
                                                    {customerName}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {customerEmail}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 font-medium text-slate-800">
                                                Rp{' '}
                                                {order.total_price.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </td>
                                            {isFulfillment && (
                                                <td className="px-4 py-4">
                                                    <div className="font-medium text-slate-800">
                                                        {order.shipping_method ===
                                                        'pickup'
                                                            ? 'Ambil di tempat'
                                                            : 'Delivery'}
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {shippingStatusLabels[
                                                            order.shipping_status ??
                                                                'pending'
                                                        ] ??
                                                            order.shipping_status ??
                                                            'Menunggu diproses'}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-4 py-4">
                                                <Badge
                                                    className={
                                                        orderStatusClass[
                                                            order.status
                                                        ] ??
                                                        'bg-slate-50 text-slate-600'
                                                    }
                                                >
                                                    {orderStatusLabels[
                                                        order.status
                                                    ] ?? order.status}
                                                </Badge>
                                            </td>
                                            {isFulfillment && (
                                                <td className="px-4 py-4">
                                                    {order.tracking_number ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs font-semibold text-slate-700">
                                                                {
                                                                    order.tracking_number
                                                                }
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                title="Salin nomor resi"
                                                                onClick={() =>
                                                                    copyTrackingNumber(
                                                                        order.tracking_number!,
                                                                    )
                                                                }
                                                            >
                                                                <Copy className="size-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-rose-600">
                                                            Belum diisi
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/admin/retail-shop/orders/${order.id}`}
                                                        >
                                                            <ExternalLink className="mr-1.5 size-4" />
                                                            Detail
                                                        </Link>
                                                    </Button>
                                                    {isFulfillment ? (
                                                        <>
                                                            {order.status ===
                                                                'paid' && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            order.id,
                                                                            'processing',
                                                                        )
                                                                    }
                                                                >
                                                                    <PackageCheck className="mr-1.5 size-4" />
                                                                    Mulai proses
                                                                </Button>
                                                            )}
                                                            {order.status ===
                                                                'processing' && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        updateShipping(
                                                                            order,
                                                                            'shipped',
                                                                        )
                                                                    }
                                                                >
                                                                    <Truck className="mr-1.5 size-4" />
                                                                    Tandai
                                                                    dikirim
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    updateShipping(
                                                                        order,
                                                                    )
                                                                }
                                                            >
                                                                <PencilLine className="mr-1.5 size-4" />
                                                                Pengiriman
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                updateStatus(
                                                                    order.id,
                                                                    order.status ===
                                                                        'processing'
                                                                        ? 'shipped'
                                                                        : 'processing',
                                                                )
                                                            }
                                                        >
                                                            {order.status ===
                                                            'processing'
                                                                ? 'Tandai dikirim'
                                                                : 'Proses'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {orders.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={isFulfillment ? 7 : 5}
                                            className="px-6 py-12 text-center text-sm text-slate-500"
                                        >
                                            Tidak ada pesanan yang sesuai dengan
                                            filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
