<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\UserNotification;
use App\Services\ChatService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        $admin = $request->user();

        $conversations = ChatConversation::query()
            ->with(['user:id,name,role'])
            ->where('partner_id', $admin->id)
            ->orderByDesc('last_message_at')
            ->get();

        return $this->render($request, $conversations);
    }

    public function show(Request $request, ChatConversation $conversation): Response
    {
        $admin = $request->user();
        abort_unless($conversation->partner_id === $admin->id, 404);

        $conversations = ChatConversation::query()
            ->with(['user:id,name,role'])
            ->where('partner_id', $admin->id)
            ->orderByDesc('last_message_at')
            ->get();

        return $this->render($request, $conversations, $conversation);
    }

    public function store(Request $request, ChatConversation $conversation): RedirectResponse
    {
        $admin = $request->user();
        abort_unless($conversation->partner_id === $admin->id, 404);

        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $admin->id,
            'body' => $data['message'],
        ]);

        $conversation->forceFill(['last_message_at' => now()])->save();

        UserNotification::create([
            'user_id' => $conversation->user_id,
            'title' => 'Balasan dari admin',
            'message' => $data['message'],
            'type' => 'chat_admin_reply',
            'is_read' => false,
            'data' => [
                'conversation_id' => $conversation->id,
                'category' => 'chat',
            ],
        ]);

        return back();
    }

    private function render(Request $request, $conversations, ?ChatConversation $activeConversation = null): Response
    {
        $admin = $request->user();
        $active = $activeConversation ?? $conversations->first();

        $conversationPayload = $conversations->map(function (ChatConversation $conversation) use ($admin) {
            $title = ChatService::resolveSubjectTitle($conversation->subject_type ?? '', $conversation->subject_id);
            $unreadCount = ChatMessage::query()
                ->where('conversation_id', $conversation->id)
                ->whereNull('read_at')
                ->where('sender_id', '!=', $admin->id)
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
                ->where('sender_id', '!=', $admin->id)
                ->update(['read_at' => now()]);
        }

        return Inertia::render('admin/chat/index', [
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
                'is_me' => $message->sender_id === $admin->id,
            ]),
        ]);
    }
}
