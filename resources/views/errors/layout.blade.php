<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ $code ?? 'Error' }} - {{ $title ?? 'Terjadi Kesalahan' }}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --ink: #0f172a;
                --muted: #5b6880;
                --accent: #0284c7;
                --accent-soft: #e0f2fe;
                --sky: #38bdf8;
                --sky-soft: #f0f9ff;
                --card: #ffffff;
            }
            * {
                box-sizing: border-box;
            }
            body {
                margin: 0;
                font-family: 'Poppins', 'Segoe UI', sans-serif;
                color: var(--ink);
                background: radial-gradient(circle at 20% 20%, #eef6ff 0%, #ffffff 45%, #f4f8ff 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 32px 20px;
            }
            .shell {
                position: relative;
                width: min(1100px, 100%);
                background: var(--card);
                border-radius: 32px;
                border: 1px solid #e0f2fe;
                box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
                overflow: hidden;
            }
            .glow {
                position: absolute;
                width: 320px;
                height: 320px;
                border-radius: 50%;
                background: rgba(14, 165, 233, 0.25);
                filter: blur(0);
                top: -120px;
                right: -80px;
                opacity: 0.5;
            }
            .glow.blue {
                background: rgba(56, 189, 248, 0.2);
                width: 280px;
                height: 280px;
                top: auto;
                bottom: -140px;
                left: -80px;
            }
            .content {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 32px;
                padding: 48px;
                align-items: center;
            }
            .badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 6px 16px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 600;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: var(--accent);
                background: var(--accent-soft);
            }
            .title {
                font-size: clamp(28px, 3vw, 40px);
                font-weight: 700;
                margin: 16px 0 12px;
            }
            .description {
                color: var(--muted);
                font-size: 15px;
                line-height: 1.6;
                margin: 0 0 24px;
            }
            .actions {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
            }
            .button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 12px 22px;
                border-radius: 999px;
                font-weight: 600;
                text-decoration: none;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                border: 1px solid transparent;
            }
            .button.primary {
                background: var(--accent);
                color: #ffffff;
                box-shadow: 0 12px 20px rgba(2, 132, 199, 0.25);
            }
            .button.secondary {
                background: #ffffff;
                color: var(--ink);
                border-color: #bae6fd;
            }
            .button:hover {
                transform: translateY(-1px);
                box-shadow: 0 16px 24px rgba(15, 23, 42, 0.12);
            }
            .illustration {
                width: 100%;
                max-width: 520px;
                justify-self: center;
            }
            .footer {
                margin-top: 28px;
                font-size: 12px;
                color: #94a3b8;
            }
            @media (max-width: 900px) {
                .content {
                    grid-template-columns: 1fr;
                    text-align: center;
                }
                .actions {
                    justify-content: center;
                }
            }
        </style>
    </head>
    <body>
        @php
            $code = $code ?? 'Error';
            $title = $title ?? 'Terjadi Kesalahan';
            $description = $description ?? 'Sepertinya ada masalah pada sistem kami. Silakan coba beberapa saat lagi.';
            $primaryAction = $primaryAction ?? ['label' => 'Kembali ke Beranda', 'url' => url('/')];
        @endphp

        <div class="shell">
            <div class="glow"></div>
            <div class="glow blue"></div>
            <div class="content">
                <div>
                    <div class="badge">Error {{ $code }}</div>
                    <h1 class="title">{{ $title }}</h1>
                    <p class="description">{{ $description }}</p>
                    <div class="actions">
                        <a class="button primary" href="{{ $primaryAction['url'] ?? url('/') }}">
                            {{ $primaryAction['label'] ?? 'Kembali ke Beranda' }}
                        </a>
                        @if (!empty($secondaryAction))
                            <a class="button secondary" href="{{ $secondaryAction['url'] ?? url('/') }}">
                                {{ $secondaryAction['label'] ?? 'Lihat Beranda' }}
                            </a>
                        @endif
                    </div>
                    <div class="footer">Indotix • Jika masalah berlanjut, hubungi tim support kami.</div>
                </div>
                <img class="illustration" src="{{ asset('images/11104.jpg') }}" alt="Ilustrasi kesalahan" />
            </div>
        </div>
    </body>
</html>
