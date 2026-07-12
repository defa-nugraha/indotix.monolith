import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type Conversation = {
    id: number;
    user: { id: number; name: string };
    subject?: { label?: string; title?: string | null };
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
    activeConversation?: {
        id: number;
        subject?: { label?: string; title?: string | null };
    } | null;
    messages: Message[];
};

export default function MitraChatIndex({
    conversations,
    activeConversation,
    messages,
}: Props) {
    const { auth } = usePage().props as { auth?: { user?: { id?: number } } };
    const form = useForm({ message: '' });
    const [localMessages, setLocalMessages] = useState<Message[]>(messages);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimerRef = useRef<number | null>(null);
    const typingSentRef = useRef(0);
    const channelRef = useRef<any>(null);
    const pollingRef = useRef<number | null>(null);
    const isAtBottomRef = useRef(true);
    const listRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!listRef.current) return;
        const node = listRef.current;
        if (isAtBottomRef.current) {
            node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
        }
    }, [localMessages]);

    useEffect(() => {
        setLocalMessages(messages);
    }, [messages]);

    const activeId = activeConversation?.id ?? conversations[0]?.id;

    useEffect(() => {
        const echo = (window as any).Echo;
        if (!activeId || !echo) return;

        const channel = echo.private(`chat.${activeId}`);
        channelRef.current = channel;
        channel.listen('.chat.message', (event: any) => {
            setLocalMessages((prev) => [
                ...prev,
                {
                    id: event.id,
                    sender_id: event.sender_id,
                    body: event.body,
                    created_at: event.created_at,
                    is_me: event.sender_id === auth?.user?.id,
                },
            ]);
            if (event.sender_id !== auth?.user?.id) {
                setIsTyping(false);
            }
        });
        channel.listenForWhisper('typing', (event: any) => {
            if (event?.user_id && event.user_id === auth?.user?.id) return;
            setIsTyping(true);
            if (typingTimerRef.current) {
                window.clearTimeout(typingTimerRef.current);
            }
            typingTimerRef.current = window.setTimeout(
                () => setIsTyping(false),
                1500,
            );
        });

        return () => {
            echo.leave(`chat.${activeId}`);
        };
    }, [activeId, auth?.user?.id]);

    useEffect(() => {
        const echo = (window as any).Echo;
        const connection = echo?.connector?.pusher?.connection;

        const startPolling = () => {
            if (pollingRef.current) return;
            pollingRef.current = window.setInterval(() => {
                router.reload({ only: ['messages', 'conversations'] });
            }, 1000);
        };

        const stopPolling = () => {
            if (pollingRef.current) {
                window.clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };

        if (!connection) {
            startPolling();
            return () => stopPolling();
        }

        const handleConnected = () => stopPolling();
        const handleDisconnected = () => startPolling();

        if (connection.state === 'connected') {
            stopPolling();
        } else {
            startPolling();
        }

        connection.bind('connected', handleConnected);
        connection.bind('disconnected', handleDisconnected);
        connection.bind('unavailable', handleDisconnected);
        connection.bind('failed', handleDisconnected);

        return () => {
            connection.unbind('connected', handleConnected);
            connection.unbind('disconnected', handleDisconnected);
            connection.unbind('unavailable', handleDisconnected);
            connection.unbind('failed', handleDisconnected);
            stopPolling();
        };
    }, []);
    return (
        <>
            <Head title="Live Chat Mitra" />
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900">
                        Percakapan
                    </div>
                    <div className="mt-4 space-y-2">
                        {conversations.length === 0 && (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                                Belum ada chat masuk.
                            </div>
                        )}
                        {conversations.map((item) => (
                            <Link
                                key={item.id}
                                href={`/mitra/chat/${item.id}`}
                                className={`flex flex-col gap-1 rounded-xl px-3 py-2 text-xs ${
                                    activeId === item.id
                                        ? 'bg-sky-50 text-sky-700'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold">
                                        {item.user?.name ?? 'User'}
                                    </span>
                                    {Boolean(item.unread_count) && (
                                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                            {item.unread_count}
                                        </span>
                                    )}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                    {item.subject?.label}{' '}
                                    {item.subject?.title
                                        ? `· ${item.subject.title}`
                                        : ''}
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
                                    <div className="text-sm font-semibold text-slate-900">
                                        Live Chat
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {activeConversation?.subject?.label}{' '}
                                        {activeConversation?.subject?.title}
                                    </div>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    Online
                                </span>
                            </div>

                            <div
                                ref={listRef}
                                onScroll={(event) => {
                                    const node = event.currentTarget;
                                    const distance =
                                        node.scrollHeight -
                                        node.scrollTop -
                                        node.clientHeight;
                                    isAtBottomRef.current = distance < 120;
                                }}
                                className="mt-4 h-[360px] overflow-y-auto pr-2"
                            >
                                {localMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`mb-3 flex ${msg.is_me ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                                                msg.is_me
                                                    ? 'bg-sky-600 text-white'
                                                    : 'bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            <div>{msg.body}</div>
                                            <div
                                                className={`mt-1 text-[10px] ${msg.is_me ? 'text-white/70' : 'text-slate-400'}`}
                                            >
                                                {msg.created_at}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="text-xs text-slate-400">
                                        Sedang mengetik...
                                    </div>
                                )}
                                {localMessages.length === 0 && (
                                    <div className="text-center text-xs text-slate-400">
                                        Belum ada pesan.
                                    </div>
                                )}
                            </div>

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    if (!activeId) return;
                                    form.post(
                                        `/mitra/chat/${activeId}/messages`,
                                        {
                                            preserveScroll: true,
                                            onSuccess: () =>
                                                form.reset('message'),
                                        },
                                    );
                                }}
                                className="mt-4 flex items-center gap-2"
                            >
                                <label className="grid flex-1 gap-1 text-xs font-medium text-slate-600">
                                    <span>Pesan</span>
                                    <input
                                        value={form.data.message}
                                        onChange={(event) => {
                                            form.setData(
                                                'message',
                                                event.target.value,
                                            );
                                            const now = Date.now();
                                            if (
                                                channelRef.current &&
                                                now - typingSentRef.current > 800
                                            ) {
                                                typingSentRef.current = now;
                                                channelRef.current.whisper(
                                                    'typing',
                                                    { user_id: auth?.user?.id },
                                                );
                                            }
                                        }}
                                        className="h-11 rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                                        placeholder="Tulis balasan..."
                                    />
                                </label>
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
        </>
    );
}

MitraChatIndex.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Live Chat', href: '/mitra/chat' }]}>
        {page}
    </AppLayout>
);
