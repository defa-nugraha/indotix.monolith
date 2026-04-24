<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Discovery\DiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscoveryController extends Controller
{
    public function __construct(private readonly DiscoveryService $discoveryService)
    {
    }

    public function index(Request $request, string $type): JsonResponse
    {
        $this->forceJsonResponse($request);

        return response()->json($this->discoveryService->listing($type, $request));
    }

    public function suggestions(Request $request, string $type): JsonResponse
    {
        $this->forceJsonResponse($request);

        return response()->json($this->discoveryService->suggestions($type, $request));
    }

    public function globalSuggestions(Request $request): JsonResponse
    {
        $this->forceJsonResponse($request);

        return response()->json($this->discoveryService->globalSuggestions($request));
    }

    public function filters(Request $request, string $type): JsonResponse
    {
        $this->forceJsonResponse($request);

        return response()->json($this->discoveryService->filters($type, $request));
    }

    public function metadata(): JsonResponse
    {
        return response()->json($this->discoveryService->metadata());
    }

    private function forceJsonResponse(Request $request): void
    {
        $request->headers->set('Accept', 'application/json');
    }
}
