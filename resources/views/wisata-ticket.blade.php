<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>E-ticket Wisata - Indotix</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 22px; background: #f3f7fb; color: #0f172a; font-family: Arial, sans-serif; }
        .ticket { max-width: 780px; min-height: 1000px; margin: 0 auto; background: #fff; border: 1px solid #dbeafe; overflow: hidden; position: relative; }
        .brand-wave { position: absolute; top: 0; right: 0; width: 250px; height: 95px; background: #0797d6; border-bottom-left-radius: 110px; color: #fff; text-align: right; padding: 22px 32px 0 0; font-size: 30px; font-weight: 700; }
        .content { padding: 34px 34px 24px; position: relative; z-index: 1; }
        .eyebrow { color: #64748b; font-size: 14px; margin-top: 4px; }
        .title { font-size: 27px; font-weight: 700; margin: 0; }
        .section { border-top: 1px solid #d7dde6; padding-top: 18px; margin-top: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .logo { height: 46px; margin: 8px 0 10px; }
        .label { font-size: 11px; color: #7c8797; text-transform: uppercase; letter-spacing: .04em; }
        .value { font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.45; }
        .muted { color: #64748b; font-size: 12px; line-height: 1.45; }
        .timeline { display: grid; grid-template-columns: 90px 22px 1fr; gap: 8px; align-items: start; margin-top: 16px; }
        .time { font-size: 18px; font-weight: 700; color: #334155; }
        .dot { width: 12px; height: 12px; border: 3px solid #0ea5e9; border-radius: 50%; margin-top: 5px; }
        .line { width: 2px; height: 32px; background: #bae6fd; margin-left: 5px; }
        .info-band { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; border-top: 1px solid #d7dde6; border-bottom: 1px solid #d7dde6; padding: 18px 0; margin-top: 24px; }
        .info { display: grid; grid-template-columns: 38px 1fr; gap: 10px; align-items: start; color: #475569; font-size: 12px; line-height: 1.4; }
        .icon { width: 34px; height: 34px; border: 2px solid #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #475569; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; }
        th { background: #f8fafc; color: #64748b; font-size: 11px; padding: 10px 8px; text-align: left; text-transform: uppercase; }
        td { border-bottom: 1px solid #edf2f7; font-size: 12px; padding: 11px 8px; }
        .summary { margin-top: 18px; display: grid; grid-template-columns: 1fr 210px; gap: 16px; align-items: stretch; }
        .note { border: 1px solid #dbeafe; background: #f0f9ff; border-radius: 14px; padding: 14px; font-size: 12px; color: #075985; line-height: 1.55; }
        .total { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; text-align: right; }
        .total .amount { margin-top: 5px; font-size: 20px; font-weight: 800; color: #0284c7; }
        .footer { position: absolute; right: 0; bottom: 0; left: 0; border-top: 1px solid #d7dde6; background: #f8fafc; padding: 18px 34px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; color: #64748b; font-size: 12px; }
        .footer strong { display: block; color: #334155; margin-bottom: 4px; }
        .right { text-align: right; }
    </style>
</head>
<body>
    @php
        $ticketRows = $booking->items && $booking->items->isNotEmpty()
            ? $booking->items->map(fn ($item) => [
                'name' => $item->ticket_name ?? $item->ticket?->name ?? 'Tiket Wisata',
                'quantity' => (int) $item->quantity,
                'used' => (int) ($item->used_quantity ?? 0),
                'unit_price' => (int) $item->unit_price,
                'subtotal' => (int) $item->subtotal,
            ])
            : collect([[
                'name' => $booking->ticket?->name ?? 'Tiket Wisata',
                'quantity' => (int) $booking->quantity,
                'used' => 0,
                'unit_price' => (int) $booking->unit_price,
                'subtotal' => (int) ($booking->total_price ?? 0),
            ]]);
    @endphp
    <div class="ticket">
        <div class="brand-wave">indotix</div>
        <div class="content">
            <h1 class="title">E-ticket <span style="color:#94a3b8;">/ E-tiket</span></h1>
            <div class="eyebrow">Tiket Wisata Indotix</div>

            <div class="grid section" style="border-top:0; padding-top:28px;">
                <div>
                    <img src="{{ public_path('logo.png') }}" alt="Indotix" class="logo" />
                    <div class="label">Destinasi</div>
                    <div class="value">{{ $booking->destination?->destination_name ?? '-' }}</div>
                    <div class="muted">{{ $booking->destination?->address_full ?? '-' }}</div>
                </div>
                <div class="right" style="padding-top:28px;">
                    <div class="label">Booking ID Indotix</div>
                    <div class="value">{{ $booking->booking_code }}</div>
                    <div class="label" style="margin-top:10px;">Status</div>
                    <div class="value">{{ strtoupper($booking->status ?? '-') }}</div>
                </div>
            </div>

            <div class="section">
                <div class="timeline">
                    <div class="time">{{ $booking->created_at?->format('H:i') }}</div>
                    <div>
                        <div class="dot"></div>
                        <div class="line"></div>
                    </div>
                    <div>
                        <div class="value">Tiket dipesan</div>
                        <div class="muted">{{ $booking->created_at?->format('l, d F Y') }}</div>
                    </div>

                    <div class="time">{{ $booking->visit_date?->format('d M') }}</div>
                    <div><div class="dot"></div></div>
                    <div>
                        <div class="value">{{ $booking->destination?->destination_name ?? 'Destinasi wisata' }}</div>
                        <div class="muted">Tanggal kunjungan: {{ $booking->visit_date?->format('l, d F Y') }}</div>
                    </div>
                </div>
            </div>

            <div class="info-band">
                <div class="info">
                    <div class="icon">i</div>
                    <div>Tunjukkan e-ticket dan identitas pemesan saat dibutuhkan petugas.</div>
                </div>
                <div class="info">
                    <div class="icon">✓</div>
                    <div>Scan QR masuk milik mitra melalui menu Scan Tiket di Indotix.</div>
                </div>
                <div class="info">
                    <div class="icon">1x</div>
                    <div>Setiap tiket hanya dapat digunakan satu kali sesuai tanggal kunjungan.</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Nama Pemesan</th>
                        <th>Jenis Tiket</th>
                        <th>Qty</th>
                        <th>Terpakai</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($ticketRows as $index => $item)
                        <tr>
                            <td>{{ $index + 1 }}</td>
                            <td>{{ $booking->guest_name ?? '-' }}</td>
                            <td>{{ $item['name'] }}</td>
                            <td>{{ $item['quantity'] }}</td>
                            <td>{{ $item['used'] }}</td>
                            <td>Rp {{ number_format($item['subtotal'], 0, ',', '.') }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="summary">
                <div class="note">
                    <strong>Tidak perlu print.</strong><br>
                    Buka menu Scan Tiket di aplikasi/website Indotix, scan QR masuk di lokasi wisata, lalu pilih tiket yang akan digunakan.
                </div>
                <div class="total">
                    <div class="label">Total Pembayaran</div>
                    <div class="amount">Rp {{ number_format($booking->total_price ?? 0, 0, ',', '.') }}</div>
                </div>
            </div>
        </div>
        <div class="footer">
            <div><strong>Customer Service</strong>0812-9205-9888</div>
            <div class="right"><strong>Email Bantuan</strong>info@indotix.co.id</div>
        </div>
    </div>
</body>
</html>
