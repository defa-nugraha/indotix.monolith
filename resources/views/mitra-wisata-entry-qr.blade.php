@php
    $template = $template ?? [];
    $topLogoImages = collect($template['top_logo_images'] ?? [$logoImage ?? null])->filter()->values()->all();
    $qrLogoImage = $template['qr_logo_image'] ?? ($logoImage ?? null);
    $mountainImage = $template['background_image'] ?? ($mountainImage ?? null);
    $playstoreImage = $template['playstore_image'] ?? ($playstoreImage ?? null);
    $scanLabel = $template['scan_label'] ?? 'Scan untuk Masuk';
    $leadText = $template['lead_text'] ?? 'Scan QR ini melalui menu Scan Tiket Indotix untuk memvalidasi tiket kunjungan Anda.';
    $mainTitle = $template['main_title'] ?? 'SATU QR UNTUK VALIDASI TIKET WISATA';
    $mainDescription = $template['main_description'] ?? 'Tempel QR ini di loket atau pintu masuk. User memilih tiket paid miliknya setelah scan.';
    $websiteLabel = $template['website_label'] ?? 'indotix.co.id';
    $footerSteps = [
        $template['footer_step_one'] ?? 'Scan QR',
        $template['footer_step_two'] ?? 'Pilih Tiket',
        $template['footer_step_three'] ?? 'Validasi',
    ];
@endphp
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>QR Masuk Wisata Indotix</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 0;
        }

        * {
            box-sizing: border-box;
        }

        html,
        body {
            margin: 0;
            width: 210mm;
            height: 297mm;
            font-family: Arial, Helvetica, sans-serif;
            background: #eef6ff;
            color: #0b2347;
        }

        .poster {
            position: relative;
            width: 210mm;
            height: 297mm;
            overflow: hidden;
            border: 3.2mm solid #116fd4;
            border-radius: 10mm;
            background: #ffffff;
        }

        .hero {
            position: absolute;
            inset: 0 0 auto;
            height: 40%;
            overflow: hidden;
            background: linear-gradient(135deg, #0b55c7 0%, #0487df 52%, #23d4e4 100%);
            color: #ffffff;
        }

        .hero::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
                linear-gradient(135deg, rgba(255, 255, 255, 0.06), transparent 48%);
        }

        .mountain {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 1;
        }

        .mountain-blend {
            display: none;
        }

        .logo-shell {
            position: absolute;
            top: 0;
            left: 0;
            width: 34%;
            height: 16%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 5mm 8mm;
            border-bottom-right-radius: 27mm;
            background: #ffffff;
            gap: 3mm;
        }

        .logo-shell img {
            max-width: 30%;
            max-height: 100%;
            object-fit: contain;
        }

        .logo-shell.single-logo img {
            max-width: 100%;
        }

        .scan-pill {
            position: absolute;
            top: 3.7%;
            right: 4.2%;
            display: inline-flex;
            align-items: center;
            gap: 4mm;
            padding: 4.2mm 9mm;
            border: .45mm solid rgba(255, 255, 255, .72);
            border-radius: 999px;
            background: rgba(20, 92, 207, .9);
            font-size: 6.6mm;
            font-weight: 800;
            line-height: 1;
        }

        .scan-icon {
            width: 8mm;
            height: 8mm;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .scan-icon svg {
            display: block;
            width: 100%;
            height: 100%;
        }

        .title-area {
            position: absolute;
            top: 18.7%;
            left: 6.1%;
            width: 78%;
            color: #ffffff;
        }

        .title {
            margin: 0;
            max-width: 100%;
            overflow: hidden;
            max-height: 29mm;
            white-space: normal;
            word-break: break-word;
            font-size: 13.8mm;
            font-weight: 900;
            line-height: 1.04;
            letter-spacing: .45mm;
            text-transform: uppercase;
            text-shadow: 0 3mm 5mm rgba(0, 20, 70, .2);
        }

        .accent-line {
            width: 15mm;
            height: 1.4mm;
            margin-top: 8mm;
            border-radius: 999px;
            background: #7de8ff;
        }

        .lead {
            width: 122mm;
            margin: 7.5mm 0 0;
            font-size: 6.25mm;
            line-height: 1.22;
            font-weight: 600;
        }

        .body-panel {
            position: absolute;
            inset: 35.5% 0 0;
            border-top-left-radius: 20mm;
            border-top-right-radius: 20mm;
            background: #ffffff;
            text-align: center;
        }

        .dots-left,
        .dots-right {
            position: absolute;
            top: 21%;
            width: 13%;
            height: 22%;
            opacity: .38;
            background-image: radial-gradient(#7ac4f0 1px, transparent 1.2px);
            background-size: 4mm 4mm;
        }

        .dots-left {
            left: 17%;
        }

        .dots-right {
            right: 17%;
        }

        .circle-left {
            position: absolute;
            left: -9%;
            bottom: 16%;
            width: 23%;
            height: 20%;
            border: 5mm solid rgba(219, 242, 255, .82);
            border-radius: 999px;
        }

        .circle-right {
            position: absolute;
            right: -10%;
            bottom: 4%;
            width: 24%;
            height: 21%;
            border-radius: 999px;
            background: rgba(78, 221, 230, .46);
        }

        .qr-wrap {
            position: absolute;
            top: 9mm;
            left: 50%;
            width: 66mm;
            margin: 0;
            transform: translateX(-50%);
        }

        .corner {
            position: absolute;
            width: 12mm;
            height: 12mm;
            border-color: #1687e8;
            border-style: solid;
        }

        .corner.tl { top: -4mm; left: -4mm; border-width: 1.3mm 0 0 1.3mm; border-top-left-radius: 4mm; }
        .corner.tr { top: -4mm; right: -4mm; border-width: 1.3mm 1.3mm 0 0; border-top-right-radius: 4mm; }
        .corner.bl { bottom: -4mm; left: -4mm; border-width: 0 0 1.3mm 1.3mm; border-bottom-left-radius: 4mm; }
        .corner.br { right: -4mm; bottom: -4mm; border-width: 0 1.3mm 1.3mm 0; border-bottom-right-radius: 4mm; }

        .qr-card {
            position: relative;
            padding: 6mm;
            border-radius: 7mm;
            background: #ffffff;
            box-shadow: 0 8mm 15mm rgba(15, 23, 42, .18);
        }

        .qr-card img {
            display: block;
            width: 100%;
            aspect-ratio: 1 / 1;
        }

        .qr-logo {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 7mm;
            height: 7mm;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translate(-50%, -50%);
            border-radius: 2mm;
            background: #ffffff;
            box-shadow: 0 1.5mm 4mm rgba(15, 23, 42, .12);
            padding: .8mm;
        }

        .qr-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .check {
            position: absolute;
            left: 50%;
            bottom: -11mm;
            width: 15mm;
            height: 15mm;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translateX(-50%);
            border-radius: 6mm;
            background: linear-gradient(135deg, #66cdf6, #0e85dc);
            box-shadow: 0 5mm 9mm rgba(15, 23, 42, .2);
            color: #ffffff;
            font-size: 9mm;
            font-weight: 900;
        }

        .main-copy {
            position: absolute;
            right: 18mm;
            bottom: 65mm;
            left: 18mm;
            margin: 0 auto;
            width: auto;
            color: #123a75;
        }

        .main-copy h2 {
            margin: 0;
            font-size: 5.9mm;
            line-height: 1.15;
            font-weight: 900;
            letter-spacing: .25mm;
            text-transform: uppercase;
        }

        .chev {
            color: #1598e8;
            padding: 0 1mm;
        }

        .main-copy p {
            margin: 5mm auto 0;
            max-width: 128mm;
            color: #263b67;
            font-size: 4.6mm;
            line-height: 1.32;
        }

        .mini-line {
            width: 24mm;
            height: 1.5mm;
            margin: 6mm auto 0;
            border-radius: 999px;
            background: #67dff0;
        }

        .promo {
            position: absolute;
            right: 17mm;
            bottom: 43mm;
            left: 17mm;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 5mm;
            padding: 3mm 5mm;
            border: .35mm solid #dceffd;
            border-radius: 7mm;
            background: rgba(255, 255, 255, .94);
            box-shadow: 0 5mm 12mm rgba(15, 23, 42, .08);
            color: #123a75;
        }

        .promo-left {
            display: flex;
            align-items: center;
            gap: 3mm;
            min-width: 0;
        }

        .globe {
            width: 8mm;
            height: 8mm;
            border: .7mm solid #0284c7;
            border-radius: 999px;
            position: relative;
            flex: 0 0 auto;
        }

        .globe::before,
        .globe::after {
            content: "";
            position: absolute;
            border: .45mm solid #0284c7;
            border-radius: 999px;
        }

        .globe::before {
            inset: 1mm 2.4mm;
            border-top: 0;
            border-bottom: 0;
        }

        .globe::after {
            right: 1mm;
            left: 1mm;
            top: 3.35mm;
            height: 0;
            border-right: 0;
            border-left: 0;
        }

        .site {
            font-size: 4.4mm;
            font-weight: 900;
            line-height: 1.1;
        }

        .download-copy {
            margin-top: .6mm;
            color: #64748b;
            font-size: 3.3mm;
            font-weight: 700;
        }

        .playstore {
            width: 37mm;
            max-height: 11mm;
            object-fit: contain;
        }

        .footer {
            position: absolute;
            inset: auto 0 0;
            height: 12.5%;
            padding: 0 13mm;
            overflow: hidden;
            background: linear-gradient(90deg, #0c55be, #078ee4 54%, #2bd8df);
            color: #ffffff;
        }

        .footer::before {
            content: "";
            position: absolute;
            left: -3%;
            bottom: -42%;
            width: 25%;
            height: 95%;
            border-radius: 999px;
            background: rgba(255, 255, 255, .12);
        }

        .footer-items {
            position: relative;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 3mm;
            font-size: 4.2mm;
            font-weight: 800;
        }

        .footer-item {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3mm;
            flex: 1;
            white-space: nowrap;
        }

        .footer-icon {
            width: 8mm;
            height: 8mm;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: .65mm solid #ffffff;
            border-radius: 999px;
            background: rgba(255, 255, 255, .15);
        }

        .footer-icon svg {
            width: 5mm;
            height: 5mm;
            display: block;
        }

        .divider {
            height: 18mm;
            width: .4mm;
            background: rgba(255, 255, 255, .72);
        }
    </style>
</head>
<body>
    <main class="poster">
        <section class="hero">
            @if($mountainImage)
                <img src="{{ $mountainImage }}" alt="" class="mountain">
            @endif
            <div class="mountain-blend"></div>
            <div class="logo-shell {{ count($topLogoImages) <= 1 ? 'single-logo' : '' }}">
                @if(count($topLogoImages) > 0)
                    @foreach($topLogoImages as $topLogoImage)
                        <img src="{{ $topLogoImage }}" alt="Logo">
                    @endforeach
                @else
                    <strong>indotix</strong>
                @endif
            </div>
            <div class="scan-pill">
                <span class="scan-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        <path d="M7 12h10" />
                    </svg>
                </span>
                <span>{{ $scanLabel }}</span>
            </div>
            <div class="title-area">
                <h1 class="title">{{ $destinationName }}</h1>
                <div class="accent-line"></div>
                <p class="lead">{{ $leadText }}</p>
            </div>
        </section>

        <section class="body-panel">
            <div class="dots-left"></div>
            <div class="dots-right"></div>
            <div class="circle-left"></div>
            <div class="circle-right"></div>

            <div class="qr-wrap">
                <span class="corner tl"></span>
                <span class="corner tr"></span>
                <span class="corner bl"></span>
                <span class="corner br"></span>
                <div class="qr-card">
                    <img src="{{ $qrImage }}" alt="QR masuk wisata">
                    @if($qrLogoImage)
                        <span class="qr-logo">
                            <img src="{{ $qrLogoImage }}" alt="">
                        </span>
                    @endif
                </div>
                <div class="check">&#10003;</div>
            </div>

            <div class="main-copy">
                <h2><span class="chev">&gt;&gt;</span> {{ $mainTitle }} <span class="chev">&lt;&lt;</span></h2>
                <p>{{ $mainDescription }}</p>
                <div class="mini-line"></div>
            </div>

            <div class="promo">
                <div class="promo-left">
                    <span class="globe"></span>
                    <div>
                        <div class="site">{{ $websiteLabel }}</div>
                        <div class="download-copy">Download aplikasi Indotix</div>
                    </div>
                </div>
                @if($playstoreImage)
                    <img src="{{ $playstoreImage }}" alt="Google Play" class="playstore">
                @endif
            </div>
        </section>

        <footer class="footer">
            <div class="footer-items">
                <div class="footer-item">
                    <span class="footer-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <rect x="4" y="4" width="6" height="6" rx="1" />
                            <rect x="14" y="4" width="6" height="6" rx="1" />
                            <rect x="4" y="14" width="6" height="6" rx="1" />
                            <path d="M14 14h6v6h-6z" />
                        </svg>
                    </span>
                    <span>{{ $footerSteps[0] }}</span>
                </div>
                <div class="divider"></div>
                <div class="footer-item">
                    <span class="footer-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M3 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
                            <path d="M9 9h6" />
                            <path d="M9 15h6" />
                        </svg>
                    </span>
                    <span>{{ $footerSteps[1] }}</span>
                </div>
                <div class="divider"></div>
                <div class="footer-item">
                    <span class="footer-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    </span>
                    <span>{{ $footerSteps[2] }}</span>
                </div>
            </div>
        </footer>
    </main>
</body>
</html>
