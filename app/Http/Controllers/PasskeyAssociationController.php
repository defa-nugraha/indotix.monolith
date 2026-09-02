<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class PasskeyAssociationController extends Controller
{
    public function assetLinks(): JsonResponse
    {
        return response()->json([
            [
                'relation' => [
                    'delegate_permission/common.handle_all_urls',
                    'delegate_permission/common.get_login_creds',
                ],
                'target' => [
                    'namespace' => 'android_app',
                    'package_name' => config('services.passkeys.android_package'),
                    'sha256_cert_fingerprints' => config('services.passkeys.android_cert_fingerprints', []),
                ],
            ],
        ])->header('Content-Type', 'application/json');
    }

    public function appleAppSiteAssociation(): JsonResponse
    {
        $teamId = config('services.passkeys.apple_team_id');
        $bundleId = config('services.passkeys.ios_bundle_id');
        $appId = $teamId ? "{$teamId}.{$bundleId}" : null;

        return response()->json([
            'webcredentials' => [
                'apps' => $appId ? [$appId] : [],
            ],
            'applinks' => [
                'apps' => [],
                'details' => $appId ? [
                    [
                        'appIDs' => [$appId],
                        'components' => [
                            ['/' => '/*'],
                        ],
                    ],
                ] : [],
            ],
        ])->header('Content-Type', 'application/json');
    }
}
