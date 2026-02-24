const CKEDITOR_URL = 'https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.js';

let loadingPromise: Promise<void> | null = null;

const ensurePreconnect = () => {
    if (typeof document === 'undefined') return;

    if (!document.querySelector('link[data-ckeditor-preconnect]')) {
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://cdn.ckeditor.com';
        preconnect.crossOrigin = 'anonymous';
        preconnect.dataset.ckeditorPreconnect = 'true';
        document.head.appendChild(preconnect);
    }

    if (!document.querySelector('link[data-ckeditor-dns]')) {
        const dns = document.createElement('link');
        dns.rel = 'dns-prefetch';
        dns.href = 'https://cdn.ckeditor.com';
        dns.dataset.ckeditorDns = 'true';
        document.head.appendChild(dns);
    }
};

const waitForEditor = (timeoutMs = 8000) =>
    new Promise<void>((resolve, reject) => {
        const start = Date.now();
        const timer = window.setInterval(() => {
            if ((window as any).ClassicEditor) {
                window.clearInterval(timer);
                resolve();
                return;
            }
            if (Date.now() - start > timeoutMs) {
                window.clearInterval(timer);
                reject(new Error('CKEditor tidak tersedia'));
            }
        }, 100);
    });

export const warmupCkeditor = () => {
    if (typeof document === 'undefined') return;
    ensurePreconnect();
};

export const loadCkeditor = () => {
    if (typeof window !== 'undefined' && (window as any).ClassicEditor) {
        return Promise.resolve();
    }

    if (loadingPromise) {
        return loadingPromise;
    }

    ensurePreconnect();

    loadingPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-ckeditor]');
        if (existing) {
            if ((window as any).ClassicEditor) {
                existing.dataset.loaded = 'true';
                resolve();
                return;
            }

            existing.addEventListener(
                'load',
                () => {
                    existing.dataset.loaded = 'true';
                    waitForEditor().then(resolve).catch(reject);
                },
                { once: true },
            );
            existing.addEventListener(
                'error',
                () => reject(new Error('Gagal memuat CKEditor')),
                { once: true },
            );
            waitForEditor().then(resolve).catch(reject);
            return;
        }

        const script = document.createElement('script');
        script.src = CKEDITOR_URL;
        script.async = true;
        script.dataset.ckeditor = 'true';
        script.addEventListener('load', () => {
            script.dataset.loaded = 'true';
            waitForEditor().then(resolve).catch(reject);
        });
        script.addEventListener('error', () => reject(new Error('Gagal memuat CKEditor')));
        document.head.appendChild(script);
    });

    return loadingPromise;
};
