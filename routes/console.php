<?php

use App\Models\User;
use App\Services\LegacyDatabaseCleanupService;
use App\Services\RetiredSchemaCleanupService;
use App\Services\WisataPaymentLifecycleService;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('indotix:cleanup-legacy-database
    {--mode=preview : Cleanup mode: preview or execute}
    {--plan-id= : Cleanup plan ID returned by preview}
    {--confirmation= : Required execute confirmation string}
    {--admin-id= : Required Admin Utama user ID recorded in audit log}
    {--json : Output machine-readable JSON}', function (LegacyDatabaseCleanupService $cleanup): int {
    $mode = (string) ($this->option('mode') ?: 'preview');
    $json = (bool) $this->option('json');
    $adminId = $this->option('admin-id') !== null ? (int) $this->option('admin-id') : null;

    if (! in_array($mode, ['preview', 'execute'], true)) {
        $this->error('Mode harus preview atau execute.');

        return 1;
    }

    if ($adminId === null) {
        $this->error('admin-id wajib diisi agar cleanup tercatat di audit log.');

        return 1;
    }

    $admin = User::query()->find($adminId);

    if (! $admin || $admin->role !== 'admin') {
        $this->error('admin-id harus mengarah ke akun Admin Utama yang valid.');

        return 1;
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

Artisan::command('indotix:drop-retired-schema
    {--mode=preview : Cleanup mode: preview or execute}
    {--plan-id= : Cleanup plan ID returned by preview}
    {--confirmation= : Required execute confirmation string}
    {--admin-id= : Required Admin Utama user ID recorded in audit log}
    {--allow-non-empty : Allow dropping retired tables that still contain records}
    {--json : Output machine-readable JSON}', function (RetiredSchemaCleanupService $cleanup): int {
    $mode = (string) ($this->option('mode') ?: 'preview');
    $json = (bool) $this->option('json');
    $adminId = $this->option('admin-id') !== null ? (int) $this->option('admin-id') : null;

    if (! in_array($mode, ['preview', 'execute'], true)) {
        $this->error('Mode harus preview atau execute.');

        return 1;
    }

    if ($adminId === null) {
        $this->error('admin-id wajib diisi agar drop schema tercatat di audit log.');

        return 1;
    }

    $admin = User::query()->find($adminId);

    if (! $admin || $admin->role !== 'admin') {
        $this->error('admin-id harus mengarah ke akun Admin Utama yang valid.');

        return 1;
    }

    if ($mode === 'execute') {
        if (! (bool) config('app.allow_database_schema_cleanup')) {
            $this->error('Execute diblokir. Set ALLOW_DATABASE_SCHEMA_CLEANUP=true lalu jalankan php artisan config:clear.');

            return 1;
        }

        if (! $this->option('plan-id')) {
            $this->error('Execute membutuhkan --plan-id dari hasil preview.');

            return 1;
        }

        if ($this->option('confirmation') !== RetiredSchemaCleanupService::CONFIRMATION) {
            $this->error('Confirmation salah. Gunakan --confirmation='.RetiredSchemaCleanupService::CONFIRMATION);

            return 1;
        }
    }

    try {
        $result = $mode === 'preview'
            ? $cleanup->preview($adminId)
            : $cleanup->execute((string) $this->option('plan-id'), $adminId, (bool) $this->option('allow-non-empty'));
    } catch (Throwable $exception) {
        $this->error($exception->getMessage() ?: 'Retired schema cleanup gagal.');

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
        $this->line('Execute confirmation: '.RetiredSchemaCleanupService::CONFIRMATION);
    }

    if (isset($result['summary'])) {
        $this->line('');
        $this->line('Summary:');
        $this->line(json_encode($result['summary'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    if (! empty($result['cleanup_plan'])) {
        $this->line('');
        $this->table(
            ['Table', 'Module', 'Records', 'Risk', 'Reason'],
            collect($result['cleanup_plan'])
                ->map(fn (array $item): array => [
                    $item['table'],
                    $item['module'],
                    $item['records'],
                    $item['risk'],
                    $item['reason'],
                ])
                ->all()
        );
    }

    return 0;
})->purpose('Preview or execute destructive drop of retired non-wisata schema tables');


Artisan::command('indotix:expire-wisata-payments {--limit=100}', function (WisataPaymentLifecycleService $payments): int {
    $count = $payments->expireDueBookings(max(1, (int) $this->option('limit')));
    $this->info("Expired/reconciled {$count} overdue wisata booking(s).");

    return 0;
})->purpose('Expire overdue Wisata payment reservations and synchronize Midtrans state');

Artisan::command('indotix:reconcile-wisata-payments {--limit=50}', function (WisataPaymentLifecycleService $payments): int {
    $count = $payments->reconcileRecentPayments(max(1, (int) $this->option('limit')));
    $this->info("Reconciled {$count} recent Wisata payment/refund record(s).");

    return 0;
})->purpose('Reconcile recent Wisata payment and refund state with Midtrans');

Schedule::command('indotix:expire-wisata-payments --limit=100')->everyMinute()->withoutOverlapping();
Schedule::command('indotix:reconcile-wisata-payments --limit=50')->everyFiveMinutes()->withoutOverlapping();
