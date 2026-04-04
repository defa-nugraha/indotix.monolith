<?php

namespace App\Jobs;

use App\Services\PushNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendPushNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public int $userId,
        public string $title,
        public string $message,
        public array $data = [],
        public array $context = []
    ) {}

    public function handle(PushNotificationService $service): void
    {
        $context = array_merge($this->context, [
            'job_id' => $this->job?->getJobId(),
        ]);

        $service->sendToUser($this->userId, $this->title, $this->message, $this->data, $context);
    }
}
