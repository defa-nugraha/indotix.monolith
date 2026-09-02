<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\UserNotification;
use App\Services\ChatService;
use App\Events\ChatMessageSent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    private const ALLOWED_SUBJECT_TYPES = ['wisata', 'admin'];

    public function index(Request $request): Response
    {
        $mitra = $request->user();

        $conversations = $this->mitraConversations($mitra->id)->get();

        return $this->render($request, $conversations);
    }

    public function show(Request $request, ChatConversation $conversation): Response
    {
        $mitra = $request->user();
        $this->authorizeConversation($conversation, $mitra->id);

        $conversations = $this->mitraConversations($mitra->id)->get();

        return $this->render($request, $conversations, $conversation);
    }

    public function store(Request $request, ChatConversation $conversation): RedirectResponse
    {
        $mitra = $request->user();
        $this->authorizeConversation($conversation, $mitra->id);

        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $mitra->id,
            'body' => $data['message'],
        ]);

        $conversation->forceFill(['last_message_at' => now()])->save();

        broadcast(new ChatMessageSent($message))->toOthers();

        UserNotification::create([
            'user_id' => $conversation->user_id,
            'title' => 'Balasan dari mitra',
            'message' => $data['message'],
            'type' => 'chat_mitra_reply',
            'is_read' => false,
            'data' => [
                'conversation_id' => $conversation->id,
                'category' => 'chat',
            ],
        ]);

        return back();
    }

    private function mitraConversations(int $mitraId)
    {
        return ChatConversation::query()
            ->with(['user:id,name,role'])
            ->where('partner_id', $mitraId)
            ->whereIn('subject_type', self::ALLOWED_SUBJECT_TYPES)
            ->orderByDesc('last_message_at');
    }

    private function authorizeConversation(ChatConversation $conversation, int $mitraId): void
    {
        abort_unless((int) $conversation->partner_id === $mitraId, 404);
        abort_unless(in_array($conversation->subject_type, self::ALLOWED_SUBJECT_TYPES, true), 404);
    }

    private function render(Request $request, $conversations, ?ChatConversation $activeConversation = null): Response
    {
        $mitra = $request->user();
        $active = $activeConversation ?? $conversations->first();

        $conversationPayload = $conversations->map(function (ChatConversation $conversation) use ($mitra) {
            $title = ChatService::resolveSubjectTitle($conversation->subject_type ?? '', $conversation->subject_id);
            $unreadCount = ChatMessage::query()
                ->where('conversation_id', $conversation->id)
                ->whereNull('read_at')
                ->where('sender_id', '!=', $mitra->id)
                ->count();

            return [
                'id' => $conversation->id,
                'user' => [
                    'id' => $conversation->user?->id,
                    'name' => $conversation->user?->name ?? 'User',
                ],
                'subject' => [
                    'type' => $conversation->subject_type,
                    'label' => ChatService::subjectLabel($conversation->subject_type),
                    'title' => $title,
                ],
                'last_message_at' => optional($conversation->last_message_at)->toDateTimeString(),
                'unread_count' => $unreadCount,
            ];
        })->values();

        $messages = collect();
        if ($active) {
            $messages = $active->messages()->orderBy('created_at')->get();
            ChatMessage::query()
                ->where('conversation_id', $active->id)
                ->whereNull('read_at')
                ->where('sender_id', '!=', $mitra->id)
                ->update(['read_at' => now()]);
        }

        return Inertia::render('mitra/chat/index', [
            'conversations' => $conversationPayload,
            'activeConversation' => $active ? [
                'id' => $active->id,
                'subject' => [
                    'type' => $active->subject_type,
                    'label' => ChatService::subjectLabel($active->subject_type),
                    'title' => ChatService::resolveSubjectTitle($active->subject_type ?? '', $active->subject_id),
                ],
            ] : null,
            'messages' => $messages->map(fn (ChatMessage $message) => [
                'id' => $message->id,
                'sender_id' => $message->sender_id,
                'body' => $message->body,
                'created_at' => $message->created_at->toDateTimeString(),
                'is_me' => $message->sender_id === $mitra->id,
            ]),
        ]);
    }
}
