import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Stats = {
    totalOrders: number;
    totalRevenue: number;
    refundTotal: number;
    pendingOrders: number;
};

type TopProduct = {
    product_id: number;
    product_name: string;
    total_qty: number;
    total_sales: number;
};

export default function SouvenirReportsIndex({ stats, topProducts }: { stats: Stats; topProducts: TopProduct[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Souvenir', href: '/admin/souvenir/products' },
        { title: 'Laporan & Analitik', href: '/admin/souvenir/reports' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Souvenir" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Laporan Penjualan Souvenir</h1>
                    <p className="text-sm text-slate-500">Pantau GMV, refund, dan produk terlaris.</p>

                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="text-xs text-slate-500">Total Order</div>
                            <div className="text-xl font-semibold text-slate-900">{stats.totalOrders}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="text-xs text-slate-500">Revenue</div>
                            <div className="text-xl font-semibold text-slate-900">Rp {stats.totalRevenue.toLocaleString('id-ID')}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="text-xs text-slate-500">Refund Total</div>
                            <div className="text-xl font-semibold text-slate-900">Rp {stats.refundTotal.toLocaleString('id-ID')}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="text-xs text-slate-500">Order Pending</div>
                            <div className="text-xl font-semibold text-slate-900">{stats.pendingOrders}</div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Produk Terlaris</h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Produk</th>
                                    <th className="px-4 py-3 text-left">Qty Terjual</th>
                                    <th className="px-4 py-3 text-left">Total Sales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((product) => (
                                    <tr key={product.product_id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{product.product_name}</td>
                                        <td className="px-4 py-3">{product.total_qty}</td>
                                        <td className="px-4 py-3">Rp {Number(product.total_sales).toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
