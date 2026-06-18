export type * from './auth';
export type * from './navigation';
export type * from './ui';

import type { Auth } from './auth';

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    maintenance_mode?: {
        enabled: boolean;
        message: string;
    };
    [key: string]: unknown;
};
