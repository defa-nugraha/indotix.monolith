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
                        className="flex flex-wrap items-center gap-2 text-sm text-slate-900"
                    >
                        <span>Show</span>
                        <select
                            value={perPage}
                            onChange={(event) =>
                                navigate({
                                    per_page: Number(event.target.value),
                                    page: undefined,
                                })
                            }
                            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-xs"
                        >
                            {perPageOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <span>entries</span>
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
            className={`flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between ${
                mounts?.padded ? 'px-5 pb-5 md:px-6 md:pb-6' : ''
            }`}
        >
            <div className="space-y-1 text-sm text-slate-500">
                {paginators.map(([key, paginator]) => (
                    <div key={key}>
                        {paginators.length > 1 && (
                            <span className="font-semibold text-slate-700">
                                {pageLabel(key)}:{' '}
                            </span>
                        )}
                        Showing {paginator.from ?? 0} to {paginator.to ?? 0} of{' '}
                        {paginator.total ?? 0} entries
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-1 pr-14 sm:justify-end sm:pr-0">
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
                                disabled={!canPrevious}
                                onClick={() => navigate({ page: 1 })}
                            >
                                <ChevronFirst className="mr-1 size-4" />
                                First
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!canPrevious}
                                onClick={() =>
                                    navigate({ page: currentPage - 1 })
                                }
                            >
                                <ChevronLeft className="mr-1 size-4" />
                                Previous
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
                                            onClick={() =>
                                                navigate({ page: item })
                                            }
                                        >
                                            {item}
                                        </Button>
                                    ),
                                )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!canNext}
                                onClick={() =>
                                    navigate({ page: currentPage + 1 })
                                }
                            >
                                Next
                                <ChevronRight className="ml-1 size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!canNext}
                                onClick={() => navigate({ page: lastPage })}
                            >
                                Last
                                <ChevronLast className="ml-1 size-4" />
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
