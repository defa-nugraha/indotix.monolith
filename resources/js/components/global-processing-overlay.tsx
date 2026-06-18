import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

export default function GlobalProcessingOverlay() {
    const actionPendingRef = useRef(0);
    const activeActionRef = useRef<HTMLElement | null>(null);
    const disabledStateRef = useRef(new WeakMap<HTMLElement, boolean>());

    const markActionLoading = () => {
        const element = activeActionRef.current;
        if (!element) return;

        element.dataset.actionLoading = 'true';
        element.setAttribute('aria-busy', 'true');
        element.setAttribute('aria-disabled', 'true');

        if (
            element instanceof HTMLButtonElement ||
            element instanceof HTMLInputElement
        ) {
            disabledStateRef.current.set(element, element.disabled);
            element.disabled = true;
        }
    };

    const clearActionLoading = () => {
        const element = activeActionRef.current;
        if (!element) return;

        delete element.dataset.actionLoading;
        element.removeAttribute('aria-busy');
        element.removeAttribute('aria-disabled');

        if (
            element instanceof HTMLButtonElement ||
            element instanceof HTMLInputElement
        ) {
            element.disabled = disabledStateRef.current.get(element) ?? false;
        }

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
        };

        const finish = () => {
            actionPendingRef.current = Math.max(
                0,
                actionPendingRef.current - 1,
            );
            if (actionPendingRef.current === 0) {
                clearActionLoading();
                document.body.style.cursor = '';
            }
        };

        document.addEventListener('click', rememberClickTarget, true);
        document.addEventListener('submit', rememberSubmitTarget, true);
        const removeStart = router.on('start', start);
        const removeFinish = router.on('finish', finish);
        const removeCancel = router.on('cancel', finish);

        return () => {
            document.removeEventListener('click', rememberClickTarget, true);
            document.removeEventListener('submit', rememberSubmitTarget, true);
            removeStart();
            removeFinish();
            removeCancel();
            clearActionLoading();
            document.body.style.cursor = '';
        };
    }, []);

    return null;
}
