<?php

namespace Database\Seeders;

use App\Models\PrivacyPolicy;
use Illuminate\Database\Seeder;

class PrivacyPolicySeeder extends Seeder
{
    public function run(): void
    {
        PrivacyPolicy::query()->delete();

        $content = <<<'HTML'
<p><strong>Terakhir diperbarui:</strong> 2026-03-08<br><strong>Berlaku efektif:</strong> 2026-03-08</p>
<p>Dokumen ini menjelaskan bagaimana Indotix (&ldquo;Kami&rdquo;) mengumpulkan, menggunakan, menyimpan, membagikan, dan melindungi data pribadi pengguna (&ldquo;Pengguna&rdquo;). Kebijakan ini berlaku untuk seluruh layanan Indotix, termasuk situs web, aplikasi mobile, dan sistem administrasi yang terkait.</p>

<h2>1. Ruang Lingkup</h2>
<p>Kebijakan ini berlaku untuk:</p>
<ul>
  <li>Layanan pemesanan wisata, hotel, event, special program, Eljohn Academy, dan Retail Shop.</li>
  <li>Transaksi pembayaran melalui gateway pembayaran pihak ketiga.</li>
  <li>Fitur notifikasi, live chat, serta validasi QR.</li>
  <li>Program afiliasi, referral, dan promo.</li>
</ul>

<h2>2. Jenis Data yang Kami Kumpulkan</h2>
<h3>2.1 Data Akun</h3>
<ul>
  <li>Nama lengkap</li>
  <li>Email</li>
  <li>Nomor telepon</li>
  <li>Password (tersimpan dalam bentuk hash)</li>
  <li>Foto profil (opsional)</li>
</ul>

<h3>2.2 Data Transaksi</h3>
<ul>
  <li>Detail produk (wisata/hotel/event/academy/retail shop)</li>
  <li>Jumlah dan harga</li>
  <li>Status pembayaran dan deadline pembayaran</li>
  <li>Riwayat booking dan invoice</li>
  <li>QR code tiket</li>
</ul>

<h3>2.3 Data Identitas dan Legal</h3>
<ul>
  <li>Dokumen mitra/EO (jika relevan)</li>
  <li>Dokumen identitas untuk verifikasi (jika diminta)</li>
</ul>

<h3>2.4 Data Lokasi dan Operasional</h3>
<ul>
  <li>Koordinat lokasi produk (lat/long) untuk kebutuhan peta</li>
  <li>Alamat pengiriman (untuk Retail Shop)</li>
  <li>Data check-in (scan QR, waktu, status)</li>
</ul>

<h3>2.5 Data Teknis</h3>
<ul>
  <li>Alamat IP</li>
  <li>Device ID dan informasi perangkat</li>
  <li>Log aktivitas, error, dan performa</li>
  <li>Data cookie dan session</li>
</ul>

<h3>2.6 Data Komunikasi</h3>
<ul>
  <li>Riwayat percakapan live chat</li>
  <li>Notifikasi yang dikirim/diterima</li>
</ul>

<h2>3. Sumber Data</h2>
<ul>
  <li>Pengguna yang mendaftar, melakukan booking, atau menggunakan layanan</li>
  <li>Mitra/EO yang mengelola produk di platform</li>
  <li>Sistem pembayaran (misalnya Midtrans) untuk status transaksi</li>
  <li>Provider notifikasi (misalnya FCM) untuk pengiriman push notification</li>
</ul>

<h2>4. Tujuan Penggunaan Data</h2>
<ul>
  <li>Memproses transaksi dan pembayaran</li>
  <li>Menerbitkan tiket, QR code, dan invoice</li>
  <li>Mengelola booking, refund, dan dispute</li>
  <li>Menyediakan layanan pelanggan dan live chat</li>
  <li>Mengirim notifikasi terkait transaksi</li>
  <li>Mengelola keamanan, pencegahan fraud, dan audit log</li>
  <li>Analitik performa produk dan layanan</li>
  <li>Pengembangan fitur dan peningkatan pengalaman pengguna</li>
</ul>

<h2>5. Dasar Hukum Pemrosesan</h2>
<ul>
  <li>Persetujuan pengguna</li>
  <li>Pelaksanaan kontrak layanan</li>
  <li>Kepatuhan terhadap kewajiban hukum</li>
  <li>Kepentingan sah untuk keamanan dan peningkatan layanan</li>
</ul>

<h2>6. Pembayaran</h2>
<p>Transaksi pembayaran diproses oleh pihak ketiga (contoh: Midtrans). Informasi kartu atau metode pembayaran tidak disimpan di server Indotix. Kami hanya menerima data status transaksi dan identifikasi pembayaran yang diperlukan untuk rekonsiliasi.</p>

<h2>7. QR Code dan Validasi Tiket</h2>
<ul>
  <li>QR code berisi kode booking dan informasi validasi.</li>
  <li>QR code digunakan untuk check-in di lokasi.</li>
  <li>Status &ldquo;used&rdquo; akan tercatat setelah QR tervalidasi.</li>
</ul>

<h2>8. Afiliasi dan Referral</h2>
<ul>
  <li>Sistem referral menggunakan token/link/kode.</li>
  <li>Data transaksi terkait afiliasi hanya mencakup informasi ringkas untuk perhitungan komisi.</li>
  <li>Data pribadi pengguna tidak dibagikan kepada afiliator.</li>
</ul>

<h2>9. Live Chat dan Notifikasi</h2>
<ul>
  <li>Percakapan live chat disimpan untuk keperluan layanan pelanggan dan audit.</li>
  <li>Notifikasi transaksi dikirim melalui email, in-app, dan push notification.</li>
  <li>Pengguna dapat mengatur preferensi notifikasi di akun.</li>
</ul>

<h2>10. Pembagian Data dengan Mitra</h2>
<p>Kami dapat membagikan data minimum yang diperlukan kepada mitra, seperti:</p>
<ul>
  <li>Nama tamu dan detail booking</li>
  <li>Informasi check-in</li>
  <li>Informasi pengiriman (untuk Retail Shop)</li>
</ul>
<p>Kami tidak membagikan data sensitif yang tidak diperlukan untuk layanan.</p>

<h2>11. Cookie dan Teknologi Serupa</h2>
<ul>
  <li>Autentikasi dan session</li>
  <li>Preferensi pengguna</li>
  <li>Analitik dasar penggunaan</li>
</ul>

<h2>12. Keamanan Data</h2>
<ul>
  <li>Enkripsi transmisi (HTTPS)</li>
  <li>Pembatasan akses berbasis role</li>
  <li>Audit log untuk tindakan penting</li>
  <li>Proses review internal</li>
</ul>

<h2>13. Retensi Data</h2>
<p>Data disimpan selama diperlukan untuk:</p>
<ul>
  <li>Pemenuhan layanan</li>
  <li>Kepatuhan hukum</li>
  <li>Keperluan audit dan keamanan</li>
</ul>
<p>Pengguna dapat meminta penghapusan data sesuai ketentuan yang berlaku.</p>

<h2>14. Hak Pengguna</h2>
<ul>
  <li>Akses data pribadi</li>
  <li>Koreksi data</li>
  <li>Penghapusan data tertentu</li>
  <li>Penarikan persetujuan</li>
</ul>
<p>Permintaan dapat disampaikan melalui kanal bantuan resmi.</p>

<h2>15. Perubahan Kebijakan</h2>
<p>Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Perubahan signifikan akan diinformasikan kepada pengguna melalui notifikasi atau pengumuman di platform.</p>

<h2>16. Kontak</h2>
<p>Jika ada pertanyaan terkait kebijakan privasi, silakan hubungi:</p>
<ul>
  <li>Email: support@indotix.id</li>
  <li>Live chat: tersedia di aplikasi</li>
</ul>

<p>Dengan menggunakan layanan Indotix, Anda menyetujui kebijakan privasi ini.</p>
HTML;

        $termsContent = <<<'HTML'
<h2>1. Definisi</h2>
<ul>
  <li><strong>Platform</strong>: layanan Indotix berbasis web dan aplikasi.</li>
  <li><strong>Produk</strong>: wisata, hotel, event, special program, Eljohn Academy, dan Retail Shop.</li>
  <li><strong>Tiket</strong>: bukti transaksi digital yang dapat divalidasi menggunakan QR.</li>
  <li><strong>Mitra</strong>: pemilik produk/penyelenggara yang terdaftar di Indotix.</li>
</ul>

<h2>2. Akun dan Keamanan</h2>
<ul>
  <li>Pengguna wajib menjaga kerahasiaan akun dan kata sandi.</li>
  <li>Aktivitas yang terjadi pada akun dianggap sah jika dilakukan melalui kredensial yang benar.</li>
  <li>Indotix dapat menonaktifkan akun jika terindikasi penyalahgunaan.</li>
</ul>

<h2>3. Pemesanan dan Pembayaran</h2>
<ul>
  <li>Transaksi dianggap sah setelah pembayaran berhasil.</li>
  <li>Waktu pembayaran mengikuti batas waktu yang tertera pada halaman pembayaran.</li>
  <li>Metode pembayaran mengikuti ketersediaan gateway pembayaran.</li>
</ul>

<h2>4. Tiket dan Validasi</h2>
<ul>
  <li>Tiket bersifat single-use dan hanya berlaku untuk jadwal yang dipilih.</li>
  <li>QR code hanya dapat digunakan sekali dan akan berubah status menjadi &ldquo;used&rdquo; setelah tervalidasi.</li>
  <li>Pengguna wajib menunjukkan tiket dan identitas saat diminta di lokasi.</li>
</ul>

<h2>5. Pembatalan dan Refund</h2>
<ul>
  <li>Pembatalan hanya dapat dilakukan jika status masih <em>pending payment</em>.</li>
  <li>Refund mengikuti kebijakan produk masing-masing dan dapat memerlukan review.</li>
  <li>Refund dapat dibatalkan jika tiket sudah digunakan atau produk tidak memenuhi syarat refund.</li>
</ul>

<h2>6. Retail Shop (Souvenir)</h2>
<ul>
  <li>Pesanan diproses setelah pembayaran terkonfirmasi.</li>
  <li>Status pengiriman mengikuti informasi yang tercantum di riwayat pesanan.</li>
  <li>Komplain barang harus disampaikan sesuai batas waktu yang berlaku.</li>
</ul>

<h2>7. Hak dan Kewajiban Pengguna</h2>
<ul>
  <li>Pengguna wajib memberikan data yang benar dan valid.</li>
  <li>Pengguna bertanggung jawab atas aktivitas penggunaan akun.</li>
  <li>Pengguna berhak mendapatkan layanan sesuai deskripsi produk.</li>
</ul>

<h2>8. Hak dan Kewajiban Mitra</h2>
<ul>
  <li>Mitra wajib menyediakan informasi produk yang akurat.</li>
  <li>Mitra bertanggung jawab atas pelaksanaan layanan di lapangan.</li>
  <li>Indotix berhak meninjau atau menonaktifkan produk yang melanggar ketentuan.</li>
</ul>

<h2>9. Perubahan Layanan</h2>
<p>Indotix dapat melakukan perubahan fitur atau kebijakan layanan untuk menjaga kualitas dan keamanan platform. Perubahan penting akan diumumkan melalui notifikasi atau kanal resmi.</p>

<h2>10. Pembatasan Tanggung Jawab</h2>
<p>Indotix tidak bertanggung jawab atas gangguan layanan yang disebabkan oleh kondisi di luar kendali (force majeure), termasuk bencana alam, gangguan jaringan, atau kebijakan pemerintah.</p>

<h2>11. Hukum yang Berlaku</h2>
<p>Syarat &amp; ketentuan ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia.</p>

<h2>12. Kontak</h2>
<p>Untuk pertanyaan atau bantuan, hubungi support@indotix.id atau gunakan live chat di aplikasi.</p>
HTML;

        PrivacyPolicy::create([
            'title' => 'Kebijakan Privasi Indotix',
            'content' => $content,
            'terms_content' => $termsContent,
            'version' => '1.0',
            'effective_at' => now()->toDateString(),
            'is_active' => true,
        ]);
    }
}
