<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\LegacyDatabaseCleanupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DatabaseCleanupController extends Controller
{
    public function __invoke(Request $request, LegacyDatabaseCleanupService $cleanup): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);

        $data = $request->validate([
            'mode' => ['nullable', 'string', Rule::in(['preview', 'execute'])],
            'cleanup_plan_id' => ['required_if:mode,execute', 'nullable', 'string', 'max:128'],
            'confirmation' => ['required_if:mode,execute', 'nullable', 'string', Rule::in([LegacyDatabaseCleanupService::CONFIRMATION])],
        ]);

        $mode = $data['mode'] ?? 'preview';

        if ($mode === 'preview') {
            return response()->json($cleanup->preview($request->user()?->id));
        }

        abort_unless((bool) config('app.allow_database_cleanup'), 403, 'Database cleanup execute is disabled.');

        return response()->json(
            $cleanup->execute((string) $data['cleanup_plan_id'], $request->user()?->id)
        );
    }
}
