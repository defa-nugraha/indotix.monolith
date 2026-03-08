import { Link } from '@inertiajs/react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';

type MenuItem = {
    label: string;
    href: string;
    match: string;
};

const menuItems: MenuItem[] = [
    { label: 'Produk', href: '/admin/souvenir/products', match: '/admin/souvenir/products' },
    { label: 'Kategori', href: '/admin/souvenir/categories', match: '/admin/souvenir/categories' },
    { label: 'Variasi', href: '/admin/souvenir/variants', match: '/admin/souvenir/variants' },
    { label: 'Inventory', href: '/admin/souvenir/inventory', match: '/admin/souvenir/inventory' },
    { label: 'Order', href: '/admin/souvenir/orders', match: '/admin/souvenir/orders' },
    { label: 'Fulfillment', href: '/admin/souvenir/fulfillment', match: '/admin/souvenir/fulfillment' },
    { label: 'Refund', href: '/admin/souvenir/refunds', match: '/admin/souvenir/refunds' },
    { label: 'Promo', href: '/admin/souvenir/promotions', match: '/admin/souvenir/promotions' },
    { label: 'Laporan', href: '/admin/souvenir/reports', match: '/admin/souvenir/reports' },
    { label: 'Audit', href: '/admin/souvenir/audit', match: '/admin/souvenir/audit' },
    { label: 'Konfigurasi', href: '/admin/souvenir/settings', match: '/admin/souvenir/settings' },
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
