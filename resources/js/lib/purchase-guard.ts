import Swal from 'sweetalert2';

export const isPurchaseBlockedRole = (role?: string | null) =>
    role === 'admin' || role === 'mitra';

export const purchaseRoleLabel = (role?: string | null) =>
    role === 'admin' ? 'Admin' : 'Mitra';

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
