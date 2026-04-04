import { useEffect, useMemo, useState } from 'react';

const parseTarget = (value?: string | null): number | null => {
    if (!value) return null;
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return null;
    return date.getTime();
};

type SaleCountdownProps = {
    target?: string | null;
    label?: string;
    compact?: boolean;
    className?: string;
};

export default function SaleCountdown({ target, label = 'Berakhir', compact = false, className = '' }: SaleCountdownProps) {
    const [remaining, setRemaining] = useState<number | null>(null);

    useEffect(() => {
        const targetMs = parseTarget(target);
        if (!targetMs) {
            setRemaining(null);
            return undefined;
        }

        const tick = () => {
            const diff = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
            setRemaining(diff);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [target]);

    const formatted = useMemo(() => {
        if (remaining === null) return null;
        const days = Math.floor(remaining / 86400);
        const hours = Math.floor((remaining % 86400) / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;

        const pad = (value: number) => String(value).padStart(2, '0');

        return {
            days,
            hours: pad(hours),
            minutes: pad(minutes),
            seconds: pad(seconds),
        };
    }, [remaining]);

    if (!formatted || remaining === null || remaining <= 0) {
        return null;
    }

    const sizeClasses = compact
        ? 'px-2.5 py-1 text-[11px]'
        : 'px-3.5 py-2 text-xs';

    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50 ${sizeClasses} font-semibold text-slate-700 shadow-sm ${className}`}
        >
            <span className="text-[10px] uppercase tracking-[0.25em] text-sky-600">
                {label}
            </span>
            <span className="text-slate-300">•</span>
            <span className="tabular-nums text-slate-800">
                {formatted.days > 0 ? `${formatted.days}d ` : ''}
                {formatted.hours}:{formatted.minutes}:{formatted.seconds}
            </span>
        </div>
    );
}
