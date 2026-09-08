import { router, usePage } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import type { ComponentProps, ReactNode } from 'react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';

type Selection = {
    selected: Set<string>;
    rows: Set<string>;
    busy: boolean;
    register: (url: string) => () => void;
    toggle: (url: string) => void;
    selectAll: () => void;
};
const Context = createContext<Selection | null>(null);

export function BulkDeleteTable({
    children,
    requireReason = false,
    deletionWarning = 'Data terkait dapat ikut terhapus sesuai aturan fitur.',
    ...props
}: ComponentProps<'table'> & {
    requireReason?: boolean;
    deletionWarning?: string;
}) {
    const page = usePage();
    const [rows, setRows] = useState(new Set<string>());
    const [selected, setSelected] = useState(new Set<string>());
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState({ completed: 0, total: 0 });
    const locked = useRef(false);
    const mounted = useRef(true);
    const navigationStarted = useRef(false);
    useEffect(
        () =>
            router.on('before', (event) => {
                if (locked.current && event.detail.visit.method !== 'delete') {
                    navigationStarted.current = true;
                }
            }),
        [],
    );
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    const register = useCallback((url: string) => {
        setRows((old) => new Set(old).add(url));
        return () => {
            setRows((old) => {
                const next = new Set(old);
                next.delete(url);
                return next;
            });
            setSelected((old) => {
                const next = new Set(old);
                next.delete(url);
                return next;
            });
        };
    }, []);
    useEffect(() => {
        setSelected(new Set());
    }, [page.url]);

    const remove = async () => {
        if (locked.current || !selected.size) return;
        locked.current = true;
        navigationStarted.current = false;
        setBusy(true);
        const urls = [...selected].filter((url) => rows.has(url));
        let completed = 0;
        setProgress({ completed, total: urls.length });
        try {
            const answer = await Swal.fire({
                title: `Hapus ${urls.length} data terpilih?`,
                text: `${deletionWarning} Penghapusan yang berhasil tidak dapat dibatalkan. Proses berhenti jika satu data gagal.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, hapus',
                cancelButtonText: 'Batal',
                confirmButtonColor: '#dc2626',
                ...(requireReason
                    ? {
                          input: 'textarea' as const,
                          inputLabel: 'Alasan penghapusan',
                          inputAttributes: { maxlength: '500' },
                          inputValidator: (value: string) =>
                              !value.trim() ? 'Alasan wajib diisi.' : undefined,
                      }
                    : {}),
            });
            if (
                !answer.isConfirmed ||
                !mounted.current ||
                navigationStarted.current
            )
                return;
            for (const url of urls) {
                if (!mounted.current || navigationStarted.current) break;
                // Wait for visit completion before starting the next DELETE.
                const success = await new Promise<boolean>((resolve) => {
                    let confirmed = false;
                    router.delete(url, {
                        data: requireReason
                            ? { reason: String(answer.value).trim() }
                            : {},
                        preserveScroll: true,
                        preserveState: true,
                        onSuccess: (result) => {
                            confirmed = result.component === page.component;
                        },
                        onError: () => {
                            confirmed = false;
                        },
                        onCancel: () => resolve(false),
                        onFinish: () => resolve(confirmed),
                    });
                });
                if (!success) break;
                completed++;
                if (!mounted.current) break;
                setProgress({ completed, total: urls.length });
                setSelected((old) => {
                    const next = new Set(old);
                    next.delete(url);
                    return next;
                });
            }
            if (!mounted.current) return;
            await Swal.fire({
                title:
                    completed === urls.length
                        ? 'Penghapusan selesai'
                        : 'Penghapusan dihentikan',
                text: `${completed} dari ${urls.length} penghapusan terkonfirmasi. ${completed < urls.length ? 'Proses tidak dilanjutkan. Muat ulang data dan periksa izin atau aturan penghapusan sebelum mencoba lagi.' : ''}`,
                icon: completed === urls.length ? 'success' : 'warning',
            });
        } catch {
            if (mounted.current)
                await Swal.fire({
                    title: 'Penghapusan dihentikan',
                    icon: 'error',
                    text: `${completed} penghapusan terkonfirmasi. Muat ulang data sebelum mencoba kembali.`,
                });
        } finally {
            locked.current = false;
            if (mounted.current) setBusy(false);
        }
    };
    const selection: Selection = {
        rows,
        selected,
        busy,
        register,
        toggle: (url) =>
            setSelected((old) => {
                const next = new Set(old);
                if (next.has(url)) next.delete(url);
                else next.add(url);
                return next;
            }),
        selectAll: () =>
            setSelected(
                selected.size === rows.size ? new Set() : new Set(rows),
            ),
    };
    return (
        <Context.Provider value={selection}>
            <div aria-busy={busy}>
                <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
                    <span role="status" className="text-sm">
                        {busy
                            ? `${progress.completed}/${progress.total} diproses`
                            : `${selected.size} dipilih`}
                    </span>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={busy || !selected.size}
                        onClick={remove}
                    >
                        <Trash2 className="size-4" />
                        {busy ? 'Memproses...' : 'Hapus terpilih'}
                    </Button>
                </div>
                <fieldset
                    disabled={busy}
                    className="min-w-0 overflow-x-auto border-0 p-0"
                    onClickCapture={(event) => {
                        if (busy) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }}
                >
                    <table {...props}>{children}</table>
                </fieldset>
            </div>
        </Context.Provider>
    );
}

export function BulkDeleteSelectAll() {
    const value = useContext(Context)!;
    return (
        <th scope="col" className="w-12 px-3 py-2">
            <label className="flex min-h-11 min-w-11 items-center justify-center">
                <input
                    type="checkbox"
                    aria-label="Pilih semua data pada halaman ini"
                    className="size-5 cursor-pointer"
                    ref={(node) => {
                        if (node)
                            node.indeterminate =
                                value.selected.size > 0 &&
                                value.selected.size < value.rows.size;
                    }}
                    checked={
                        value.rows.size > 0 &&
                        value.selected.size === value.rows.size
                    }
                    disabled={value.busy || !value.rows.size}
                    onChange={value.selectAll}
                />
            </label>
        </th>
    );
}

export function BulkDeleteRow({
    deleteUrl,
    children,
    ...props
}: ComponentProps<'tr'> & { deleteUrl: string | null; children: ReactNode }) {
    const value = useContext(Context)!;
    const { register } = value;
    useEffect(
        () => (deleteUrl ? register(deleteUrl) : undefined),
        [deleteUrl, register],
    );
    return (
        <tr {...props}>
            <td className="w-12 px-3 py-2">
                {deleteUrl && (
                    <label className="flex min-h-11 min-w-11 items-center justify-center">
                        <input
                            type="checkbox"
                            aria-label={`Pilih data ${deleteUrl.split('/').at(-1)} untuk dihapus`}
                            className="size-5 cursor-pointer"
                            checked={value.selected.has(deleteUrl)}
                            disabled={value.busy}
                            onChange={() => value.toggle(deleteUrl)}
                        />
                    </label>
                )}
            </td>
            {children}
        </tr>
    );
}
