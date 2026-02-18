<?php

namespace App\Http\Controllers\Api;

use App\Events\ChatMessageSent;
use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\UserNotification;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    private const SUPPORTED_TYPES = [
        'wisata',
        'hotel',
        'souvenir',
        'event',
        'academy',
        'special_program',
        'admin',
    ];

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $conversations = ChatConversation::query()
            ->with(['partner:id,name,role'])
            ->where('user_id', $user->id)
            ->orderByDesc('last_message_at')
            ->get()
            ->map(fn (ChatConversation $conversation) => $this->conversationPayload($conversation, $user->id))
            ->values();

        return response()->json([
            'conversations' => $conversations,
        ]);
    }

    public function start(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'in:' . implode(',', self::SUPPORTED_TYPES)],
            'id' => ['nullable', 'integer'],
        ]);

        $type = $data['type'];
        $subjectId = $data['id'] ?? null;

        if ($type !== 'admin' && $subjectId === null) {
            return response()->json(['message' => 'Produk chat tidak valid.'], 422);
        }

        $partnerId = ChatService::resolvePartnerId($type, $subjectId);
        if (! $partnerId) {
            return response()->json(['message' => 'Partner chat tidak tersedia.'], 422);
        }

        $user = $request->user();
        $conversation = ChatConversation::query()
            ->where('user_id', $user->id)
            ->where('partner_id', $partnerId)
            ->where('subject_type', $type)
            ->where('subject_id', $subjectId)
            ->first();

        if (! $conversation) {
            $conversation = ChatConversation::create([
                'user_id' => $user->id,
                'partner_id' => $partnerId,
                'subject_type' => $type,
                'subject_id' => $subjectId,
                'status' => 'open',
                'last_message_at' => now(),
            ]);
        }

        $conversation->loadMissing(['partner:id,name,role']);

        return response()->json([
            'conversation' => $this->conversationPayload($conversation, $user->id),
        ]);
    }

    public function show(Request $request, ChatConversation $conversation): JsonResponse
    {
        $user = $request->user();
        $this->authorizeConversation($conversation, $user->id);

        $perPage = (int) $request->query('per_page', 30);
        $perPage = max(1, min($perPage, 100));

        $messages = $conversation->messages()
            ->orderByDesc('id')
            ->limit($perPage)
            ->get()
            ->reverse()
            ->values();

        $this->markConversationRead($conversation, $user->id);

        return response()->json([
            'conversation' => $this->conversationPayload($conversation->loadMissing(['partner:id,name,role']), $user->id),
            'messages' => $messages->map(fn (ChatMessage $message) => $this->messagePayload($message, $user->id)),
        ]);
    }

    public function messages(Request $request, ChatConversation $conversation): JsonResponse
    {
        $user = $request->user();
        $this->authorizeConversation($conversation, $user->id);

        $perPage = (int) $request->query('per_page', 50);
        $perPage = max(1, min($perPage, 100));
        $afterId = $request->query('after_id');

        $query = $conversation->messages()->orderBy('id');
        if ($afterId) {
            $query->where('id', '>', (int) $afterId);
        }

        $messages = $query->limit($perPage)->get();
        $this->markConversationRead($conversation, $user->id);

        return response()->json([
            'messages' => $messages->map(fn (ChatMessage $message) => $this->messagePayload($message, $user->id)),
        ]);
    }

    public function store(Request $request, ChatConversation $conversation): JsonResponse
    {
        $user = $request->user();
        $this->authorizeConversation($conversation, $user->id);

        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'body' => $data['message'],
        ]);

        $conversation->forceFill(['last_message_at' => now()])->save();

        broadcast(new ChatMessageSent($message))->toOthers();

        $recipientId = $conversation->user_id === $user->id ? $conversation->partner_id : $conversation->user_id;
        if ($recipientId) {
            UserNotification::create([
                'user_id' => $recipientId,
                'title' => 'Pesan chat baru',
                'message' => $data['message'],
                'type' => 'chat_new_message',
                'is_read' => false,
                'data' => [
                    'conversation_id' => $conversation->id,
                    'category' => 'chat',
                ],
            ]);
        }

        return response()->json([
            'message' => $this->messagePayload($message, $user->id),
        ]);
    }

    public function markRead(Request $request, ChatConversation $conversation): JsonResponse
    {
        $user = $request->user();
        $this->authorizeConversation($conversation, $user->id);

        $updated = $this->markConversationRead($conversation, $user->id);

        return response()->json([
            'updated' => $updated,
        ]);
    }

    private function authorizeConversation(ChatConversation $conversation, int $userId): void
    {
        abort_unless((int) $conversation->user_id === (int) $userId, 404);
    }

    private function conversationPayload(ChatConversation $conversation, int $userId): array
    {
        $unreadCount = ChatMessage::query()
            ->where('conversation_id', $conversation->id)
            ->whereNull('read_at')
            ->where('sender_id', '!=', $userId)
            ->count();

        return [
            'id' => $conversation->id,
            'partner' => [
                'id' => $conversation->partner?->id,
                'name' => $conversation->partner?->name ?? 'Customer Service',
                'role' => $conversation->partner?->role ?? 'admin',
            ],
            'subject' => [
                'type' => $conversation->subject_type,
                'label' => ChatService::subjectLabel($conversation->subject_type),
                'title' => ChatService::resolveSubjectTitle($conversation->subject_type ?? '', $conversation->subject_id),
            ],
            'last_message_at' => optional($conversation->last_message_at)->toDateTimeString(),
            'unread_count' => $unreadCount,
        ];
    }

    private function messagePayload(ChatMessage $message, int $userId): array
    {
        return [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_id' => $message->sender_id,
            'body' => $message->body,
            'created_at' => $message->created_at?->toDateTimeString(),
            'is_me' => (int) $message->sender_id === (int) $userId,
            'read_at' => $message->read_at?->toDateTimeString(),
        ];
    }

    private function markConversationRead(ChatConversation $conversation, int $userId): int
    {
        return ChatMessage::query()
            ->where('conversation_id', $conversation->id)
            ->whereNull('read_at')
            ->where('sender_id', '!=', $userId)
            ->update(['read_at' => now()]);
    }
}
