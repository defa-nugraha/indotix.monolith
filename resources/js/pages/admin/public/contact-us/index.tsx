import { Head, router, useForm } from '@inertiajs/react';
import {
    AtSign,
    Bot,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    CircleHelp,
    Clock3,
    Compass,
    ExternalLink,
    Globe,
    Headphones,
    HelpCircle,
    Info,
    Landmark,
    LifeBuoy,
    Link2,
    Mail,
    Map,
    MapPin,
    MapPinned,
    MessageCircle,
    MessageSquare,
    MessagesSquare,
    Navigation,
    Phone,
    PhoneCall,
    QrCode,
    Send,
    ShieldCheck,
    Smartphone,
    Store,
    Ticket,
    Users,
    Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import Swal from 'sweetalert2';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Contact = {
    id: number;
    name: string;
    contact: string;
    description: string | null;
    icon: string;
    sort_order: number;
    is_active: boolean;
};

const icons: { name: string; label: string; Icon: LucideIcon }[] = [
    ['Phone', 'Telepon', Phone],
    ['PhoneCall', 'Panggilan', PhoneCall],
    ['Mail', 'Email', Mail],
    ['MessageCircle', 'Chat', MessageCircle],
    ['MessageSquare', 'Pesan', MessageSquare],
    ['MessagesSquare', 'Pesan grup', MessagesSquare],
    ['Send', 'Kirim', Send],
    ['AtSign', 'At sign', AtSign],
    ['Globe', 'Website', Globe],
    ['MapPin', 'Lokasi', MapPin],
    ['MapPinned', 'Lokasi detail', MapPinned],
    ['Map', 'Peta', Map],
    ['Navigation', 'Navigasi', Navigation],
    ['Compass', 'Kompas', Compass],
    ['Building2', 'Kantor', Building2],
    ['Store', 'Toko', Store],
    ['Landmark', 'Gedung', Landmark],
    ['Headphones', 'Customer service', Headphones],
    ['LifeBuoy', 'Bantuan', LifeBuoy],
    ['CircleHelp', 'Bantuan', CircleHelp],
    ['HelpCircle', 'FAQ', HelpCircle],
    ['Info', 'Informasi', Info],
    ['Bot', 'Bot', Bot],
    ['Users', 'Tim', Users],
    ['BriefcaseBusiness', 'Bisnis', BriefcaseBusiness],
    ['Clock3', 'Jam layanan', Clock3],
    ['CalendarDays', 'Jadwal', CalendarDays],
    ['Link', 'Tautan', Link2],
    ['ExternalLink', 'Tautan eksternal', ExternalLink],
    ['QrCode', 'QR Code', QrCode],
    ['ShieldCheck', 'Keamanan', ShieldCheck],
    ['Ticket', 'Tiket', Ticket],
    ['Smartphone', 'Mobile', Smartphone],
    ['Wifi', 'Online', Wifi],
].map(([name, label, Icon]) => ({
    name: name as string,
    label: label as string,
    Icon: Icon as LucideIcon,
}));

const iconMap = Object.fromEntries(
    icons.map((item) => [item.name, item.Icon]),
) as Record<string, LucideIcon>;
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Konten Publik', href: '/admin/public/contact-us' },
    { title: 'Contact Us', href: '/admin/public/contact-us' },
];

export default function ContactUsIndex({ contacts }: { contacts: Contact[] }) {
    const [open, setOpen] = useState(false);
    const [iconOpen, setIconOpen] = useState(false);
    const [editing, setEditing] = useState<Contact | null>(null);
    const form = useForm({
        name: '',
        contact: '',
        description: '',
        icon: 'Phone',
        sort_order: 0,
        is_active: true,
    });
    const SelectedIcon = iconMap[form.data.icon] ?? Phone;

    const begin = (contact?: Contact) => {
        setEditing(contact ?? null);
        form.setData({
            name: contact?.name ?? '',
            contact: contact?.contact ?? '',
            description: contact?.description ?? '',
            icon:
                contact?.icon && iconMap[contact.icon] ? contact.icon : 'Phone',
            sort_order: contact?.sort_order ?? 0,
            is_active: contact?.is_active ?? true,
        });
        setOpen(true);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            onSuccess: () => {
                setOpen(false);
                Swal.fire({
                    title: 'Berhasil',
                    text: editing
                        ? 'Kontak diperbarui.'
                        : 'Kontak ditambahkan.',
                    icon: 'success',
                });
            },
            onError: () =>
                Swal.fire({
                    title: 'Gagal',
                    text: 'Periksa kembali isian kontak.',
                    icon: 'error',
                }),
        };
        if (editing)
            form.put(`/admin/public/contact-us/${editing.id}`, options);
        else form.post('/admin/public/contact-us', options);
    };

    const remove = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus kontak?',
            text: 'Data kontak akan dihapus.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });
        if (result.isConfirmed)
            router.delete(`/admin/public/contact-us/${id}`, {
                onSuccess: () =>
                    Swal.fire({
                        title: 'Berhasil',
                        text: 'Kontak dihapus.',
                        icon: 'success',
                    }),
            });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Contact Us" />
            <div className="flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-sans text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Konten Publik
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold">
                                Contact Us
                            </h1>
                            <p className="mt-2 text-sm text-slate-600">
                                Kelola daftar kontak yang ditampilkan pada
                                halaman Contact Us.
                            </p>
                        </div>
                        <Button
                            onClick={() => begin()}
                            className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                            Tambah Kontak
                        </Button>
                    </div>
                </section>
                <section className="overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Icon</th>
                                    <th className="px-4 py-3">Nama</th>
                                    <th className="px-4 py-3">Kontak</th>
                                    <th className="px-4 py-3">Urutan</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map((contact) => {
                                    const Icon = iconMap[contact.icon] ?? Phone;
                                    return (
                                        <tr
                                            key={contact.id}
                                            className="border-t border-slate-100"
                                        >
                                            <td className="px-4 py-3">
                                                <Icon className="size-5 text-sky-600" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold">
                                                    {contact.name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {contact.description || '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {contact.contact}
                                            </td>
                                            <td className="px-4 py-3">
                                                {contact.sort_order}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    className={
                                                        contact.is_active
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }
                                                >
                                                    {contact.is_active
                                                        ? 'active'
                                                        : 'inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="border-sky-200"
                                                        onClick={() =>
                                                            begin(contact)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="border-red-200 text-red-600"
                                                        onClick={() =>
                                                            remove(contact.id)
                                                        }
                                                    >
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {contacts.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-10 text-center text-slate-500"
                                        >
                                            Belum ada kontak.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit Kontak' : 'Tambah Kontak'}
                        </DialogTitle>
                        <DialogDescription>
                            Kontak ini akan ditampilkan pada halaman Contact Us
                            publik.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label required>Nama</Label>
                            <Input
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label required>Kontak</Label>
                            <Input
                                placeholder="0812... atau info@..."
                                value={form.data.contact}
                                onChange={(event) =>
                                    form.setData('contact', event.target.value)
                                }
                            />
                            <InputError message={form.errors.contact} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Deskripsi singkat</Label>
                            <Input
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.description} />
                        </div>
                        <div className="grid gap-2">
                            <Label required>Icon</Label>
                            <Button
                                type="button"
                                variant="outline"
                                className="justify-start gap-3"
                                onClick={() => setIconOpen(true)}
                            >
                                <SelectedIcon className="size-5 text-sky-600" />
                                {icons.find(
                                    (item) => item.name === form.data.icon,
                                )?.label ?? 'Pilih icon'}
                            </Button>
                            <InputError message={form.errors.icon} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Urutan</Label>
                            <Input
                                type="number"
                                min={0}
                                value={form.data.sort_order}
                                onChange={(event) =>
                                    form.setData(
                                        'sort_order',
                                        Number(event.target.value),
                                    )
                                }
                            />
                            <InputError message={form.errors.sort_order} />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) =>
                                    form.setData(
                                        'is_active',
                                        event.target.checked,
                                    )
                                }
                            />
                            Tampilkan pada halaman publik
                        </label>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                            Simpan
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={iconOpen} onOpenChange={setIconOpen}>
                <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Pilih Icon Kontak</DialogTitle>
                        <DialogDescription>
                            Pilih icon yang paling sesuai dengan jenis kontak.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {icons.map(({ name, label, Icon }) => (
                            <button
                                key={name}
                                type="button"
                                className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-2 text-xs transition hover:border-sky-400 hover:bg-sky-50 ${form.data.icon === name ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600'}`}
                                onClick={() => {
                                    form.setData('icon', name);
                                    setIconOpen(false);
                                }}
                            >
                                <Icon className="size-5" />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
