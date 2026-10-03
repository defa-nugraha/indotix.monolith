<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#0f6fff">
    <title>Status Pembayaran | Indotix</title>
    <style>
        :root {
            color-scheme: light;
            --brand: #0f6fff;
            --brand-dark: #0758cf;
            --text: #10233f;
            --muted: #66758a;
            --surface: #ffffff;
            --background: #f5f8fc;
            --border: #e6edf5;
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            min-height: 100vh;
            background:
                radial-gradient(circle at 50% 0%, rgba(15, 111, 255, .12), transparent 34%),
                var(--background);
            color: var(--text);
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        main {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 28px 18px;
        }

        .card {
            width: min(100%, 520px);
            padding: 42px 34px 34px;
            background: rgba(255, 255, 255, .96);
            border: 1px solid var(--border);
            border-radius: 28px;
            box-shadow: 0 22px 70px rgba(16, 35, 63, .10);
            text-align: center;
            animation: card-in .55s ease-out both;
        }

        .brand {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 26px;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -.02em;
        }

        .brand-mark {
            width: 30px;
            height: 30px;
            display: grid;
            place-items: center;
            border-radius: 9px;
            background: var(--brand);
            color: #fff;
            font-size: 15px;
            font-weight: 900;
        }

        .status-icon {
            width: 112px;
            height: 112px;
            margin: 0 auto 26px;
        }

        .status-icon svg {
            width: 100%;
            height: 100%;
            overflow: visible;
        }

        .ring {
            fill: none;
            stroke-width: 5;
            stroke-linecap: round;
            stroke-dasharray: 314;
            stroke-dashoffset: 314;
            animation: draw-ring .8s .1s ease-out forwards;
        }

        .mark {
            fill: none;
            stroke-width: 6;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 90;
            stroke-dashoffset: 90;
            animation: draw-mark .55s .65s cubic-bezier(.65, 0, .35, 1) forwards;
        }

        .spin {
            transform-origin: 56px 56px;
            animation: spin 1.15s linear infinite;
        }

        .pulse {
            animation: pulse 1.8s ease-in-out infinite;
            transform-origin: 56px 56px;
        }

        h1 {
            margin: 0 0 12px;
            font-size: clamp(25px, 6vw, 32px);
            line-height: 1.15;
            letter-spacing: -.035em;
        }

        .message {
            max-width: 430px;
            margin: 0 auto;
            color: var(--muted);
            font-size: 15px;
            line-height: 1.7;
        }

        .reference {
            margin: 22px auto 0;
            padding: 12px 14px;
            width: min(100%, 420px);
            overflow-wrap: anywhere;
            border: 1px solid var(--border);
            border-radius: 14px;
            background: #f8fafc;
            color: #52627a;
            font-size: 12px;
        }

        .reference strong {
            display: block;
            margin-bottom: 4px;
            color: var(--text);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .08em;
        }

        .actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 28px;
            flex-wrap: wrap;
        }

        .button {
            min-width: 170px;
            min-height: 46px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 18px;
            border-radius: 13px;
            border: 1px solid var(--border);
            background: #fff;
            color: var(--text);
            text-decoration: none;
            font-size: 14px;
            font-weight: 750;
            transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
        }

        .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(16, 35, 63, .08);
        }

        .button.primary {
            border-color: var(--brand);
            background: var(--brand);
            color: #fff;
        }

        .button.primary:hover { background: var(--brand-dark); }

        .footnote {
            margin-top: 22px;
            color: #8794a7;
            font-size: 12px;
        }

        @keyframes card-in {
            from { opacity: 0; transform: translateY(12px) scale(.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes draw-ring { to { stroke-dashoffset: 0; } }
        @keyframes draw-mark { to { stroke-dashoffset: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.045); opacity: .82; }
        }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: .01ms !important;
                animation-iteration-count: 1 !important;
                scroll-behavior: auto !important;
            }
        }

        @media (max-width: 520px) {
            .card {
                padding: 34px 20px 26px;
                border-radius: 22px;
            }

            .status-icon {
                width: 96px;
                height: 96px;
            }

            .actions {
                flex-direction: column;
            }

            .button {
                width: 100%;
            }
        }
    </style>
</head>
<body>
<main>
    <section class="card" aria-live="polite">
        <div class="brand" aria-label="Indotix">
            <span class="brand-mark">i</span>
            <span>Indotix</span>
        </div>

        @if ($status === 'success')
            <div class="status-icon" aria-hidden="true">
                <svg viewBox="0 0 112 112">
                    <circle class="ring" cx="56" cy="56" r="50" stroke="#16a34a"></circle>
                    <path class="mark" d="M31 57.5 47 73 82 38" stroke="#16a34a"></path>
                </svg>
            </div>
            <h1>Pembayaran berhasil 🎉</h1>
            <p class="message">
                Pembayaran kamu sudah diterima dan tiket wisata telah aktif.
                Kamu bisa melihat detail tiket dari halaman riwayat.
            </p>
        @elseif ($status === 'failed')
            <div class="status-icon" aria-hidden="true">
                <svg viewBox="0 0 112 112">
                    <circle class="ring" cx="56" cy="56" r="50" stroke="#dc2626"></circle>
                    <path class="mark" d="M38 38 74 74M74 38 38 74" stroke="#dc2626"></path>
                </svg>
            </div>
            <h1>Pembayaran gagal</h1>
            <p class="message">
                Pembayaran belum berhasil diproses. Silakan kembali ke Indotix
                dan coba metode pembayaran lainnya jika tersedia.
            </p>
        @elseif ($status === 'cancelled')
            <div class="status-icon" aria-hidden="true">
                <svg viewBox="0 0 112 112">
                    <circle class="ring" cx="56" cy="56" r="50" stroke="#64748b"></circle>
                    <path class="mark" d="M37 56h38" stroke="#64748b"></path>
                </svg>
            </div>
            <h1>Pembayaran dibatalkan</h1>
            <p class="message">
                Transaksi ini dibatalkan dan tiket belum diaktifkan.
            </p>
        @elseif ($status === 'expired')
            <div class="status-icon" aria-hidden="true">
                <svg viewBox="0 0 112 112">
                    <circle class="ring" cx="56" cy="56" r="50" stroke="#d97706"></circle>
                    <g class="pulse">
                        <circle cx="56" cy="56" r="22" fill="none" stroke="#d97706" stroke-width="5"></circle>
                        <path d="M56 44v14l9 6" fill="none" stroke="#d97706" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></path>
                    </g>
                </svg>
            </div>
            <h1>Pembayaran kedaluwarsa</h1>
            <p class="message">
                Batas waktu pembayaran telah berakhir. Silakan buat transaksi baru
                jika masih ingin membeli tiket.
            </p>
        @elseif ($status === 'refunded')
            <div class="status-icon" aria-hidden="true">
                <svg viewBox="0 0 112 112">
                    <circle class="ring" cx="56" cy="56" r="50" stroke="#7c3aed"></circle>
                    <path class="mark" d="M38 56h35M59 42l14 14-14 14" stroke="#7c3aed"></path>
                </svg>
            </div>
            <h1>Dana telah dikembalikan</h1>
            <p class="message">
                Transaksi ini telah direfund. Silakan cek metode pembayaran
                yang digunakan untuk melihat pengembalian dana.
            </p>
        @else
            <div class="status-icon" aria-hidden="true">
                <svg viewBox="0 0 112 112">
                    <circle class="ring" cx="56" cy="56" r="50" stroke="#0f6fff"></circle>
                    <g class="spin">
                        <path d="M56 28a28 28 0 1 1-19.8 8.2" fill="none" stroke="#0f6fff" stroke-width="5" stroke-linecap="round"></path>
                    </g>
                    <circle cx="56" cy="56" r="6" fill="#0f6fff"></circle>
                </svg>
            </div>
            <h1>Pembayaran sedang diverifikasi</h1>
            <p class="message">
                Kami sedang memastikan status pembayaran kamu dengan aman.
                Jangan melakukan pembayaran ulang sebelum status transaksi
                terlihat di riwayat Indotix.
            </p>
        @endif

        @if ($reference !== '')
            <div class="reference">
                <strong>Referensi transaksi</strong>
                {{ $reference }}
            </div>
        @endif

        <div class="actions">
            @if ($status === 'success' && $payment?->booking)
                <a class="button primary" href="{{ route('wisata.booking.ticket', ['booking' => encrypt((string) $payment->booking->id)]) }}">
                    Lihat e-ticket
                </a>
            @endif
            <a class="button {{ $status !== 'success' ? 'primary' : '' }}" href="{{ route('public.wisata.history') }}">
                Lihat riwayat
            </a>
            <a class="button" href="{{ route('wisata.search') }}">Kembali ke wisata</a>
        </div>

        <p class="footnote">Status pembayaran ditentukan dari data transaksi yang telah diverifikasi server Indotix.</p>
    </section>
</main>
</body>
</html>
