import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { Bell, MessageCircle, ShoppingCart, UserCircle, History, BadgePercent } from 'lucide-react';

type Conversation = {
    id: number;
    partner: { id: number; name: string; role?: string | null };
    subject?: { label?: string; title?: string | null };
    last_message_at?: string | null;
    unread_count?: number;
};

type Message = {
    id: number;
    sender_id: number;
    body: string;
    created_at: string;
    is_me: boolean;
};

type Props = {
    conversations: Conversation[];
    activeConversation?: { id: number; subject?: { label?: string; title?: string | null } } | null;
    messages: Message[];
};

export default function ChatIndex({ conversations, activeConversation, messages }: Props) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_menu } = usePage().props as {
        auth?: { user?: { id?: number; role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
        affiliate_menu?: boolean;
    };
    const form = useForm({ message: '' });
    const listRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const activeId = activeConversation?.id ?? conversations[0]?.id;

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Live Chat" />

            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <Link href="/"><img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" /></Link>
                    </div>
                    <div className="flex flex-1 items-center">
                        <input
                            type="text"
                            placeholder="Cari kota/hotel/wisata/event..."
                            className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm shadow-sm focus:border-sky-400 focus:outline-none"
                        />
                    </div>
                    <Link href="/souvenir/cart" className="relative flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600">
                        <ShoppingCart className="h-4 w-4" />
                        Keranjang
                        {Boolean(souvenir_cart_count) && (
                            <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                                {souvenir_cart_count}
                            </span>
                        )}
                    </Link>
                    {auth?.user?.role === 'user' && (
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                            <Link href="/settings/profile" className="flex items-center gap-2 hover:text-sky-600">
                                <UserCircle className="h-4 w-4" />
                                Profile
                            </Link>
                            {affiliate_menu && (
                                <Link href="/affiliate" className="flex items-center gap-2 hover:text-sky-600">
                                    <BadgePercent className="h-4 w-4" />
                                    Afiliasi
                                </Link>
                            )}
                            <Link href="/history" className="flex items-center gap-2 hover:text-sky-600">
                                <History className="h-4 w-4" />
                                Riwayat
                            </Link>
                            <Link href="/chat" className="flex items-center gap-2 text-sky-600">
                                <MessageCircle className="h-4 w-4" />
                                Chat
                            </Link>
                            <Link href="/notifications" className="relative flex items-center gap-2 hover:text-sky-600">
                                <Bell className="h-4 w-4" />
                                Notifikasi
                                {Boolean(unread_notifications) && (
                                    <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                        {unread_notifications}
                                    </span>
                                )}
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900">Percakapan</div>
                            <Link
                                href="/chat/start/admin"
                                className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                            >
                                Chat Admin
                            </Link>
                        </div>
                        <div className="mt-4 space-y-2">
                            {conversations.length === 0 && (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                                    Belum ada chat. Mulai chat dengan admin atau mitra.
                                </div>
                            )}
                            {conversations.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/chat/${item.id}`}
                                    className={`flex flex-col gap-1 rounded-xl px-3 py-2 text-xs ${
                                        activeId === item.id ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold">{item.partner?.name ?? 'Customer Service'}</span>
                                        {Boolean(item.unread_count) && (
                                            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                {item.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        {item.subject?.label} {item.subject?.title ? `· ${item.subject.title}` : ''}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </aside>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        {!activeId && (
                            <div className="flex h-[420px] items-center justify-center text-sm text-slate-500">
                                Pilih percakapan untuk mulai chat.
                            </div>
                        )}
                        {activeId && (
                            <>
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">Live Chat</div>
                                        <div className="text-xs text-slate-500">{activeConversation?.subject?.label} {activeConversation?.subject?.title}</div>
                                    </div>
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Online</span>
                                </div>

                                <div ref={listRef} className="mt-4 h-[360px] overflow-y-auto pr-2">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`mb-3 flex ${msg.is_me ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                                                    msg.is_me ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                <div>{msg.body}</div>
                                                <div className={`mt-1 text-[10px] ${msg.is_me ? 'text-white/70' : 'text-slate-400'}`}>
                                                    {msg.created_at}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {messages.length === 0 && (
                                        <div className="text-center text-xs text-slate-400">Belum ada pesan.</div>
                                    )}
                                </div>

                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        if (!activeId) return;
                                        form.post(`/chat/${activeId}/messages`, {
                                            preserveScroll: true,
                                            onSuccess: () => form.reset('message'),
                                        });
                                    }}
                                    className="mt-4 flex items-center gap-2"
                                >
                                    <input
                                        value={form.data.message}
                                        onChange={(event) => form.setData('message', event.target.value)}
                                        className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                                        placeholder="Tulis pesan..."
                                    />
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-11 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                                    >
                                        Kirim
                                    </button>
                                </form>
                            </>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
