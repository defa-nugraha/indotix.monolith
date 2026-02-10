<?php

namespace App\Http\Controllers;

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
    public function index(Request $request): Response
    {
        $user = $request->user();

        $conversations = ChatConversation::query()
            ->with(['partner:id,name,role'])
            ->where('user_id', $user->id)
            ->orderByDesc('last_message_at')
            ->get();

        return $this->render($request, $conversations);
    }

    public function show(Request $request, ChatConversation $conversation): Response
    {
        $user = $request->user();
        abort_unless($conversation->user_id === $user->id || $conversation->partner_id === $user->id, 404);

        $conversations = ChatConversation::query()
            ->with(['partner:id,name,role'])
            ->where('user_id', $user->id)
            ->orderByDesc('last_message_at')
            ->get();

        return $this->render($request, $conversations, $conversation);
    }

    public function start(Request $request, string $type, ?int $id = null): RedirectResponse
    {
        $user = $request->user();
        $partnerId = ChatService::resolvePartnerId($type, $id);

        if (! $partnerId) {
            return back()->withErrors(['chat' => 'Partner chat tidak tersedia.']);
        }

        $conversation = ChatConversation::query()
            ->where('user_id', $user->id)
            ->where('partner_id', $partnerId)
            ->where('subject_type', $type)
            ->where('subject_id', $id)
            ->first();

        if (! $conversation) {
            $conversation = ChatConversation::create([
                'user_id' => $user->id,
                'partner_id' => $partnerId,
                'subject_type' => $type,
                'subject_id' => $id,
                'status' => 'open',
                'last_message_at' => now(),
            ]);
        }

        return redirect()->route('chat.show', $conversation);
    }

    public function store(Request $request, ChatConversation $conversation): RedirectResponse
    {
        $user = $request->user();
        abort_unless($conversation->user_id === $user->id || $conversation->partner_id === $user->id, 404);

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

        return back();
    }

    private function render(Request $request, $conversations, ?ChatConversation $activeConversation = null): Response
    {
        $user = $request->user();
        $active = $activeConversation ?? $conversations->first();

        $conversationPayload = $conversations->map(function (ChatConversation $conversation) use ($user) {
            $title = ChatService::resolveSubjectTitle($conversation->subject_type ?? '', $conversation->subject_id);
            $unreadCount = ChatMessage::query()
                ->where('conversation_id', $conversation->id)
                ->whereNull('read_at')
                ->where('sender_id', '!=', $user->id)
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
                ->where('sender_id', '!=', $user->id)
                ->update(['read_at' => now()]);
        }

        return Inertia::render('chat/index', [
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
                'is_me' => $message->sender_id === $user->id,
            ]),
        ]);
    }
}
