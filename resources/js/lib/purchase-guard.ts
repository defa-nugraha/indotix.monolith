import Swal from 'sweetalert2';

export const isPurchaseBlockedRole = (role?: string | null) =>
    role === 'admin' ||
    role === 'mitra' ||
    role === 'admin_academy' ||
    role === 'admin_retail' ||
    role === 'admin_special_program';

export const purchaseRoleLabel = (role?: string | null) =>
    role === 'mitra' ? 'Mitra' : 'Admin';

export const guardPurchaseByRole = (role?: string | null) => {
    if (!isPurchaseBlockedRole(role)) return false;

    const label = purchaseRoleLabel(role);
    Swal.fire({
        icon: 'warning',
        title: 'Akses dibatasi',
        text: `${label} tidak bisa membeli produk di Indotix.`,
        confirmButtonText: 'OK',
    });
    return true;
};
