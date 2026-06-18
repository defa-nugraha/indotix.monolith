import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sistem, Audit & Kontrol', href: '/admin/system/settings' },
    { title: 'Konfigurasi Sistem', href: '/admin/system/settings' },
];

type Props = {
    settings: {
        booking_timeout_minutes: number;
        tax_rate: number;
        service_fee: number;
        wisata_booking_timeout_minutes: number;
        wisata_max_quota_per_ticket: number;
        wisata_refund_policy: string;
        public_whatsapp_number: string;
        maintenance_enabled: boolean;
        maintenance_message: string;
    };
    resetStats: {
        admin_users: number;
        resettable_tables: number;
        upload_directories: number;
        sections: {
            key: string;
            label: string;
            description: string;
            tables_count: number;
        }[];
    };
    canResetSystem: boolean;
};

export default function SystemSettings({
    settings,
    resetStats,
    canResetSystem,
}: Props) {
    const { data, setData, post, processing } = useForm({
        booking_timeout_minutes: settings.booking_timeout_minutes,
        tax_rate: settings.tax_rate,
        service_fee: settings.service_fee,
        wisata_booking_timeout_minutes: settings.wisata_booking_timeout_minutes,
        wisata_max_quota_per_ticket: settings.wisata_max_quota_per_ticket,
        wisata_refund_policy: settings.wisata_refund_policy,
        public_whatsapp_number: settings.public_whatsapp_number,
        maintenance_enabled: settings.maintenance_enabled,
        maintenance_message: settings.maintenance_message,
    });
    const [selectedResetSections, setSelectedResetSections] = useState<string[]>(
        () => resetStats.sections.map((section) => section.key),
    );
    const selectedResetLabels = useMemo(
        () =>
            resetStats.sections
                .filter((section) => selectedResetSections.includes(section.key))
                .map((section) => section.label),
        [resetStats.sections, selectedResetSections],
    );

    const toggleResetSection = (key: string) => {
        setSelectedResetSections((current) =>
            current.includes(key)
                ? current.filter((item) => item !== key)
                : [...current, key],
        );
    };

    const handleResetSystem = async () => {
        if (selectedResetSections.length === 0) {
            await Swal.fire({
                title: 'Pilih data',
                text: 'Pilih minimal satu bagian sistem yang ingin dihapus.',
                icon: 'warning',
                confirmButtonText: 'OK',
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Reset bagian terpilih?',
            html: `Bagian yang akan dihapus:<br><b>${selectedResetLabels.join(', ')}</b><br><br>Akun admin tetap dipertahankan. Ketik <b>RESET SISTEM</b> untuk melanjutkan.`,
            icon: 'warning',
            input: 'text',
            inputPlaceholder: 'RESET SISTEM',
            showCancelButton: true,
            confirmButtonText: 'Reset Sistem',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
            inputValidator: (value) => {
                if (value !== 'RESET SISTEM') {
                    return 'Ketik RESET SISTEM dengan benar.';
                }

                return null;
            },
        });

        if (!result.isConfirmed) {
            return;
        }

        router.post(
            '/admin/system/reset',
            { confirmation: result.value, sections: selectedResetSections },
            {
                preserveScroll: true,
                onSuccess: () =>
                    Swal.fire({
                        title: 'Sistem direset',
                        text: 'Bagian sistem terpilih berhasil dikosongkan. Akun admin tetap tersedia.',
                        icon: 'success',
                        confirmButtonText: 'OK',
                    }),
                onError: () =>
                    Swal.fire({
                        title: 'Reset gagal',
                        text: 'Sistem tidak dapat direset. Periksa konfirmasi atau hak akses admin.',
                        icon: 'error',
                        confirmButtonText: 'OK',
                    }),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Konfigurasi Sistem" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-sky-600">
                            Konfigurasi Sistem
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Atur parameter utama
                        </h1>
                        <p className="text-sm text-slate-500">
                            Fleksibel tanpa deploy ulang.
                        </p>
                    </div>
                </section>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        post('/admin/system/settings', {
                            onSuccess: () => Swal.fire({ title: 'Berhasil', text: 'Pengaturan disimpan.', icon: 'success' }),
                            onError: () => Swal.fire({ title: 'Gagal', text: 'Pengaturan gagal disimpan.', icon: 'error' }),
                        });
                    }}
                    className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                >
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Booking timeout (menit)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={data.booking_timeout_minutes}
                                onChange={(event) => setData('booking_timeout_minutes', Number(event.target.value))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Pajak (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={data.tax_rate}
                                onChange={(event) => setData('tax_rate', Number(event.target.value))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Biaya layanan (Rp)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.service_fee}
                                onChange={(event) => setData('service_fee', Number(event.target.value))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Booking timeout wisata (menit)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={data.wisata_booking_timeout_minutes}
                                onChange={(event) => setData('wisata_booking_timeout_minutes', Number(event.target.value))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Maks kuota per tiket wisata
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={data.wisata_max_quota_per_ticket}
                                onChange={(event) => setData('wisata_max_quota_per_ticket', Number(event.target.value))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Kebijakan refund wisata
                            </label>
                            <input
                                type="text"
                                value={data.wisata_refund_policy}
                                onChange={(event) => setData('wisata_refund_policy', event.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Nomor WhatsApp publik
                            </label>
                            <input
                                type="text"
                                value={data.public_whatsapp_number}
                                onChange={(event) => setData('public_whatsapp_number', event.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder="Contoh: 6281292059888"
                            />
                            <p className="text-xs text-slate-500">
                                Digunakan untuk tombol WhatsApp mengambang di halaman publik. Isi dengan format kode negara, misalnya 62812...
                            </p>
                        </div>
                        <div className="grid gap-2 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 md:col-span-3">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-amber-700">
                                        Mode Maintenance
                                    </label>
                                    <p className="text-sm text-amber-800">
                                        Saat aktif, user dan mitra tidak dapat membuat
                                        transaksi baru atau melanjutkan pembayaran.
                                    </p>
                                </div>
                                <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={data.maintenance_enabled}
                                        onChange={(event) => setData('maintenance_enabled', event.target.checked)}
                                        className="h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    Aktifkan
                                </label>
                            </div>
                            <textarea
                                value={data.maintenance_message}
                                onChange={(event) => setData('maintenance_message', event.target.value)}
                                rows={3}
                                maxLength={500}
                                className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm shadow-xs focus:border-amber-400 focus:ring-amber-400"
                                placeholder="Tulis pesan maintenance yang mudah dipahami user dan mitra."
                            />
                            <p className="text-xs text-amber-700">
                                Pesan ini ditampilkan pada dashboard user/mitra dan
                                dikirim sebagai respons saat transaksi diblokir.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Button type="submit" disabled={processing} className="bg-sky-600 text-white hover:bg-sky-700">
                            Simpan perubahan
                        </Button>
                    </div>
                </form>

                <section className="rounded-3xl border border-red-100 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-red-600">
                                Reset Sistem
                            </p>
                            <h2 className="text-xl font-semibold text-slate-900">
                                Kosongkan data aplikasi
                            </h2>
                            <p className="max-w-3xl text-sm text-slate-500">
                                Pilih bagian mana saja yang ingin dikosongkan saat memulai
                                ulang sistem. Akun admin, role admin, permission admin,
                                data wilayah, migrasi, sesi aktif, dan pengaturan sistem
                                tetap dipertahankan.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={!canResetSystem}
                            onClick={handleResetSystem}
                        >
                            Reset Sistem
                        </Button>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {resetStats.sections.map((section) => (
                            <label
                                key={section.key}
                                className="flex cursor-pointer gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-sky-200 hover:bg-sky-50/70"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedResetSections.includes(section.key)}
                                    onChange={() => toggleResetSection(section.key)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span>
                                    <span className="block font-semibold text-slate-900">
                                        {section.label}
                                    </span>
                                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                                        {section.description}
                                    </span>
                                    {section.key !== 'users' && section.key !== 'uploads' && (
                                        <span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
                                            {section.tables_count} tabel
                                        </span>
                                    )}
                                </span>
                            </label>
                        ))}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase text-slate-400">
                                Akun admin aman
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">
                                {resetStats.admin_users}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase text-slate-400">
                                Tabel akan dikosongkan
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">
                                {resetStats.resettable_tables}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase text-slate-400">
                                Folder upload
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">
                                {resetStats.upload_directories}
                            </p>
                        </div>
                    </div>

                    {!canResetSystem && (
                        <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            Hanya super admin yang dapat melakukan reset sistem.
                        </p>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
