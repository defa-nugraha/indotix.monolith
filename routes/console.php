<?php

use App\Models\User;
use App\Services\LegacyDatabaseCleanupService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('indotix:cleanup-legacy-database
    {--mode=preview : Cleanup mode: preview or execute}
    {--plan-id= : Cleanup plan ID returned by preview}
    {--confirmation= : Required execute confirmation string}
    {--admin-id= : Optional admin user ID recorded in audit log}
    {--json : Output machine-readable JSON}', function (LegacyDatabaseCleanupService $cleanup): int {
        $mode = (string) ($this->option('mode') ?: 'preview');
        $json = (bool) $this->option('json');
        $adminId = $this->option('admin-id') !== null ? (int) $this->option('admin-id') : null;

        if (! in_array($mode, ['preview', 'execute'], true)) {
            $this->error('Mode harus preview atau execute.');

            return 1;
        }

        if ($adminId !== null) {
            $admin = User::query()->find($adminId);

            if (! $admin || $admin->role !== 'admin') {
                $this->error('admin-id harus mengarah ke akun Admin Utama yang valid.');

                return 1;
            }
        }

        if ($mode === 'execute') {
            if (! (bool) config('app.allow_database_cleanup')) {
                $this->error('Execute diblokir. Set ALLOW_DATABASE_CLEANUP=true lalu jalankan php artisan config:clear.');

                return 1;
            }

            if (! $this->option('plan-id')) {
                $this->error('Execute membutuhkan --plan-id dari hasil preview.');

                return 1;
            }

            if ($this->option('confirmation') !== LegacyDatabaseCleanupService::CONFIRMATION) {
                $this->error('Confirmation salah. Gunakan --confirmation='.LegacyDatabaseCleanupService::CONFIRMATION);

                return 1;
            }
        }

        try {
            $result = $mode === 'preview'
                ? $cleanup->preview($adminId)
                : $cleanup->execute((string) $this->option('plan-id'), $adminId);
        } catch (Throwable $exception) {
            $this->error($exception->getMessage() ?: 'Legacy database cleanup gagal.');

            return 1;
        }

        if ($json) {
            $this->line(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            return 0;
        }

        $this->info((string) $result['message']);
        $this->line('Mode: '.$result['mode']);

        if (isset($result['cleanup_plan_id'])) {
            $this->line('Cleanup Plan ID: '.$result['cleanup_plan_id']);
            $this->line('Execute confirmation: '.LegacyDatabaseCleanupService::CONFIRMATION);
        }

        if (isset($result['summary'])) {
            $this->line('');
            $this->line('Summary:');
            $this->line(json_encode($result['summary'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        if (! empty($result['cleanup_plan'])) {
            $this->line('');
            $this->table(
                ['Table', 'Action', 'Candidates', 'Retained', 'Risk', 'Reason'],
                collect($result['cleanup_plan'])
                    ->map(fn (array $item): array => [
                        $item['table'],
                        $item['action'],
                        $item['records'],
                        $item['retained_records'],
                        $item['risk'],
                        $item['reason'],
                    ])
                    ->all()
            );
        }

        return 0;
    })->purpose('Preview or execute safe legacy Hotel/Event database cleanup for Indotix Wisata focus');
