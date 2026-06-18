<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MobileErrorLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MobileErrorLogController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
            'exception_type' => ['nullable', 'string', 'max:255'],
            'stack_trace' => ['nullable', 'string', 'max:20000'],
            'context' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'string', 'max:100'],
            'platform' => ['nullable', 'string', 'max:80'],
            'app_version' => ['nullable', 'string', 'max:80'],
            'build_number' => ['nullable', 'string', 'max:80'],
            'device' => ['nullable', 'array'],
            'extra' => ['nullable', 'array'],
            'fatal' => ['nullable', 'boolean'],
        ]);

        $user = $request->user('sanctum');

        $log = MobileErrorLog::create([
            ...$data,
            'user_id' => $user?->id,
            'fatal' => (bool) ($data['fatal'] ?? false),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
        ]);

        Log::warning('Mobile app error reported', [
            'mobile_error_log_id' => $log->id,
            'user_id' => $user?->id,
            'message' => $log->message,
            'exception_type' => $log->exception_type,
            'context' => $log->context,
            'platform' => $log->platform,
            'app_version' => $log->app_version,
            'fatal' => $log->fatal,
        ]);

        return response()->json([
            'message' => 'Error berhasil dicatat.',
            'id' => $log->id,
        ], 201);
    }
}
