<svg xmlns="http://www.w3.org/2000/svg" width="500" height="707" viewBox="0 0 500 707">
    <g fill="#abebff">
        @foreach([105, 360] as $start)
            @for($x = $start; $x <= $start + 45; $x += 15)
                @for($y = 325; $y <= 402; $y += 15)
                    <rect x="{{ $x }}" y="{{ $y }}" width="3" height="3"/>
                @endfor
            @endfor
        @endforeach
    </g>
    <g fill="none" stroke="#0095e6" stroke-width="5">
        <path d="M151 313v-27q0-24 24-24h24 M301 262h24q24 0 24 24v27 M151 404v34q0 24 24 24h24 M301 462h24q24 0 24-24v-34"/>
    </g>
    <g fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M268 44v-4h6 M281 40h5v4 M268 53v5h6 M281 58h5v-5 M274 49h6"/>
    </g>
    <g fill="none" stroke="#009cdb" stroke-width="1.5">
        <circle cx="81" cy="569" r="8"/>
        <path d="M74 568h4l2 3v5 M79 562v4l4 2 2-3 M87 571h-5l-1 5"/>
    </g>
    <path d="M17 555q22-5 39 9" fill="none" stroke="#e1f6ff" stroke-width="16"/>
    <path d="M433 604q11-24 58-23v23z" fill="#a2f3f8"/>
    <path d="M17 665q20-30 67-15 38 8 36 39H39q-22 0-22-24z" fill="#258ccc"/>
    <g fill="none" stroke="white" stroke-width=".8">
        <path d="M182 622v41 M325 622v41"/>
        <circle cx="84" cy="642" r="15"/><circle cx="227" cy="642" r="15"/><circle cx="370" cy="642" r="15"/>
    </g>
    <g fill="none" stroke="white" stroke-width="1.4" stroke-linejoin="round">
        <path d="M78 636h4v4h-4z M85 636h4v4h-4z M78 643h4v4h-4z M85 643h2v2h3v3h-5z"/>
        <path d="M221 638h12v3q-4 2 0 4v3h-12v-3q4-2 0-4z M226 640v6"/>
        <circle cx="370" cy="642" r="8"/><path d="m366 642 3 3 5-6"/>
    </g>
    {{-- White outside mask keeps every layer inside the rounded poster. --}}
    <path d="M0 0H500V707H0Z M43 10Q13 10 13 40V663Q13 693 43 693H464Q494 693 494 663V40Q494 10 464 10Z" fill="white" fill-rule="evenodd"/>
    <rect x="13" y="10" width="481" height="683" rx="30" fill="none" stroke="#007bce" stroke-width="6"/>
</svg>
