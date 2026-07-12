import type { ReactNode } from 'react';

type FormFieldProps = {
    label: string;
    children: ReactNode;
    className?: string;
    hint?: string;
};

export function FormField({ label, children, className = '', hint }: FormFieldProps) {
    return (
        <label className={`block space-y-1.5 text-sm font-medium text-slate-700 ${className}`}>
            <span>{label}</span>
            {children}
            {hint ? <span className="block text-xs font-normal text-slate-500">{hint}</span> : null}
        </label>
    );
}
