<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>E-ticket Special Program - INDOTIX</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: "Arial", sans-serif; background: #eef2f6; margin: 0; padding: 24px; color: #0f172a; }
        .ticket { max-width: 760px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px 18px; position: relative; }
        .brand-ribbon { position: absolute; top: 0; right: 0; background: #0ea5e9; color: #fff; padding: 10px 18px; border-radius: 0 14px 0 14px; font-weight: 700; font-size: 12px; text-transform: uppercase; }
        .title { font-size: 18px; font-weight: 700; margin: 0; }
        .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
        .meta { margin-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .logo { height: 36px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #e0f2fe; color: #0369a1; }
        .divider { height: 1px; background: #e2e8f0; margin: 12px 0; }
        .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; margin: 14px 0 8px; }
        .info-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; margin-top: 8px; }
        .info-item { font-size: 12px; color: #475569; }
        .info-item .label { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px; }
        .info-item .value { font-weight: 700; color: #0f172a; }
        .summary { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; align-items: center; margin-top: 12px; }
        .total { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
        .total .label { font-size: 12px; color: #64748b; }
        .total .value { font-size: 16px; font-weight: 700; color: #0284c7; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 12px; }
        th { font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="brand-ribbon">indotix</div>
        <div class="title">E-ticket / E-tiket</div>
        <div class="subtitle">Special Program Booking</div>

        <div class="meta">
            <div>
                <img src="{{ public_path('logo.png') }}" alt="Indotix" class="logo" />
            </div>
            <div>
                <div class="section-title" style="margin:0;">Booking ID</div>
                <div style="font-weight:700; font-size:12px;">{{ $booking->midtrans_order_id ?? $booking->id }}</div>
                <div style="margin-top:6px;" class="badge">{{ strtoupper($booking->status) }}</div>
            </div>
        </div>

        <div class="divider"></div>

        <div class="section-title">Informasi Program</div>
        <div style="font-size:12px; font-weight:700;">{{ $booking->program?->name ?? 'Special Program' }}</div>
        <div class="section-title">Variant</div>
        <div style="font-size:12px; font-weight:700;">{{ $booking->variant?->name ?? 'Paket Dasar' }}</div>
        <div class="section-title">Tanggal</div>
        <div style="font-size:12px; font-weight:700;">{{ $booking->visit_date?->toDateString() ?? '-' }}</div>

        <div class="section-title">Data Pemesan</div>
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

        <div class="section-title">Detail Pesanan</div>
        <table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Produk</th>
                    <th>Qty</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>{{ $booking->variant?->name ?? 'Paket Dasar' }}</td>
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
        </div>
    </div>
</body>
</html>
