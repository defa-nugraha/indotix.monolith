<svg xmlns="http://www.w3.org/2000/svg" width="500" height="707" viewBox="0 0 500 707">
    <rect width="500" height="707" fill="white"/>
    {{-- Solid vector strips reproduce gradients in Dompdf without CSS/SVG gradient support. --}}
    @for($x = 17; $x < 491; $x += 2)
        @php
            $t = ($x - 17) / 474;
            $color = sprintf('#%02x%02x%02x', 0, (int) (115 + 91 * $t), (int) (205 + 11 * $t));
        @endphp
        <rect x="{{ $x }}" y="14" width="2.1" height="269" fill="{{ $color }}"/>
        <rect x="{{ $x }}" y="604" width="2.1" height="85" fill="{{ $color }}"/>
    @endfor
</svg>
