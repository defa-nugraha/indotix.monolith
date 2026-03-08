import { Transition } from '@headlessui/react';
import { Form, Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import { CheckCircle2, Mail, MapPinned, Pencil, Phone, Trash2, UserCircle } from 'lucide-react';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import PublicLayout from '@/layouts/public-layout';

type Address = {
    id: number;
    label: string;
    recipient_name: string;
    phone: string;
    address_line: string;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
    notes?: string | null;
    is_default: boolean;
};

function AddressCard({ address }: { address: Address }) {
    const [isEditing, setIsEditing] = useState(false);
    const form = useForm({
        label: address.label ?? '',
        recipient_name: address.recipient_name ?? '',
        phone: address.phone ?? '',
        address_line: address.address_line ?? '',
        city: address.city ?? '',
        province: address.province ?? '',
        postal_code: address.postal_code ?? '',
        notes: address.notes ?? '',
        is_default: address.is_default ?? false,
    });

    const formattedAddress = useMemo(() => {
        return [address.address_line, address.city, address.province, address.postal_code]
            .filter((item) => Boolean(item && `${item}`.trim()))
            .join(', ');
    }, [address.address_line, address.city, address.province, address.postal_code]);

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">{address.label}</div>
                        {address.is_default && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Alamat utama
                            </span>
                        )}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-800">{address.recipient_name}</div>
                    <div className="mt-1 text-sm text-slate-600">{address.phone}</div>
                    <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                        <MapPinned className="mt-0.5 h-4 w-4 text-sky-500" />
                        <span>{formattedAddress || '-'}</span>
                    </div>
                    {address.notes && <div className="mt-2 text-xs text-slate-500">Catatan: {address.notes}</div>}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                    {!address.is_default && (
                        <button
                            type="button"
                            onClick={() => router.patch(`/settings/addresses/${address.id}/default`, {}, { preserveScroll: true })}
                            className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                            Jadikan utama
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsEditing((prev) => !prev)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <span className="inline-flex items-center gap-1">
                            <Pencil className="h-3 w-3" />
                            {isEditing ? 'Tutup' : 'Edit'}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (confirm('Hapus alamat ini?')) {
                                router.delete(`/settings/addresses/${address.id}`, { preserveScroll: true });
                            }
                        }}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                        <span className="inline-flex items-center gap-1">
                            <Trash2 className="h-3 w-3" />
                            Hapus
                        </span>
                    </button>
                </div>
            </div>

            {isEditing && (
                <form
                    className="mt-5 grid gap-4 border-t border-slate-100 pt-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.patch(`/settings/addresses/${address.id}`, {
                            preserveScroll: true,
                            onSuccess: () => setIsEditing(false),
                        });
                    }}
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">Label</label>
                            <input
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.label}
                                onChange={(event) => form.setData('label', event.target.value)}
                                placeholder="Rumah, Kantor, dll"
                            />
                            <InputError message={form.errors.label} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">Nama Penerima</label>
                            <input
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.recipient_name}
                                onChange={(event) => form.setData('recipient_name', event.target.value)}
                            />
                            <InputError message={form.errors.recipient_name} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">Nomor HP</label>
                            <input
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.phone}
                                onChange={(event) => form.setData('phone', event.target.value)}
                            />
                            <InputError message={form.errors.phone} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">Alamat Lengkap</label>
                            <input
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.address_line}
                                onChange={(event) => form.setData('address_line', event.target.value)}
                            />
                            <InputError message={form.errors.address_line} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">Kota</label>
                            <input
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.city}
                                onChange={(event) => form.setData('city', event.target.value)}
                            />
                            <InputError message={form.errors.city} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">Provinsi</label>
                            <input
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.province}
                                onChange={(event) => form.setData('province', event.target.value)}
                            />
                            <InputError message={form.errors.province} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">Kode Pos</label>
                            <input
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.postal_code}
                                onChange={(event) => form.setData('postal_code', event.target.value)}
                            />
                            <InputError message={form.errors.postal_code} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-semibold text-slate-700">Catatan (opsional)</label>
                        <textarea
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            value={form.data.notes}
                            onChange={(event) => form.setData('notes', event.target.value)}
                        />
                        <InputError message={form.errors.notes} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={Boolean(form.data.is_default)}
                            onChange={(event) => form.setData('is_default', event.target.checked)}
                        />
                        Jadikan alamat utama
                    </label>
                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                            disabled={form.processing}
                        >
                            {form.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600"
                            onClick={() => setIsEditing(false)}
                        >
                            Batal
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_menu, affiliate_status } = usePage().props as {
        auth?: { user?: any };
        unread_notifications?: number;
        souvenir_cart_count?: number;
        affiliate_menu?: boolean;
        affiliate_status?: string | null;
    };
    const { addresses = [] } = usePage().props as { addresses?: Address[] };
    const [passwordOpen, setPasswordOpen] = useState(false);
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const addressForm = useForm({
        label: '',
        recipient_name: '',
        phone: '',
        address_line: '',
        city: '',
        province: '',
        postal_code: '',
        notes: '',
        is_default: false,
    });

    return (
        <PublicLayout showCategories={false} showChips={false}>
            <Head title="Profil Saya">
                <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700" rel="stylesheet" />
            </Head>

                        <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h1 className="text-2xl font-semibold text-slate-900">Profil Saya</h1>
                            <p className="mt-2 text-sm text-slate-500">Kelola informasi pribadi agar pemesanan kamu makin lancar.</p>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Informasi Pribadi</h2>
                            <p className="mt-2 text-sm text-slate-500">Update nama dan email yang akan digunakan untuk konfirmasi.</p>

                            <Form {...ProfileController.update.form()} options={{ preserveScroll: true }} className="mt-6 grid gap-5">
                                {({ processing, recentlySuccessful, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                                <UserCircle className="h-4 w-4 text-slate-400" />
                                                <input
                                                    name="name"
                                                    required
                                                    defaultValue={auth?.user?.name ?? ''}
                                                    className="h-10 w-full bg-transparent text-sm outline-none"
                                                    placeholder="Nama lengkap"
                                                    autoComplete="name"
                                                />
                                            </div>
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-slate-700">Email</label>
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                <input
                                                    name="email"
                                                    type="email"
                                                    required
                                                    defaultValue={auth?.user?.email ?? ''}
                                                    className="h-10 w-full bg-transparent text-sm outline-none"
                                                    placeholder="Email aktif"
                                                    autoComplete="username"
                                                />
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-2 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-slate-700">Nomor HP</label>
                                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                                    <Phone className="h-4 w-4 text-slate-400" />
                                                    <input
                                                        name="phone"
                                                        defaultValue={auth?.user?.phone ?? ''}
                                                        className="h-10 w-full bg-transparent text-sm outline-none"
                                                        placeholder="0812xxxxxxx"
                                                    />
                                                </div>
                                                <InputError message={errors.phone} />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-slate-700">Jenis Kelamin</label>
                                                <select
                                                    name="gender"
                                                    defaultValue={auth?.user?.gender ?? ''}
                                                    className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                                                >
                                                    <option value="">Pilih</option>
                                                    <option value="male">Laki-laki</option>
                                                    <option value="female">Perempuan</option>
                                                    <option value="other">Lainnya</option>
                                                </select>
                                                <InputError message={errors.gender} />
                                            </div>
                                        </div>

                                        {mustVerifyEmail && auth?.user?.email_verified_at === null && (
                                            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                                Email kamu belum terverifikasi.{' '}
                                                <Link
                                                    href="/email/verification-notification"
                                                    method="post"
                                                    as="button"
                                                    className="font-semibold underline underline-offset-4"
                                                >
                                                    Klik untuk kirim ulang verifikasi
                                                </Link>
                                                {status === 'verification-link-sent' && (
                                                    <div className="mt-2 text-sm font-semibold text-emerald-600">
                                                        Tautan verifikasi baru sudah dikirim ke email kamu.
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                            </button>
                                            <Transition
                                                show={recentlySuccessful}
                                                enter="transition ease-in-out"
                                                enterFrom="opacity-0"
                                                leave="transition ease-in-out"
                                                leaveTo="opacity-0"
                                            >
                                                <span className="text-sm text-emerald-600">Perubahan tersimpan.</span>
                                            </Transition>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Alamat Pengiriman</h2>
                                    <p className="mt-2 text-sm text-slate-500">Kelola alamat utama untuk pengiriman pesanan.</p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4">
                                {addresses.length > 0 ? (
                                    addresses.map((address) => <AddressCard key={address.id} address={address} />)
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                                        Belum ada alamat tersimpan. Tambahkan alamat utama agar checkout lebih cepat.
                                    </div>
                                )}
                            </div>

                            <form
                                className="mt-6 grid gap-4 border-t border-slate-100 pt-6"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    addressForm.post('/settings/addresses', {
                                        preserveScroll: true,
                                        onSuccess: () => addressForm.reset(),
                                    });
                                }}
                            >
                                <h3 className="text-sm font-semibold text-slate-900">Tambah Alamat Baru</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Label</label>
                                        <input
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                            value={addressForm.data.label}
                                            onChange={(event) => addressForm.setData('label', event.target.value)}
                                            placeholder="Rumah, Kantor, dll"
                                        />
                                        <InputError message={addressForm.errors.label} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Nama Penerima</label>
                                        <input
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                            value={addressForm.data.recipient_name}
                                            onChange={(event) => addressForm.setData('recipient_name', event.target.value)}
                                        />
                                        <InputError message={addressForm.errors.recipient_name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Nomor HP</label>
                                        <input
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                            value={addressForm.data.phone}
                                            onChange={(event) => addressForm.setData('phone', event.target.value)}
                                        />
                                        <InputError message={addressForm.errors.phone} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Alamat Lengkap</label>
                                        <input
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                            value={addressForm.data.address_line}
                                            onChange={(event) => addressForm.setData('address_line', event.target.value)}
                                        />
                                        <InputError message={addressForm.errors.address_line} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Kota</label>
                                        <input
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                            value={addressForm.data.city}
                                            onChange={(event) => addressForm.setData('city', event.target.value)}
                                        />
                                        <InputError message={addressForm.errors.city} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Provinsi</label>
                                        <input
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                            value={addressForm.data.province}
                                            onChange={(event) => addressForm.setData('province', event.target.value)}
                                        />
                                        <InputError message={addressForm.errors.province} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-700">Kode Pos</label>
                                        <input
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                            value={addressForm.data.postal_code}
                                            onChange={(event) => addressForm.setData('postal_code', event.target.value)}
                                        />
                                        <InputError message={addressForm.errors.postal_code} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-semibold text-slate-700">Catatan (opsional)</label>
                                    <textarea
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                        value={addressForm.data.notes}
                                        onChange={(event) => addressForm.setData('notes', event.target.value)}
                                    />
                                    <InputError message={addressForm.errors.notes} />
                                </div>
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(addressForm.data.is_default)}
                                        onChange={(event) => addressForm.setData('is_default', event.target.checked)}
                                    />
                                    Jadikan alamat utama
                                </label>
                                <button
                                    type="submit"
                                    className="w-fit rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                                    disabled={addressForm.processing}
                                >
                                    {addressForm.processing ? 'Menyimpan...' : 'Simpan Alamat'}
                                </button>
                            </form>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Akun & Keamanan</h2>
                            <p className="mt-2 text-sm text-slate-500">Kelola kata sandi dan sesi akun kamu.</p>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPasswordOpen(true)}
                                    className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                                >
                                    Ubah Password
                                </button>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="rounded-lg border border-rose-200 px-5 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300"
                                >
                                    Logout
                                </Link>
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                                    <UserCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">{auth?.user?.name ?? 'User'}</div>
                                    <div className="text-xs text-slate-500">{auth?.user?.email}</div>
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-slate-500">Terakhir diperbarui otomatis setelah kamu menyimpan perubahan.</div>
                        </div>

                        {affiliate_menu && (
                            <div className="rounded-2xl bg-white p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-900">Afiliasi Wisata</h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    Status akun: <span className="font-semibold capitalize">{affiliate_status ?? 'pending'}</span>
                                </p>
                                <Link
                                    href="/affiliate"
                                    className="mt-4 inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                                >
                                    Buka Dashboard Afiliasi
                                </Link>
                            </div>
                        )}

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900">Kontak Bantuan</h3>
                            <p className="mt-2 text-sm text-slate-600">Butuh bantuan cepat? Hubungi tim INDOTIX.</p>
                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-sky-500" />
                                    0812 9205 9888
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-sky-500" />
                                    info@indotix.co.id
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            {passwordOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Ubah Password</h3>
                                <p className="mt-1 text-sm text-slate-500">Pastikan password baru aman dan mudah diingat.</p>
                            </div>
                            <button
                                type="button"
                                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-slate-200"
                                onClick={() => {
                                    setPasswordOpen(false);
                                    passwordForm.reset();
                                }}
                            >
                                Tutup
                            </button>
                        </div>

                        <form
                            className="mt-5 grid gap-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                passwordForm.put('/settings/password', {
                                    onSuccess: () => {
                                        passwordForm.reset();
                                        setPasswordOpen(false);
                                    },
                                });
                            }}
                        >
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-slate-700">Password Saat Ini</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(event) => passwordForm.setData('current_password', event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                                    placeholder="Masukkan password lama"
                                />
                                <InputError message={passwordForm.errors.current_password} />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-slate-700">Password Baru</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(event) => passwordForm.setData('password', event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                                    placeholder="Minimal 8 karakter"
                                />
                                <InputError message={passwordForm.errors.password} />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-slate-700">Konfirmasi Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(event) => passwordForm.setData('password_confirmation', event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                                    placeholder="Ulangi password baru"
                                />
                                <InputError message={passwordForm.errors.password_confirmation} />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                                    onClick={() => {
                                        setPasswordOpen(false);
                                        passwordForm.reset();
                                    }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {passwordForm.processing ? 'Menyimpan...' : 'Simpan Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </main>

            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <Link href="/"><img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" /></Link>
                        <p className="mt-3 text-sm text-slate-600">
                            Neo Soho Capital 40th Floor<br />
                            Jl. Tanjung Duren Raya No 1<br />
                            Jakarta Barat, DKI Jakarta 11470
                        </p>
                        <p className="mt-4 text-sm text-slate-600">0812 9205 9888</p>
                        <p className="text-sm text-slate-600">info@indotix.co.id</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Layanan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Wisata</li>
                            <li>Special Program</li>
                            <li>Event</li>
                            <li>Hotel</li>
                            <li>Retail Shop</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Perusahaan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>
                                <Link href="/about" className="transition hover:text-sky-600">Tentang Kami</Link>
                            </li>
                            <li>
                                <Link href="/jelajah" className="transition hover:text-sky-600">Blog</Link>
                            </li>
                            <li>
                                <Link href="/faq" className="transition hover:text-sky-600">FAQ</Link>
                            </li>
                            <li>
                                <Link href="/privacy-policy" className="transition hover:text-sky-600">Kebijakan Privasi</Link>
                            </li>
                        </ul>
                    </div>
                    <FooterDownloadSocial />
                </div>
                <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Indotix. All rights reserved.
                </div>
            </footer>
        </PublicLayout>
    );
}
