@php
    $template = $template ?? [];
    $topLogoImages = collect($template['top_logo_images'] ?? [])->filter()->values()->all();
    $qrLogoImage = $template['qr_logo_image'] ?? null;
    $backgroundImage = $template['background_image'] ?? null;
    $playstoreImage = $template['playstore_image'] ?? null;
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
        @page { size: A4 portrait; margin: 0; }
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
            overflow: hidden;
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #0b2347;
            background: #ffffff;
        }
        .poster {
            position: fixed;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            overflow: hidden;
            background: #ffffff;
        }
        .frame {
            position: absolute;
            inset: 0;
            border: 3mm solid #116fd4;
        }
        .hero {
            position: absolute;
            top: 3mm;
            left: 3mm;
            width: 204mm;
            height: 108mm;
            overflow: hidden;
            background: #087bc9;
            color: #ffffff;
        }
        .hero-bg {
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            opacity: .34;
        }
        .logo-shell {
            position: absolute;
            top: 0;
            left: 0;
            width: 69mm;
            height: 27mm;
            padding: 6mm 8mm;
            background: #ffffff;
            border-bottom-right-radius: 16mm;
            color: #0785ca;
            font-size: 10mm;
            font-weight: bold;
        }
        .logo-shell img {
            display: inline-block;
            max-width: 46mm;
            max-height: 15mm;
            margin-right: 2mm;
            vertical-align: middle;
        }
        .scan-pill {
            position: absolute;
            top: 9mm;
            right: 9mm;
            padding: 4mm 8mm;
            border: .4mm solid #8ddcf5;
            border-radius: 10mm;
            background: #1167c8;
            font-size: 5.2mm;
            font-weight: bold;
        }
        .title-area {
            position: absolute;
            top: 39mm;
            left: 12mm;
            width: 160mm;
        }
        .title {
            margin: 0;
            max-height: 30mm;
            overflow: hidden;
            font-size: 12mm;
            line-height: 1.05;
            font-weight: bold;
            text-transform: uppercase;
        }
        .accent-line {
            width: 18mm;
            height: 1.5mm;
            margin-top: 5mm;
            background: #7de8ff;
        }
        .lead {
            width: 145mm;
            margin: 5mm 0 0;
            font-size: 5mm;
            line-height: 1.35;
        }
        .body-panel {
            position: absolute;
            top: 101mm;
            left: 3mm;
            width: 204mm;
            height: 162mm;
            border-top-left-radius: 16mm;
            border-top-right-radius: 16mm;
            background: #ffffff;
            text-align: center;
        }
        .qr-wrap {
            position: absolute;
            top: 12mm;
            left: 66mm;
            width: 72mm;
            height: 72mm;
            padding: 6mm;
            border: 1.3mm solid #1687e8;
            background: #ffffff;
        }
        .qr-wrap > img {
            display: block;
            width: 60mm;
            height: 60mm;
        }
        .qr-logo {
            position: absolute;
            top: 31mm;
            left: 31mm;
            width: 10mm;
            height: 10mm;
            padding: 1mm;
            background: #ffffff;
        }
        .qr-logo img { width: 8mm; height: 8mm; }
        .check {
            position: absolute;
            top: 76mm;
            left: 94mm;
            width: 16mm;
            height: 16mm;
            border-radius: 8mm;
            background: #0e85dc;
            color: #ffffff;
            font-size: 9mm;
            font-weight: bold;
            line-height: 16mm;
        }
        .main-copy {
            position: absolute;
            top: 105mm;
            left: 16mm;
            width: 172mm;
        }
        .main-copy h2 {
            margin: 0;
            color: #123a75;
            font-size: 5.5mm;
            line-height: 1.2;
        }
        .main-copy p {
            margin: 3mm auto 0;
            max-width: 145mm;
            color: #526987;
            font-size: 4mm;
            line-height: 1.4;
        }
        .promo {
            position: absolute;
            top: 135mm;
            left: 15mm;
            width: 174mm;
            height: 19mm;
            padding: 3mm 5mm;
            border: .35mm solid #dceffd;
            border-radius: 5mm;
            background: #f7fbff;
            text-align: left;
        }
        .site { color: #123a75; font-size: 4.3mm; font-weight: bold; }
        .download-copy { margin-top: 1mm; color: #64748b; font-size: 3.1mm; }
        .playstore {
            position: absolute;
            top: 4mm;
            right: 5mm;
            width: 35mm;
            max-height: 11mm;
        }
        .footer {
            position: absolute;
            top: 263mm;
            left: 3mm;
            width: 204mm;
            height: 31mm;
            background: #087dcc;
            color: #ffffff;
        }
        .footer table { width: 100%; height: 31mm; border-collapse: collapse; }
        .footer td {
            width: 33.333%;
            padding-top: 8mm;
            text-align: center;
            vertical-align: middle;
            font-size: 4.2mm;
            font-weight: bold;
        }
        .footer td + td { border-left: .3mm solid #8ddcf5; }
        .step-number {
            display: inline-block;
            width: 8mm;
            height: 8mm;
            margin-right: 2mm;
            border: .45mm solid #ffffff;
            border-radius: 4mm;
            line-height: 7mm;
            text-align: center;
        }
    </style>
</head>
<body>
    <main class="poster">
        <section class="hero">
            @if($backgroundImage)
                <img src="{{ $backgroundImage }}" alt="" class="hero-bg">
            @endif
            <div class="logo-shell">
                @forelse($topLogoImages as $topLogoImage)
                    <img src="{{ $topLogoImage }}" alt="Logo">
                @empty
                    indotix
                @endforelse
            </div>
            <div class="scan-pill">{{ $scanLabel }}</div>
            <div class="title-area">
                <h1 class="title">{{ $destinationName }}</h1>
                <div class="accent-line"></div>
                <p class="lead">{{ $leadText }}</p>
            </div>
        </section>

        <section class="body-panel">
            <div class="qr-wrap">
                <img src="{{ $qrImage }}" alt="QR masuk wisata">
                @if($qrLogoImage)
                    <span class="qr-logo"><img src="{{ $qrLogoImage }}" alt=""></span>
                @endif
            </div>
            <div class="check">&#10003;</div>

            <div class="main-copy">
                <h2>&gt;&gt; {{ $mainTitle }} &lt;&lt;</h2>
                <p>{{ $mainDescription }}</p>
            </div>

            <div class="promo">
                <div class="site">{{ $websiteLabel }}</div>
                <div class="download-copy">Download aplikasi Indotix</div>
                @if($playstoreImage)
                    <img src="{{ $playstoreImage }}" alt="Google Play" class="playstore">
                @endif
            </div>
        </section>

        <footer class="footer">
            <table>
                <tr>
                    @foreach($footerSteps as $index => $step)
                        <td><span class="step-number">{{ $index + 1 }}</span>{{ $step }}</td>
                    @endforeach
                </tr>
            </table>
        </footer>
        <div class="frame"></div>
    </main>
</body>
</html>
