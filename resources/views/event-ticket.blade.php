<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>E-ticket Event - INDOTIX</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: "Arial", sans-serif; background: #eef2f6; margin: 0; padding: 24px; color: #0f172a; }
        .ticket { max-width: 760px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px 18px; position: relative; }
        .topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .title { font-size: 18px; font-weight: 700; margin: 0; }
        .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
        .brand-ribbon { position: absolute; top: 0; right: 0; background: #0ea5e9; color: #fff; padding: 10px 18px; border-radius: 0 14px 0 14px; font-weight: 700; font-size: 12px; text-transform: uppercase; }
        .meta { margin-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .meta-left { display: flex; align-items: center; gap: 10px; }
        .logo { height: 36px; }
        .date { font-size: 12px; color: #334155; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #e0f2fe; color: #0369a1; }
        .divider { height: 1px; background: #e2e8f0; margin: 12px 0; }
        .route { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
        .route-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
        .info-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; margin-top: 8px; }
        .info-item { font-size: 12px; color: #475569; }
        .info-item .label { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px; }
        .info-item .value { font-weight: 700; color: #0f172a; }
        .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; margin: 14px 0 8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 12px; }
        th { font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
        .summary { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; align-items: center; margin-top: 12px; }
        .total { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
        .total .label { font-size: 12px; color: #64748b; }
        .total .value { font-size: 16px; font-weight: 700; color: #0284c7; margin-top: 4px; }
        .qr { border: 1px dashed #cbd5f5; border-radius: 10px; padding: 10px; text-align: center; background: #f8fafc; }
        .qr img { width: 130px; height: 130px; }
        .footer { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; font-size: 11px; color: #64748b; }
        .footer-note { border-top: 1px solid #e2e8f0; padding-top: 10px; }
        .contact { text-align: right; }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="brand-ribbon">indotix</div>
        <div class="topbar">
            <div>
                <div class="title">E-ticket / E-tiket</div>
                <div class="subtitle">Pemesanan Tiket Event</div>
            </div>
        </div>

        <div class="meta">
            <div class="meta-left">
                <img src="{{ public_path('logo.png') }}" alt="Indotix" class="logo" />
                <div class="date">{{ $booking->event?->start_at?->format('l, d F Y') ?? '-' }}</div>
            </div>
            <div>
                <div class="section-title" style="margin:0;">Booking ID</div>
                <div style="font-weight:700; font-size:12px;">{{ $booking->booking_code }}</div>
                <div style="margin-top:6px;" class="badge">{{ strtoupper($booking->status) }}</div>
            </div>
        </div>

        <div class="divider"></div>

        <div class="route">
            <div>
                <div class="section-title" style="margin-top:0;">Informasi Event</div>
                <div style="font-size:12px; font-weight:700;">{{ $booking->event?->title ?? '-' }}</div>
                <div class="route-sub">{{ $booking->event?->location ?? '-' }}</div>
                <div class="section-title">Informasi Tiket</div>
                <div style="font-size:12px; font-weight:700;">{{ $booking->ticket?->name ?? 'Tiket Event' }}</div>
                <div class="route-sub">Berlaku {{ $booking->event?->start_at?->format('d M Y') ?? '-' }}</div>
            </div>
            <div>
                <div class="section-title" style="margin-top:0;">Data Pemesan</div>
                <div class="info-row">
                    <div class="info-item">
                        <span class="label">Nama</span>
                        <span class="value">{{ $booking->guest_name ?? '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Email</span>
                        <span class="value">{{ $booking->guest_email ?? '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Telepon</span>
                        <span class="value">{{ $booking->guest_phone ?? '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Status Pembayaran</span>
                        <span class="value">{{ $booking->payment_status ?? 'pending' }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="section-title">Detail Peserta</div>
        <table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Nama Peserta</th>
                    <th>Jenis Tiket</th>
                    <th>Qty</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>{{ $booking->guest_name ?? '-' }}</td>
                    <td>{{ $booking->ticket?->name ?? 'Tiket Event' }}</td>
                    <td>{{ $booking->quantity }}</td>
                    <td>Rp {{ number_format($booking->total_price ?? 0, 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>

        <div class="summary">
            <div class="total">
                <div class="label">Total Pembayaran</div>
                <div class="value">Rp {{ number_format($booking->total_price ?? 0, 0, ',', '.') }}</div>
            </div>
            <div class="qr">
                <div style="font-size:12px; font-weight:700; margin-bottom:6px;">QR Validasi</div>
                @if ($qrImage)
                    <img src="{{ $qrImage }}" alt="QR Ticket" />
                @else
                    <div class="route-sub">QR belum tersedia</div>
                @endif
                <div class="route-sub">Scan QR ini saat masuk.</div>
            </div>
        </div>

        <div class="footer footer-note">
            <div>
                Customer Service (Indonesia)<br />
                0812-9205-9888
            </div>
            <div class="contact">
                Customer Service Email<br />
                info@indotix.co.id
            </div>
        </div>
    </div>
</body>
</html>
