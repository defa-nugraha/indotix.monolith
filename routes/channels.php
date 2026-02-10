<?php

use App\Models\ChatConversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.{conversationId}', function ($user, $conversationId) {
    $conversation = ChatConversation::query()->find($conversationId);
    if (! $conversation) {
        return false;
    }

    return (int) $conversation->user_id === (int) $user->id
        || (int) $conversation->partner_id === (int) $user->id;
});
