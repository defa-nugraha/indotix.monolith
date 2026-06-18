<?php

namespace App\Services;

use App\Models\SystemSetting;

class MaintenanceMode
{
    public const ENABLED_KEY = 'maintenance_enabled';
    public const MESSAGE_KEY = 'maintenance_message';

    public const DEFAULT_MESSAGE = 'Sistem sedang dalam maintenance. Transaksi sementara tidak dapat dilakukan. Silakan coba lagi beberapa saat lagi.';

    public function isEnabled(): bool
    {
        $value = SystemSetting::query()
            ->where('key', self::ENABLED_KEY)
            ->value('value');

        return filter_var($value, FILTER_VALIDATE_BOOL);
    }

    public function message(): string
    {
        $message = SystemSetting::query()
            ->where('key', self::MESSAGE_KEY)
            ->value('value');

        return is_string($message) && trim($message) !== ''
            ? $message
            : self::DEFAULT_MESSAGE;
    }

    public function payload(): array
    {
        return [
            'enabled' => $this->isEnabled(),
            'message' => $this->message(),
        ];
    }
}
