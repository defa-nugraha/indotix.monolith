import { router, usePage } from '@inertiajs/react';
import {
    ChevronFirst,
    ChevronLast,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator = {
    data?: unknown[];
    links?: PaginationLink[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
};

type PaginationMounts = {
    top: HTMLElement;
    bottom: HTMLElement;
    padded: boolean;
};

const perPageOptions = [25, 50, 100];

const isPaginator = (value: unknown): value is Paginator => {
    if (!value || typeof value !== 'object') return false;
    const item = value as Paginator;
    return Array.isArray(item.data) && Array.isArray(item.links);
};

const pageLabel = (key: string) =>
    key
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (char) => char.toUpperCase());

const pageNumbers = (currentPage: number, lastPage: number) => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(lastPage, currentPage + 2);
    const pages: number[] = [];

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }

    return pages;
};

export default function TablePagination() {
    const page = usePage();
    const [mounts, setMounts] = useState<PaginationMounts | null>(null);
    const paginators = Object.entries(page.props).filter(([, value]) =>
        isPaginator(value),
    ) as Array<[string, Paginator]>;

    const navigate = (params: Record<string, string | number | undefined>) => {
        const [path, rawQuery = ''] = page.url.split('?');
        const query = new URLSearchParams(rawQuery);

        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined) {
                query.delete(key);
                return;
            }
            query.set(key, String(value));
        });

        router.get(
            path,
            Object.fromEntries(query.entries()),
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    useEffect(() => {
        if (paginators.length === 0) {
            setMounts(null);
            return undefined;
        }

        const table = Array.from(document.querySelectorAll('table')).find(
            (item) => item.offsetParent !== null,
        );

        if (!table) {
            setMounts(null);
            return undefined;
        }

        const tableWrapper = table.closest('.overflow-x-auto') ?? table;
        const tableParent = tableWrapper.parentElement;
        const top = document.createElement('div');
        const bottom = document.createElement('div');
        const parentStyle = tableParent
            ? window.getComputedStyle(tableParent)
            : null;
        const padded = parentStyle
            ? Number.parseFloat(parentStyle.paddingLeft) < 12
            : true;

        top.dataset.tablePagination = 'top';
        bottom.dataset.tablePagination = 'bottom';
        tableParent?.insertBefore(top, tableWrapper);
        tableParent?.insertBefore(bottom, tableWrapper.nextSibling);
        setMounts({ top, bottom, padded });

        return () => {
            top.remove();
            bottom.remove();
        };
    }, [page.url, paginators.length]);

    if (paginators.length === 0) return null;

    const topControls = (
        <div
            className={`flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between ${
                mounts?.padded ? 'px-5 pt-5 md:px-6 md:pt-6' : ''
            }`}
        >
            {paginators.map(([key, paginator]) => {
                const perPage = paginator.per_page ?? 25;

                return (
                    <div
                        key={key}
                        className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700"
                    >
                        <span>Tampilkan</span>
                        <select
                            aria-label={`Jumlah data per halaman ${pageLabel(key)}`}
                            value={perPage}
                            onChange={(event) =>
                                navigate({
                                    per_page: Number(event.target.value),
                                    page: undefined,
                                })
                            }
                            className="h-10 min-w-20 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-xs outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        >
                            {perPageOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <span>data</span>
                        {paginators.length > 1 && (
                            <span className="ml-2 text-xs font-semibold uppercase text-slate-400">
                                {pageLabel(key)}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const bottomControls = (
        <div
            className={`flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between ${
                mounts?.padded ? 'px-5 pb-5 md:px-6 md:pb-6' : ''
            }`}
        >
            <div className="space-y-1 text-sm font-medium text-slate-500">
                {paginators.map(([key, paginator]) => (
                    <div key={key}>
                        {paginators.length > 1 && (
                            <span className="font-semibold text-slate-700">
                                {pageLabel(key)}:{' '}
                            </span>
                        )}
                        Menampilkan {paginator.from ?? 0} sampai{' '}
                        {paginator.to ?? 0} dari {paginator.total ?? 0} data
                    </div>
                ))}
            </div>
            <div className="flex max-w-full items-center gap-1 overflow-x-auto pb-1 pr-14 sm:pr-0 lg:justify-end">
                {paginators.map(([key, paginator]) => {
                    const currentPage = paginator.current_page ?? 1;
                    const lastPage = paginator.last_page ?? 1;
                    const canPrevious = currentPage > 1;
                    const canNext = currentPage < lastPage;

                    return (
                        <Fragment key={key}>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                aria-label="Ke halaman pertama"
                                disabled={!canPrevious}
                                onClick={() => navigate({ page: 1 })}
                                className="shrink-0 px-2 sm:px-3"
                            >
                                <ChevronFirst className="size-4 sm:mr-1" />
                                <span className="hidden sm:inline">Awal</span>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                aria-label="Ke halaman sebelumnya"
                                disabled={!canPrevious}
                                onClick={() =>
                                    navigate({ page: currentPage - 1 })
                                }
                                className="shrink-0 px-2 sm:px-3"
                            >
                                <ChevronLeft className="size-4 sm:mr-1" />
                                <span className="hidden sm:inline">
                                    Sebelumnya
                                </span>
                            </Button>
                            {lastPage > 1 &&
                                pageNumbers(currentPage, lastPage).map(
                                    (item) => (
                                        <Button
                                            key={`${key}-${item}`}
                                            type="button"
                                            variant={
                                                item === currentPage
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            aria-label={`Ke halaman ${item}`}
                                            aria-current={
                                                item === currentPage
                                                    ? 'page'
                                                    : undefined
                                            }
                                            onClick={() =>
                                                navigate({ page: item })
                                            }
                                            className="shrink-0"
                                        >
                                            {item}
                                        </Button>
                                    ),
                                )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                aria-label="Ke halaman berikutnya"
                                disabled={!canNext}
                                onClick={() =>
                                    navigate({ page: currentPage + 1 })
                                }
                                className="shrink-0 px-2 sm:px-3"
                            >
                                <span className="hidden sm:inline">
                                    Berikutnya
                                </span>
                                <ChevronRight className="size-4 sm:ml-1" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                aria-label="Ke halaman terakhir"
                                disabled={!canNext}
                                onClick={() => navigate({ page: lastPage })}
                                className="shrink-0 px-2 sm:px-3"
                            >
                                <span className="hidden sm:inline">Akhir</span>
                                <ChevronLast className="size-4 sm:ml-1" />
                            </Button>
                        </Fragment>
                    );
                })}
            </div>
        </div>
    );

    if (!mounts) {
        return (
            <div className="mx-auto w-full max-w-7xl px-6 py-4">
                {topControls}
                {bottomControls}
            </div>
        );
    }

    return (
        <>
            {createPortal(topControls, mounts.top)}
            {createPortal(bottomControls, mounts.bottom)}
        </>
    );
}
