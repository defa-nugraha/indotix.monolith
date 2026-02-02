<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice - INDOTIX</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: "Arial", sans-serif; background: #f4f6f8; margin: 0; padding: 24px; color: #0f172a; }
        .container { max-width: 820px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .logo { height: 40px; }
        .badge { background: #e0f2fe; color: #0369a1; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .section { margin-top: 20px; }
        .section h2 { font-size: 16px; margin: 0 0 12px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
        .muted { color: #64748b; font-size: 12px; }
        .bold { font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 14px; }
        th { color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
        .total { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-radius: 12px; background: #f8fafc; }
        .total strong { font-size: 18px; color: #0284c7; }
        .footer { margin-top: 24px; font-size: 12px; color: #64748b; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ public_path('logo.png') }}" alt="Indotix" class="logo" />
            <span class="badge">Invoice</span>
        </div>

        <div class="section">
            <h2>Ringkasan Pesanan</h2>
            <div class="grid">
                <div class="card">
                    <div class="muted">ID Pesanan</div>
                    <div class="bold">{{ $booking->midtrans_order_id ?? 'INDOTIX-'.$booking->id }}</div>
                </div>
                <div class="card">
                    <div class="muted">Status</div>
                    <div class="bold">{{ strtoupper($booking->status) }}</div>
                </div>
                <div class="card">
                    <div class="muted">Hotel</div>
                    <div class="bold">{{ $booking->hotel?->name }}</div>
                    <div class="muted">{{ $booking->hotel?->address }}</div>
                </div>
                <div class="card">
                    <div class="muted">Tanggal</div>
                    <div class="bold">{{ $booking->check_in?->format('d M Y') }} - {{ $booking->check_out?->format('d M Y') }}</div>
                    <div class="muted">{{ $booking->nights }} malam</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Data Tamu</h2>
            <div class="grid">
                <div class="card">
                    <div class="muted">Nama</div>
                    <div class="bold">{{ $booking->guest_name ?? '-' }}</div>
                </div>
                <div class="card">
                    <div class="muted">Email</div>
                    <div class="bold">{{ $booking->guest_email ?? '-' }}</div>
                </div>
                <div class="card">
                    <div class="muted">Telepon</div>
                    <div class="bold">{{ $booking->guest_phone ?? '-' }}</div>
                </div>
                <div class="card">
                    <div class="muted">Tamu/Kamar</div>
                    <div class="bold">{{ $booking->guests_count }} tamu • {{ $booking->rooms_count }} kamar</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Detail Kamar</h2>
            <table>
                <thead>
                    <tr>
                        <th>Tipe Kamar</th>
                        <th>Kamar</th>
                        <th>Harga/Malam</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($booking->rooms as $room)
                        <tr>
                            <td>{{ $room->roomType?->name ?? 'Tipe kamar' }}</td>
                            <td>{{ $room->rooms_count }}</td>
                            <td>Rp {{ number_format($room->price_per_night ?? 0, 0, ',', '.') }}</td>
                            <td>Rp {{ number_format($room->subtotal ?? 0, 0, ',', '.') }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="section total">
            <div>
                <div class="muted">Total Pembayaran</div>
                <div class="muted">Status pembayaran: {{ $booking->payment_status ?? 'pending' }}</div>
            </div>
            <strong>Rp {{ number_format($booking->total ?? 0, 0, ',', '.') }}</strong>
        </div>

        <div class="footer">
            Terima kasih telah menggunakan INDOTIX. Simpan invoice ini untuk referensi Anda.
        </div>
    </div>
</body>
</html>
