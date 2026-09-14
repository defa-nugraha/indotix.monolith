import { createContext, useContext } from 'react';

export const PageContext = createContext({
    component: 'admin/test',
    url: '/admin/test?page=1',
});
export const usePage = () => useContext(PageContext);
export const transport = {
    calls: [] as { url: string; data: unknown }[],
    failure: '',
    failureMode: 'validation',
    delay: 10,
    deleted: (_url: string) => {},
};
export const router = {
    on: (_event: string, handler: EventListener) => {
        window.addEventListener('test-inertia-before', handler);
        return () => window.removeEventListener('test-inertia-before', handler);
    },
    delete: (url: string, options: any) => {
        transport.calls.push({ url, data: options.data });
        setTimeout(() => {
            if (url === transport.failure) {
                if (transport.failureMode === 'validation')
                    options.onError({ record: 'Protected record' });
                if (transport.failureMode === 'cancel') options.onCancel();
                if (transport.failureMode === 'redirect')
                    options.onSuccess({ component: 'auth/login' });
            } else {
                transport.deleted(url);
                options.onSuccess({ component: 'admin/test' });
            }
            options.onFinish();
        }, transport.delay);
    },
};
