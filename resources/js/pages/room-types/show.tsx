import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BedDouble, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type RoomType = {
    id: number;
    hotel_id: number;
    hotel_name: string | null;
    name: string;
    description: string | null;
    max_guest: number | null;
    bed_type: string | null;
    base_price: string;
    strike_price?: string | null;
    total_rooms: number;
    status: 'draft' | 'active' | 'suspended';
    images: Array<{ id: number; url: string }>;
};

type ShowProps = {
    roomType: RoomType;
};

export default function RoomTypeShow({ roomType }: ShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Tipe Kamar', href: '/room-types' },
        { title: roomType.name, href: `/room-types/${roomType.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail ${roomType.name}`}>
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                                Detail Tipe Kamar
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                                    <BedDouble className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-slate-900">
                                        {roomType.name}
                                    </h1>
                                    <p className="text-sm text-slate-500">
                                        {roomType.hotel_name ?? '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button variant="outline" asChild>
                                <Link href="/room-types">
                                    <ArrowLeft className="mr-2 size-4" />
                                    Kembali
                                </Link>
                            </Button>
                            <Button asChild className="bg-sky-600 text-white hover:bg-sky-700">
                                <Link href={`/room-types/${roomType.id}/edit`}>
                                    <Pencil className="mr-2 size-4" />
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-400">
                                    Status
                                </p>
                                <Badge variant="secondary" className="mt-2">
                                    {roomType.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-400">
                                    Total kamar
                                </p>
                                <p className="mt-2 text-lg font-semibold">
                                    {roomType.total_rooms}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-400">
                                    Maksimal tamu
                                </p>
                                <p className="mt-2 text-lg font-semibold">
                                    {roomType.max_guest ?? '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-400">
                                    Tipe bed
                                </p>
                                <p className="mt-2 text-lg font-semibold">
                                    {roomType.bed_type ?? '-'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6">
                            <p className="text-xs uppercase tracking-wider text-slate-400">
                                Harga
                            </p>
                            <div className="mt-2 flex flex-col gap-1">
                                <span className="text-2xl font-semibold text-slate-900">
                                    Rp {Number(roomType.base_price).toLocaleString('id-ID')}
                                </span>
                                {roomType.strike_price && Number(roomType.strike_price) > 0 && (
                                    <span className="text-sm text-slate-400 line-through">
                                        Rp {Number(roomType.strike_price).toLocaleString('id-ID')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-6">
                            <p className="text-xs uppercase tracking-wider text-slate-400">
                                Deskripsi
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                                {roomType.description || 'Belum ada deskripsi.'}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <p className="text-xs uppercase tracking-wider text-slate-400">
                            Galeri Foto
                        </p>
                        {roomType.images.length === 0 ? (
                            <p className="mt-4 text-sm text-slate-500">
                                Belum ada foto untuk tipe kamar ini.
                            </p>
                        ) : (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {roomType.images.map((image, index) => (
                                    <div
                                        key={`${image.id}-${index}`}
                                        className="overflow-hidden rounded-xl border border-slate-200"
                                    >
                                        <img
                                            src={image.url}
                                            alt={`Foto ${roomType.name} ${index + 1}`}
                                            className="h-32 w-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
