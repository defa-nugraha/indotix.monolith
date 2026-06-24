import type { RouteDefinition } from '@/wayfinder';

type FormMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';
type SingleMethodRoute = RouteDefinition<FormMethod>;

export function formRoute(route: SingleMethodRoute) {
    return {
        action: route.url,
        method: route.method,
    };
}
