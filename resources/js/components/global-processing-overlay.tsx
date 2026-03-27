import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

type ProcessingState = {
    active: boolean;
    label: string;
};

const getLabel = (method?: string): string => {
    const key = (method ?? '').toLowerCase();
    if (key === 'delete') return 'Menghapus...';
    if (key === 'post' || key === 'put' || key === 'patch') return 'Menyimpan...';
    return 'Memproses...';
};

export default function GlobalProcessingOverlay() {
    const [state, setState] = useState<ProcessingState>({
        active: false,
        label: 'Memproses...',
    });
    const pendingRef = useRef(0);

    useEffect(() => {
        const start = (event: any) => {
            const method = event?.detail?.visit?.method ?? 'get';
            if (String(method).toLowerCase() === 'get') return;
            pendingRef.current += 1;
            setState({ active: true, label: getLabel(method) });
            document.body.style.cursor = 'progress';
        };

        const finish = (event: any) => {
            const method = event?.detail?.visit?.method ?? 'get';
            if (String(method).toLowerCase() === 'get') return;
            pendingRef.current = Math.max(0, pendingRef.current - 1);
            if (pendingRef.current === 0) {
                setState((prev) => ({ ...prev, active: false }));
                document.body.style.cursor = '';
            }
        };

        const removeStart = router.on('start', start);
        const removeFinish = router.on('finish', finish);
        const removeCancel = router.on('cancel', finish);

        return () => {
            removeStart();
            removeFinish();
            removeCancel();
            document.body.style.cursor = '';
        };
    }, []);

    if (!state.active) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
                <span className="inline-flex size-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
                <span className="text-sm font-semibold text-slate-700">
                    {state.label}
                </span>
            </div>
        </div>
    );
}
