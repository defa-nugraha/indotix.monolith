<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'midtrans' => [
        'server_key' => env('MIDTRANS_SERVER_KEY'),
        'client_key' => env('MIDTRANS_CLIENT_KEY'),
        'merchant_id' => env('MIDTRANS_MERCHANT_ID'),
        'currency' => env('MIDTRANS_CURRENCY', 'IDR'),
        'is_production' => env('MIDTRANS_IS_PRODUCTION', false),
        'connect_timeout' => (int) env('MIDTRANS_CONNECT_TIMEOUT', 5),
        'timeout' => (int) env('MIDTRANS_TIMEOUT', 20),
    ],
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],
    'fcm' => [
        'project_id' => env('FCM_PROJECT_ID'),
        'service_account' => env('FCM_SERVICE_ACCOUNT'),
    ],

    'passkeys' => [
        'rp_id' => env('PASSKEY_RP_ID', parse_url((string) env('APP_URL', 'https://indotix.co.id'), PHP_URL_HOST) ?: 'indotix.co.id'),
        'rp_name' => env('PASSKEY_RP_NAME', 'Indotix'),
        'origins' => array_values(array_filter(array_map(
            'trim',
            explode(',', env('PASSKEY_ALLOWED_ORIGINS', env('APP_URL', 'https://indotix.co.id')))
        ))),
        'android_package' => env('PASSKEY_ANDROID_PACKAGE', 'com.indotix'),
        'android_cert_fingerprints' => array_values(array_filter(array_map(
            'trim',
            explode(',', env('PASSKEY_ANDROID_CERT_FINGERPRINTS', ''))
        ))),
        'apple_team_id' => env('PASSKEY_APPLE_TEAM_ID'),
        'ios_bundle_id' => env('PASSKEY_IOS_BUNDLE_ID', 'com.indotix'),
    ],

];
