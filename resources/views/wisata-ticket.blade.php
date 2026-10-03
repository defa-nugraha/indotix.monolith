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
        .brand-wave { position: absolute; top: 0; right: 0; width: 250px; height: 95px; background: #0797d6; border-bottom-left-radius: 110px; padding: 18px 28px 0 0; text-align: right; }
        .content { padding: 34px 34px 24px; position: relative; z-index: 1; }
        .eyebrow { color: #64748b; font-size: 14px; margin-top: 4px; }
        .title { font-size: 27px; font-weight: 700; margin: 0; }
        .section { border-top: 1px solid #d7dde6; padding-top: 18px; margin-top: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .logo { height: 46px; margin: 8px 0 10px; }
        .label { font-size: 11px; color: #7c8797; text-transform: uppercase; letter-spacing: .04em; }
        .value { font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.45; }
        .muted { color: #64748b; font-size: 12px; line-height: 1.45; }
        .timeline-wrap { margin-top: 16px; }
        .timeline-table { width: 100%; border-collapse: collapse; margin: 0; }
        .timeline-table td { border: 0; padding: 0; vertical-align: top; }
        .timeline-time { width: 74px; padding-top: 3px !important; font-size: 15px; font-weight: 700; color: #334155; white-space: nowrap; }
        .timeline-marker { width: 26px; position: relative; text-align: center; }
        .timeline-marker .dot { display: inline-block; width: 13px; height: 13px; border: 3px solid #0ea5e9; border-radius: 50%; background: #fff; position: relative; z-index: 2; margin-top: 2px; }
        .timeline-marker.connected:after { content: ""; position: absolute; top: 14px; bottom: -10px; left: 12px; width: 2px; background: #bae6fd; }
        .timeline-detail { padding: 0 0 18px 8px !important; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; }
        th { background: #f8fafc; color: #64748b; font-size: 11px; padding: 10px 8px; text-align: left; text-transform: uppercase; }
        td { border-bottom: 1px solid #edf2f7; font-size: 12px; padding: 11px 8px; }
        .summary { margin-top: 18px; display: grid; grid-template-columns: 1fr 210px; gap: 16px; align-items: stretch; }
        .note { border: 1px solid #dbeafe; background: #f0f9ff; border-radius: 14px; padding: 14px; font-size: 12px; color: #075985; line-height: 1.55; }
        .total { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; text-align: right; }
        .total .amount { margin-top: 5px; font-size: 20px; font-weight: 800; color: #0284c7; }
        .footer { position: absolute; right: 0; bottom: 0; left: 0; border-top: 1px solid #d7dde6; background: #f8fafc; padding: 18px 34px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; color: #64748b; font-size: 12px; }
        .footer strong { display: block; color: #334155; margin-bottom: 4px; }
        .guide-row { display: table; width: 100%; table-layout: fixed; border-top: 1px solid #d7dde6; border-bottom: 1px solid #d7dde6; margin-top: 4px; padding: 18px 0; }
        .guide-column { display: table-cell; width: 50%; vertical-align: top; padding: 0 14px; }
        .guide-column:first-child { padding-left: 0; border-right: 1px solid #e2e8f0; }
        .guide-column:last-child { padding-right: 0; }
        .guide-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .guide-table td { border: 0; padding: 6px 0; vertical-align: top; font-size: 11px; color: #475569; line-height: 1.45; }
        .guide-icon { width: 27px; padding-right: 7px !important; }
        .guide-icon span { display: inline-block; width: 21px; height: 21px; line-height: 21px; text-align: center; border-radius: 50%; background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 800; }
        .brand-logo { width: 118px; height: 48px; object-fit: contain; object-position: right center; }
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
        <div class="brand-wave"><img src="{{ public_path('logo.png') }}" alt="Indotix" class="brand-logo" /></div>
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
                <div class="label">Tahapan Pemesanan</div>
                <div class="timeline-wrap">
                    <table class="timeline-table">
                        <tbody>
                            <tr>
                                <td class="timeline-time">{{ $booking->created_at?->format('H:i') }}</td>
                                <td class="timeline-marker connected"><span class="dot"></span></td>
                                <td class="timeline-detail">
                                    <div class="value">Tiket dipesan</div>
                                    <div class="muted">{{ $booking->created_at?->format('l, d F Y') }}</div>
                                    <div class="muted" style="margin-top:3px;">{{ $booking->guest_name ?? 'Pemesan' }} · {{ $booking->booking_code }}</div>
                                </td>
                            </tr>
                            <tr>
                                <td class="timeline-time">{{ $booking->visit_date?->format('d M') }}</td>
                                <td class="timeline-marker"><span class="dot"></span></td>
                                <td class="timeline-detail">
                                    <div class="value">Kunjungan wisata</div>
                                    <div class="muted">{{ $booking->destination?->destination_name ?? 'Destinasi wisata' }}</div>
                                    <div class="muted" style="margin-top:3px;">Tanggal kunjungan: {{ $booking->visit_date?->format('l, d F Y') }}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="guide-row">
                <div class="guide-column">
                    <div class="label">Tutorial Penggunaan E-Ticket</div>
                    <table class="guide-table">
                        <tr><td class="guide-icon"><span>1</span></td><td>Datang sesuai tanggal kunjungan dan siapkan e-ticket.</td></tr>
                        <tr><td class="guide-icon"><span>2</span></td><td>Buka menu <strong>Scan Tiket</strong> di Indotix.</td></tr>
                        <tr><td class="guide-icon"><span>3</span></td><td>Scan QR masuk yang disediakan mitra wisata.</td></tr>
                        <tr><td class="guide-icon"><span>4</span></td><td>Pilih tiket yang ingin digunakan.</td></tr>
                    </table>
                </div>
                <div class="guide-column">
                    <div class="label">Informasi Penggunaan</div>
                    <table class="guide-table">
                        <tr><td class="guide-icon"><span>✓</span></td><td>Tunjukkan e-ticket dan identitas pemesan saat dibutuhkan petugas.</td></tr>
                        <tr><td class="guide-icon"><span>1x</span></td><td>Setiap tiket hanya dapat digunakan satu kali sesuai tanggal kunjungan.</td></tr>
                    </table>
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
