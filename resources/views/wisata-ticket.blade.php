<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>E-ticket Wisata - Indotix</title>
    <style>
        * { box-sizing: border-box; }

        @page { margin: 0; }

        body {
            margin: 0;
            padding: 18px;
            background: #f4f7fb;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
        }

        .ticket {
            width: 100%;
            max-width: 780px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #d9e2ec;
            border-top: 4px solid #0797d6;
            position: relative;
        }

        .content {
            padding: 24px 30px 22px;
        }

        .header-table,
        .meta-table,
        .timeline-table,
        .guide-table,
        .ticket-table,
        .summary-table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table td,
        .meta-table td,
        .timeline-table td,
        .guide-table td,
        .summary-table td {
            border: 0;
        }

        .header-left { vertical-align: top; }
        .brand-cell {
            width: 145px;
            text-align: right;
            vertical-align: top;
            padding-top: 2px;
        }

        .brand-logo {
            width: 92px;
            height: auto;
            max-height: 36px;
            object-fit: contain;
            object-position: right center;
        }

        .title {
            margin: 0;
            font-size: 25px;
            line-height: 1.15;
            font-weight: 700;
            color: #0f172a;
        }

        .title span {
            color: #94a3b8;
            font-weight: 600;
        }

        .eyebrow {
            margin-top: 5px;
            color: #64748b;
            font-size: 11px;
        }

        .accent {
            width: 42px;
            height: 3px;
            margin-top: 10px;
            background: #0797d6;
        }

        .meta-section {
            margin-top: 24px;
            padding: 16px 0 17px;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
        }

        .meta-left {
            width: 62%;
            padding-right: 28px !important;
            vertical-align: top;
        }

        .meta-right {
            width: 38%;
            padding-left: 20px !important;
            border-left: 1px solid #edf2f7 !important;
            text-align: right;
            vertical-align: top;
        }

        .label {
            color: #7b8798;
            font-size: 9px;
            line-height: 1.2;
            text-transform: uppercase;
            letter-spacing: .07em;
        }

        .value {
            color: #172033;
            font-size: 12px;
            line-height: 1.4;
            font-weight: 700;
        }

        .destination {
            margin-top: 4px;
            font-size: 13px;
        }

        .muted {
            color: #64748b;
            font-size: 10px;
            line-height: 1.45;
        }

        .status {
            display: inline-block;
            margin-top: 4px;
            padding: 4px 9px;
            border: 1px solid #bae6fd;
            border-radius: 20px;
            background: #f0f9ff;
            color: #0369a1;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: .04em;
        }

        .booking-code {
            margin-top: 3px;
            font-size: 11px;
            line-height: 1.35;
            font-weight: 700;
            word-break: break-all;
        }

        .timeline-section {
            margin-top: 18px;
        }

        .section-heading {
            color: #718096;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: .07em;
            margin-bottom: 10px;
        }

        .timeline-table td {
            vertical-align: top;
        }

        .timeline-time {
            width: 62px;
            padding-top: 1px !important;
            color: #334155;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
        }

        .timeline-marker {
            width: 24px;
            text-align: center;
            vertical-align: top !important;
        }

        .dot {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 2px solid #0797d6;
            border-radius: 50%;
            background: #fff;
        }

        .timeline-detail {
            padding: 0 0 0 9px !important;
        }

        .timeline-detail .value {
            font-size: 11px;
        }

        .timeline-detail .muted {
            margin-top: 2px;
        }

        .timeline-connector td {
            height: 16px;
            padding: 0 !important;
        }

        .timeline-connector .connector-cell {
            width: 24px;
            text-align: center;
            vertical-align: middle !important;
        }

        .timeline-connector .connector-line {
            display: block;
            width: 2px;
            height: 16px;
            margin: 0 auto;
            background: #bae6fd;
        }

        .guide-row {
            display: table;
            width: 100%;
            table-layout: fixed;
            margin-top: 17px;
            padding: 13px 0 12px;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
        }

        .guide-column {
            display: table-cell;
            width: 50%;
            padding: 0 15px;
            vertical-align: top;
        }

        .guide-column:first-child {
            padding-left: 0;
            border-right: 1px solid #e2e8f0;
        }

        .guide-column:last-child {
            padding-right: 0;
        }

        .guide-table {
            margin-top: 7px;
        }

        .guide-table td {
            padding: 4px 0;
            color: #475569;
            font-size: 9.5px;
            line-height: 1.4;
            vertical-align: top;
        }

        .guide-icon {
            width: 24px;
            padding-right: 6px !important;
        }

        .guide-icon span {
            display: inline-block;
            width: 17px;
            height: 17px;
            line-height: 17px;
            text-align: center;
            border-radius: 50%;
            background: #e0f2fe;
            color: #0369a1;
            font-size: 8px;
            font-weight: 700;
        }

        .tickets-section {
            margin-top: 16px;
        }

        .ticket-table {
            table-layout: fixed;
            margin-top: 7px;
        }

        .ticket-table th {
            padding: 8px 7px;
            background: #f7fafc;
            color: #64748b;
            border-bottom: 1px solid #e2e8f0;
            font-size: 8.5px;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: .03em;
        }

        .ticket-table td {
            padding: 8px 7px;
            color: #334155;
            border-bottom: 1px solid #edf2f7;
            font-size: 9.5px;
            line-height: 1.35;
            vertical-align: top;
        }

        .ticket-table th:nth-child(1),
        .ticket-table td:nth-child(1) { width: 7%; text-align: center; }

        .ticket-table th:nth-child(2),
        .ticket-table td:nth-child(2) { width: 21%; }

        .ticket-table th:nth-child(3),
        .ticket-table td:nth-child(3) { width: 37%; }

        .ticket-table th:nth-child(4),
        .ticket-table td:nth-child(4) { width: 10%; text-align: center; }

        .ticket-table th:nth-child(5),
        .ticket-table td:nth-child(5) { width: 12%; text-align: center; }

        .ticket-table th:nth-child(6),
        .ticket-table td:nth-child(6) { width: 13%; text-align: right; }

        .summary-table {
            margin-top: 14px;
        }

        .summary-note {
            width: 63%;
            padding: 10px 12px !important;
            border: 1px solid #dbeafe !important;
            background: #f7fcff;
            color: #075985;
            font-size: 9.5px;
            line-height: 1.45;
            vertical-align: top;
        }

        .summary-total {
            width: 37%;
            padding: 10px 0 10px 18px !important;
            text-align: right;
            vertical-align: middle;
        }

        .amount {
            margin-top: 3px;
            color: #0284c7;
            font-size: 17px;
            font-weight: 800;
        }

        .footer {
            margin-top: 18px;
            padding: 11px 30px;
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
            color: #64748b;
            font-size: 9px;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-table td {
            border: 0;
            padding: 0;
        }

        .footer-right { text-align: right; }

        .footer strong {
            color: #334155;
        }

        .avoid-break {
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    @php
        $ticketRows = $booking->items && $booking->items->isNotEmpty()
            ? $booking->items->map(fn ($item) => [
                'name' => $item->ticket_name ?? $item->ticket?->name ?? 'Tiket Wisata',
                'quantity' => (int) $item->quantity,
                'used' => (int) ($item->used_quantity ?? 0),
                'subtotal' => (int) $item->subtotal,
            ])
            : collect([[
                'name' => $booking->ticket?->name ?? 'Tiket Wisata',
                'quantity' => (int) $booking->quantity,
                'used' => 0,
                'subtotal' => (int) ($booking->total_price ?? 0),
            ]]);
    @endphp

    <div class="ticket">
        <div class="content">
            <table class="header-table">
                <tr>
                    <td class="header-left">
                        <h1 class="title">E-ticket <span>/ E-tiket</span></h1>
                        <div class="eyebrow">Tiket Wisata Indotix</div>
                        <div class="accent"></div>
                    </td>
                    <td class="brand-cell">
                        @if ($logoDataUri)
                            <img src="{{ $logoDataUri }}" alt="" class="brand-logo" />
                        @endif
                    </td>
                </tr>
            </table>

            <div class="meta-section avoid-break">
                <table class="meta-table">
                    <tr>
                        <td class="meta-left">
                            <div class="label">Destinasi Wisata</div>
                            <div class="value destination">{{ $booking->destination?->destination_name ?? '-' }}</div>
                            <div class="muted">{{ $booking->destination?->address_full ?? '-' }}</div>
                        </td>
                        <td class="meta-right">
                            <div class="label">Booking ID Indotix</div>
                            <div class="booking-code">{{ $booking->booking_code }}</div>
                            <div class="label" style="margin-top:9px;">Status Pembayaran</div>
                            <div class="status">{{ strtoupper($booking->status ?? '-') }}</div>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="timeline-section avoid-break">
                <div class="section-heading">Tahapan Pemesanan</div>
                <table class="timeline-table">
                    <tbody>
                        <tr>
                            <td class="timeline-time">{{ $booking->created_at?->format('H:i') }}</td>
                            <td class="timeline-marker"><span class="dot"></span></td>
                            <td class="timeline-detail">
                                <div class="value">Tiket dipesan</div>
                                <div class="muted">{{ $booking->created_at?->format('l, d F Y') }}</div>
                                <div class="muted">{{ $booking->guest_name ?? 'Pemesan' }} · {{ $booking->booking_code }}</div>
                            </td>
                        </tr>
                        <tr class="timeline-connector">
                            <td></td>
                            <td class="connector-cell"><span class="connector-line"></span></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td class="timeline-time">{{ $booking->visit_date?->format('d M') }}</td>
                            <td class="timeline-marker"><span class="dot"></span></td>
                            <td class="timeline-detail">
                                <div class="value">Kunjungan wisata</div>
                                <div class="muted">{{ $booking->destination?->destination_name ?? 'Destinasi wisata' }}</div>
                                <div class="muted">Tanggal kunjungan: {{ $booking->visit_date?->format('l, d F Y') }}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="guide-row avoid-break">
                <div class="guide-column">
                    <div class="section-heading" style="margin-bottom:0;">Tutorial Penggunaan E-Ticket</div>
                    <table class="guide-table">
                        <tr><td class="guide-icon"><span>1</span></td><td>Datang sesuai tanggal kunjungan dan siapkan e-ticket.</td></tr>
                        <tr><td class="guide-icon"><span>2</span></td><td>Buka menu <strong>Scan Tiket</strong> di Indotix.</td></tr>
                        <tr><td class="guide-icon"><span>3</span></td><td>Scan QR masuk yang disediakan mitra wisata.</td></tr>
                        <tr><td class="guide-icon"><span>4</span></td><td>Pilih tiket yang ingin digunakan.</td></tr>
                    </table>
                </div>
                <div class="guide-column">
                    <div class="section-heading" style="margin-bottom:0;">Informasi Penggunaan</div>
                    <table class="guide-table">
                        <tr><td class="guide-icon"><span>1</span></td><td>Tunjukkan e-ticket dan identitas pemesan saat dibutuhkan petugas.</td></tr>
                        <tr><td class="guide-icon"><span>2</span></td><td>Setiap tiket hanya dapat digunakan satu kali sesuai tanggal kunjungan.</td></tr>
                    </table>
                </div>
            </div>

            <div class="tickets-section avoid-break">
                <div class="section-heading" style="margin-bottom:0;">Daftar Tiket</div>
                <table class="ticket-table">
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
            </div>

            <table class="summary-table avoid-break">
                <tr>
                    <td class="summary-note">
                        <strong>Tidak perlu print.</strong>
                        Buka menu Scan Tiket di aplikasi/website Indotix, scan QR masuk di lokasi wisata, lalu pilih tiket yang akan digunakan.
                    </td>
                    <td class="summary-total">
                        <div class="label">Total Pembayaran</div>
                        <div class="amount">Rp {{ number_format($booking->total_price ?? 0, 0, ',', '.') }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="footer">
            <table class="footer-table">
                <tr>
                    <td><strong>Customer Service</strong> &nbsp; 0812-9205-9888</td>
                    <td class="footer-right"><strong>Email Bantuan</strong> &nbsp; info@indotix.co.id</td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
