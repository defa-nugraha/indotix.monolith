import { Link } from '@inertiajs/react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';

type MenuItem = {
    label: string;
    href: string;
    match: string;
};

const menuItems: MenuItem[] = [
    { label: 'Produk', href: '/admin/retail-shop/products', match: '/admin/retail-shop/products' },
    { label: 'Kategori', href: '/admin/retail-shop/categories', match: '/admin/retail-shop/categories' },
    { label: 'Variasi', href: '/admin/retail-shop/variants', match: '/admin/retail-shop/variants' },
    { label: 'Inventory', href: '/admin/retail-shop/inventory', match: '/admin/retail-shop/inventory' },
    { label: 'Order', href: '/admin/retail-shop/orders', match: '/admin/retail-shop/orders' },
    { label: 'Fulfillment', href: '/admin/retail-shop/fulfillment', match: '/admin/retail-shop/fulfillment' },
    { label: 'Refund', href: '/admin/retail-shop/refunds', match: '/admin/retail-shop/refunds' },
    { label: 'Promo', href: '/admin/retail-shop/promotions', match: '/admin/retail-shop/promotions' },
    { label: 'Laporan', href: '/admin/retail-shop/reports', match: '/admin/retail-shop/reports' },
    { label: 'Audit', href: '/admin/retail-shop/audit', match: '/admin/retail-shop/audit' },
    { label: 'Konfigurasi', href: '/admin/retail-shop/settings', match: '/admin/retail-shop/settings' },
];

export default function SouvenirAdminMenu({ className }: { className?: string }) {
    const { currentUrl } = useCurrentUrl();

    return (
        <div className={cn('flex flex-wrap gap-2 overflow-x-auto', className)}>
            {menuItems.map((item) => {
                const isActive = currentUrl.startsWith(item.match);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'rounded-full px-4 py-2 text-xs font-semibold transition',
                            isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        )}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </div>
    );
}
