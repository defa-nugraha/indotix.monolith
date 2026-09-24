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
import { PublicFooter } from '@/components/public-footer';
import PublicLayout from '@/layouts/public-layout';
import { PublicSeo } from '@/components/public-seo';

type Contact = {
    id: number;
    name: string;
    contact: string;
    description: string | null;
    icon: string;
};
const iconMap: Record<string, LucideIcon> = {
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
    Link: Link2,
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
};

export default function ContactUsPage({ contacts }: { contacts: Contact[] }) {
    return (
        <PublicLayout categories={[]} chips={[]}>
            <PublicSeo
                title="Contact Us - Indotix"
                description="Hubungi Indotix melalui kanal layanan yang tersedia."
                canonicalPath="/contact-us"
            />
            <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
                    <p className="text-sm font-semibold tracking-wide text-sky-600 uppercase">
                        Indotix
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
                        Contact Us
                    </h1>
                    <p className="mt-3 max-w-2xl text-slate-600">
                        Kami siap membantu kebutuhan perjalanan dan layanan
                        wisata Anda.
                    </p>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        {contacts.map((contact) => {
                            const Icon = iconMap[contact.icon] ?? Phone;
                            return (
                                <div
                                    key={contact.id}
                                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-xl bg-sky-100 p-3 text-sky-700">
                                            <Icon className="size-6" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-slate-900">
                                                {contact.name}
                                            </h2>
                                            <p className="mt-1 break-words text-slate-700">
                                                {contact.contact}
                                            </p>
                                            {contact.description && (
                                                <p className="mt-2 text-sm text-slate-500">
                                                    {contact.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {contacts.length === 0 && (
                            <p className="text-sm text-slate-500">
                                Informasi kontak belum tersedia.
                            </p>
                        )}
                    </div>
                </div>
            </main>
            <PublicFooter />
        </PublicLayout>
    );
}
