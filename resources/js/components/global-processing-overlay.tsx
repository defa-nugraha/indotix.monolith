import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

export default function GlobalProcessingOverlay() {
    const actionPendingRef = useRef(0);
    const activeActionRef = useRef<HTMLElement | null>(null);
    const activeElementsRef = useRef(new Set<HTMLElement>());
    const disabledStateRef = useRef(new WeakMap<HTMLElement, boolean>());
    const fallbackTimerRef = useRef<number | null>(null);

    const cleanupStaleModalState = () => {
        const hasOpenDialogOrSheet = Boolean(
            document.querySelector(
                [
                    '[data-slot="dialog-content"][data-state="open"]',
                    '[data-slot="sheet-content"][data-state="open"]',
                    '[role="dialog"][data-state="open"]',
                ].join(','),
            ),
        );

        if (hasOpenDialogOrSheet) {
            return;
        }

        document.body.style.removeProperty('pointer-events');
        document.body.style.removeProperty('overflow');

        document
            .querySelectorAll<HTMLElement>(
                [
                    '[data-slot="dialog-overlay"]',
                    '[data-slot="sheet-overlay"]',
                    '[data-radix-dialog-overlay]',
                ].join(','),
            )
            .forEach((element) => {
                element.remove();
            });
    };

    const markActionLoading = () => {
        const element = activeActionRef.current;
        if (!element) return;

        activeElementsRef.current.add(element);
        element.dataset.actionLoading = 'true';
        element.setAttribute('aria-busy', 'true');
        element.setAttribute('aria-disabled', 'true');

        if (
            element instanceof HTMLButtonElement ||
            element instanceof HTMLInputElement
        ) {
            if (!disabledStateRef.current.has(element)) {
                disabledStateRef.current.set(element, element.disabled);
            }
            element.disabled = true;
        }
    };

    const clearActionElement = (element: HTMLElement) => {
        activeElementsRef.current.delete(element);

        delete element.dataset.actionLoading;
        element.removeAttribute('aria-busy');
        element.removeAttribute('aria-disabled');

        if (
            element instanceof HTMLButtonElement ||
            element instanceof HTMLInputElement
        ) {
            element.disabled = disabledStateRef.current.get(element) ?? false;
        }
    };

    const clearActionLoading = () => {
        activeElementsRef.current.forEach((element) => {
            clearActionElement(element);
        });

        activeActionRef.current = null;
    };

    useEffect(() => {
        const rememberClickTarget = (event: MouseEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const action = target.closest<HTMLElement>(
                'button, a[href], [role="button"], input[type="submit"], input[type="button"]',
            );
            if (action?.closest('[data-skip-action-loading="true"]')) {
                activeActionRef.current = null;
                return;
            }
            if (action) {
                activeActionRef.current = action;
            }
        };

        const rememberSubmitTarget = (event: SubmitEvent) => {
            const submitter = event.submitter;
            if (submitter instanceof HTMLElement) {
                activeActionRef.current = submitter;
                return;
            }

            if (event.target instanceof HTMLFormElement) {
                activeActionRef.current =
                    event.target.querySelector<HTMLElement>(
                        'button[type="submit"], input[type="submit"]',
                    );
            }
        };

        const start = () => {
            actionPendingRef.current += 1;
            markActionLoading();
            document.body.style.cursor = 'progress';
            if (fallbackTimerRef.current) {
                window.clearTimeout(fallbackTimerRef.current);
            }
            fallbackTimerRef.current = window.setTimeout(() => {
                actionPendingRef.current = 0;
                clearActionLoading();
                document.body.style.cursor = '';
                cleanupStaleModalState();
            }, 15000);
        };

        const finish = () => {
            actionPendingRef.current = Math.max(
                0,
                actionPendingRef.current - 1,
            );
            if (actionPendingRef.current === 0) {
                if (fallbackTimerRef.current) {
                    window.clearTimeout(fallbackTimerRef.current);
                    fallbackTimerRef.current = null;
                }
                clearActionLoading();
                document.body.style.cursor = '';
            }
            window.setTimeout(cleanupStaleModalState, 450);
        };

        document.addEventListener('click', rememberClickTarget, true);
        document.addEventListener('submit', rememberSubmitTarget, true);
        const initialCleanup = window.setTimeout(cleanupStaleModalState, 0);
        const removeStart = router.on('start', start);
        const removeFinish = router.on('finish', finish);
        const removeCancel = router.on('cancel', finish);

        return () => {
            document.removeEventListener('click', rememberClickTarget, true);
            document.removeEventListener('submit', rememberSubmitTarget, true);
            window.clearTimeout(initialCleanup);
            if (fallbackTimerRef.current) {
                window.clearTimeout(fallbackTimerRef.current);
            }
            removeStart();
            removeFinish();
            removeCancel();
            clearActionLoading();
            document.body.style.cursor = '';
            cleanupStaleModalState();
        };
    }, []);

    return null;
}
