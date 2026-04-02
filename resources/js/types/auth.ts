export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    is_suspended?: boolean;
    suspended_at?: string | null;
    suspended_reason?: string | null;
    two_factor_enabled?: boolean;
    role?:
        | 'admin'
        | 'mitra'
        | 'user'
        | 'admin_academy'
        | 'admin_retail'
        | 'admin_special_program'
        | string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
