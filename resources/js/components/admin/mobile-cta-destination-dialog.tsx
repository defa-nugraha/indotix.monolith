import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export type CtaDestination = {
    value: string;
    label: string;
    meta?: string;
};

export type CtaDestinationGroup = {
    key: string;
    label: string;
    options: CtaDestination[];
};

export default function MobileCtaDestinationDialog({
    value,
    groups,
    onChange,
}: {
    value: string;
    groups: CtaDestinationGroup[];
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const selected = groups
        .flatMap((group) => group.options)
        .find((option) => option.value === value);
    const filteredGroups = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return groups;

        return groups
            .map((group) => ({
                ...group,
                options: group.options.filter((option) =>
                    `${option.label} ${option.meta ?? ''} ${option.value}`
                        .toLowerCase()
                        .includes(normalized),
                ),
            }))
            .filter((group) => group.options.length > 0);
    }, [groups, query]);

    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-900">
                    Tujuan CTA di Mobile
                </span>
                <Button
                    type="button"
                    variant="outline"
                    className="border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                    onClick={() => setOpen(true)}
                >
                    {selected?.label ?? 'Pilih tujuan'}
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Pilih menu, produk wisata, atau voucher yang dibuka saat CTA
                diketuk.
            </p>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Pilih tujuan CTA Mobile</DialogTitle>
                        <DialogDescription>
                            Tujuan ini hanya digunakan oleh aplikasi Mobile
                            Indotix.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari menu, produk, atau voucher..."
                    />
                    <div className="grid max-h-[55vh] gap-5 overflow-y-auto pr-1">
                        {filteredGroups.map((group) => (
                            <section key={group.key} className="grid gap-2">
                                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                    {group.label}
                                </h3>
                                <div className="grid gap-2">
                                    {group.options.map((option) => (
                                        <button
                                            key={`${group.key}-${option.value}`}
                                            type="button"
                                            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                                                value === option.value
                                                    ? 'border-sky-500 bg-sky-50 text-sky-900'
                                                    : 'border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50/60'
                                            }`}
                                            onClick={() => {
                                                onChange(option.value);
                                                setOpen(false);
                                                setQuery('');
                                            }}
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">
                                                    {option.label}
                                                </span>
                                                {option.meta && (
                                                    <span className="block text-xs text-slate-500">
                                                        {option.meta}
                                                    </span>
                                                )}
                                            </span>
                                            {value === option.value && (
                                                <span className="text-xs font-semibold text-sky-700">
                                                    Dipilih
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        ))}
                        {filteredGroups.length === 0 && (
                            <p className="py-8 text-center text-sm text-slate-500">
                                Tujuan tidak ditemukan.
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
