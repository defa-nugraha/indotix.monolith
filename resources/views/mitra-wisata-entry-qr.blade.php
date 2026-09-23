@php
    $template = array_replace(\App\Support\WisataEntryQrTemplate::defaults(), $template ?? []);
    $logos = array_values(array_filter($template['top_logo_images'] ?? []));
    // All elements share the reference poster's 500 x 707 coordinate system.
    $mm = static fn (float $value) => round($value * 210 / 500, 4).'mm';
    $box = static fn ($x, $y, $w, $h) => 'left:'.$mm($x).';top:'.$mm($y).';width:'.$mm($w).';height:'.$mm($h).';';
    $fit = static function ($uri, $x, $y, $w, $h) use ($box) {
        $bytes = str_contains($uri, ',') ? base64_decode(explode(',', $uri, 2)[1], true) : false;
        $size = $bytes ? @getimagesizefromstring($bytes) : false;
        if ($size) {
            $scale = min($w / $size[0], $h / $size[1]);
            $nw = $size[0] * $scale;
            $nh = $size[1] * $scale;
            return $box($x + ($w - $nw) / 2, $y + ($h - $nh) / 2, $nw, $nh);
        }
        return $box($x, $y, $w, $h);
    };
    $art = view('partials.wisata-entry-qr-art')->render();
    $artUri = 'data:image/svg+xml;base64,'.base64_encode($art);
    $name = mb_strtoupper($destinationName ?: 'Destinasi Wisata');
    $titleSize = mb_strlen($name) > 48 ? 23 : (mb_strlen($name) > 30 ? 28 : 34);
    $steps = [$template['footer_step_one'], $template['footer_step_two'], $template['footer_step_three']];
@endphp
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>QR Masuk Wisata Indotix</title>
    <style>
        @page { size: A4 portrait; margin: 0; }
        html, body { margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; color: #004575; }
        .poster { position: fixed; top: 0; left: 0; width: 210mm; height: 297mm; }
        .item { position: absolute; margin: 0; padding: 0; }
        .white { color: #fff; }
        .bold { font-weight: bold; }
        .center { text-align: center; }
    </style>
</head>
<body>
<main class="poster">
    <img class="item" style="{{ $box(0, 0, 500, 707) }}" src="{{ $artUri }}" alt="">
    @if(!empty($template['background_image']))
        <img class="item" style="{{ $box(17, 14, 474, 269) }}" src="{{ $template['background_image'] }}" alt="">
    @endif
    {{-- Masks and frame are above the hero image so square image corners never escape. --}}
    <div class="item" style="{{ $box(17, 253, 474, 351) }}background:#fff;border-radius:{{ $mm(46) }} {{ $mm(46) }} 0 0;"></div>
    <div class="item" style="{{ $box(17, 13, 161, 43) }}background:#fff;border-bottom-right-radius:{{ $mm(44) }};"></div>
    @foreach($logos as $index => $logo)
        @php
            $slot = 132 / max(1, count($logos));
        @endphp
        <img class="item" src="{{ $logo }}" alt="Logo Indotix" style="{{ $fit($logo, 27 + $slot * $index, 20, $slot - 5, 28) }}">
    @endforeach
    <div class="item" style="{{ $box(244, 23, 225, 50) }}background:#0071c8;border:{{ $mm(1) }} solid #aeebff;border-radius:{{ $mm(26) }};"></div>
    <div class="item white bold center" style="{{ $box(295, 39, 167, 23) }}font-size:{{ $mm(18) }};line-height:1;">{{ $template['scan_label'] }}</div>
    <h1 class="item white bold" style="{{ $box(46, 82, 350, 76) }}font-size:{{ $mm($titleSize) }};line-height:1.02;overflow:hidden;">{{ $name }}</h1>
    <div class="item" style="{{ $box(46, 170, 70, 7) }}background:#7de8ff;border-radius:{{ $mm(4) }};"></div>
    <p class="item white" style="{{ $box(46, 198, 390, 48) }}font-size:{{ $mm(17.5) }};line-height:1.4;">{{ $template['lead_text'] }}</p>
    <div class="item" style="{{ $box(160, 276, 180, 188) }}background:#edf6fa;border-radius:{{ $mm(23) }};"></div>
    <div class="item" style="{{ $box(156, 270, 188, 188) }}background:#fff;border:{{ $mm(0.7) }} solid #edf4f8;border-radius:{{ $mm(23) }};"></div>
    <img class="item" src="{{ $qrImage }}" alt="QR masuk wisata" style="{{ $box(160, 274, 180, 180) }}">
    @if(!empty($template['qr_logo_image']))
        <div class="item" style="{{ $box(236, 350, 28, 28) }}background:#fff;border-radius:{{ $mm(5) }};"></div>
        <img class="item" src="{{ $template['qr_logo_image'] }}" alt="" style="{{ $fit($template['qr_logo_image'], 238, 352, 24, 24) }}">
    @endif
    <h2 class="item bold center" style="{{ $box(60, 474, 388, 27) }}font-size:{{ $mm(13.5) }};line-height:1.2;">
        <span style="color:#009add;">&gt; &gt;</span> {{ $template['main_title'] }} <span style="color:#009add;">&lt; &lt;</span>
    </h2>
    <p class="item center" style="{{ $box(81, 507, 346, 34) }}font-size:{{ $mm(11.5) }};line-height:1.35;">{{ $template['main_description'] }}</p>
    <div class="item" style="{{ $box(204, 540, 100, 7) }}background:#00d9e8;border-radius:{{ $mm(4) }};"></div>
    <div class="item" style="{{ $box(56, 549, 396, 49) }}background:#fff;border:{{ $mm(0.8) }} solid #d9f1ff;border-radius:{{ $mm(18) }};"></div>
    <div class="item bold" style="{{ $box(101, 560, 224, 16) }}font-size:{{ $mm(mb_strlen($template['website_label']) > 32 ? 9 : 13) }};">{{ $template['website_label'] }}</div>
    <div class="item" style="{{ $box(101, 580, 224, 12) }}font-size:{{ $mm(10) }};">Download aplikasi Indotix</div>
    @if(!empty($template['playstore_image']))
        <img class="item" src="{{ $template['playstore_image'] }}" alt="Google Play" style="{{ $fit($template['playstore_image'], 336, 560, 100, 30) }}">
    @endif
    @foreach($steps as $index => $step)
        <div class="item white bold" style="{{ $box(106 + $index * 143, 635, 87, 20) }}font-size:{{ $mm(11.5) }};line-height:1.2;">{{ $step }}</div>
    @endforeach
    <div class="item white center" style="{{ $box(105, 668, 290, 17) }}font-size:{{ $mm(14) }};line-height:1.1;">{{ $template['customer_service'] }}</div>
    <img class="item" style="{{ $box(0, 0, 500, 707) }}" src="data:image/svg+xml;base64,{{ base64_encode(view('partials.wisata-entry-qr-details')->render()) }}" alt="">
</main>
</body>
</html>
