<?php

use App\Models\User;
use App\Services\RetiredSchemaCleanupService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\HttpException;

uses(RefreshDatabase::class);

function retiredSchemaAdminUser(): User
{
    return User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
}

function retiredSchemaTestService(): RetiredSchemaCleanupService
{
    return new class extends RetiredSchemaCleanupService
    {
        protected function retiredTables(): array
        {
            return [
                ['table' => 'retired_schema_children', 'module' => 'test', 'risk' => 'LOW', 'reason' => 'Test child table.'],
                ['table' => 'retired_schema_parents', 'module' => 'test', 'risk' => 'LOW', 'reason' => 'Test parent table.'],
            ];
        }
    };
}

function createRetiredSchemaTestTables(): void
{
    Schema::create('retired_schema_parents', function (Blueprint $table): void {
        $table->id();
        $table->string('name');
        $table->timestamps();
    });

    Schema::create('retired_schema_children', function (Blueprint $table): void {
        $table->id();
        $table->foreignId('parent_id')->constrained('retired_schema_parents')->cascadeOnDelete();
        $table->string('name');
        $table->timestamps();
    });
}

test('retired schema cleanup command requires valid admin identity and execute guard', function () {
    $admin = retiredSchemaAdminUser();

    expect(Artisan::call('indotix:drop-retired-schema', [
        '--mode' => 'invalid',
        '--json' => true,
    ]))->toBe(1)
        ->and(Artisan::call('indotix:drop-retired-schema', [
            '--mode' => 'preview',
            '--json' => true,
        ]))->toBe(1)
        ->and(Artisan::call('indotix:drop-retired-schema', [
            '--mode' => 'preview',
            '--admin-id' => User::factory()->create(['role' => 'user'])->id,
            '--json' => true,
        ]))->toBe(1);

    expect(Artisan::call('indotix:drop-retired-schema', [
        '--mode' => 'preview',
        '--admin-id' => $admin->id,
        '--json' => true,
    ]))->toBe(0);

    $preview = json_decode(Artisan::output(), true);

    expect(Artisan::call('indotix:drop-retired-schema', [
        '--mode' => 'execute',
        '--plan-id' => $preview['cleanup_plan_id'],
        '--confirmation' => RetiredSchemaCleanupService::CONFIRMATION,
        '--admin-id' => $admin->id,
        '--json' => true,
    ]))->toBe(1);
});

test('retired schema cleanup preview records table counts without dropping schema', function () {
    createRetiredSchemaTestTables();
    DB::table('retired_schema_parents')->insert([
        'id' => 1,
        'name' => 'Legacy Parent',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $service = retiredSchemaTestService();
    $admin = retiredSchemaAdminUser();

    $preview = $service->preview($admin->id);

    expect($preview['summary']['tables_candidate'])->toBe(2)
        ->and($preview['summary']['records_in_candidate_tables'])->toBe(1)
        ->and($preview['summary']['non_empty_tables'])->toBe(['retired_schema_parents'])
        ->and(Schema::hasTable('retired_schema_parents'))->toBeTrue()
        ->and(Schema::hasTable('retired_schema_children'))->toBeTrue();
});

test('retired schema cleanup blocks non empty tables unless explicitly allowed', function () {
    Storage::fake('local');
    createRetiredSchemaTestTables();
    DB::table('retired_schema_parents')->insert([
        'id' => 1,
        'name' => 'Legacy Parent',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $service = retiredSchemaTestService();
    $admin = retiredSchemaAdminUser();
    $preview = $service->preview($admin->id);

    expect(fn () => $service->execute($preview['cleanup_plan_id'], $admin->id))
        ->toThrow(HttpException::class);

    expect(Schema::hasTable('retired_schema_parents'))->toBeTrue()
        ->and(Schema::hasTable('retired_schema_children'))->toBeTrue();
});

test('retired schema cleanup drops tables and stores backup when confirmed', function () {
    Storage::fake('local');
    createRetiredSchemaTestTables();
    DB::table('retired_schema_parents')->insert([
        'id' => 1,
        'name' => 'Legacy Parent',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('retired_schema_children')->insert([
        'id' => 1,
        'parent_id' => 1,
        'name' => 'Legacy Child',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $service = retiredSchemaTestService();
    $admin = retiredSchemaAdminUser();
    $preview = $service->preview($admin->id);
    $result = $service->execute($preview['cleanup_plan_id'], $admin->id, allowNonEmpty: true);

    expect($result['summary']['tables_dropped'])->toBe(2)
        ->and($result['summary']['dropped_tables'])->toBe(['retired_schema_children', 'retired_schema_parents'])
        ->and(Schema::hasTable('retired_schema_parents'))->toBeFalse()
        ->and(Schema::hasTable('retired_schema_children'))->toBeFalse();

    Storage::disk('local')->assertExists($result['summary']['backup_path']);
});
