import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const key = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;
const host =
    (import.meta.env.VITE_REVERB_HOST as string | undefined) ??
    (typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1');
const port = Number(import.meta.env.VITE_REVERB_PORT ?? 8080);
const scheme = (import.meta.env.VITE_REVERB_SCHEME as string | undefined) ?? 'http';
const forceTLS = scheme === 'https';

const getCsrfToken = () => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
};

if (typeof window !== 'undefined' && key) {
    (window as any).Pusher = Pusher;
    (window as any).Echo = new Echo({
        broadcaster: 'reverb',
        key,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS,
        enabledTransports: ['ws', 'wss'],
        auth: {
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
            },
        },
    });
}
