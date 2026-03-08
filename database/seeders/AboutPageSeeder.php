<?php

namespace Database\Seeders;

use App\Models\AboutPage;
use Illuminate\Database\Seeder;

class AboutPageSeeder extends Seeder
{
    public function run(): void
    {
        AboutPage::query()->firstOrCreate([], [
            'title' => 'Tentang Indotix',
            'content' => <<<HTML
<h2>Platform Pemesanan Terpercaya</h2>
<p>Indotix adalah platform digital untuk pemesanan wisata, hotel, event, special program, kelas academy, dan retail shop di Indonesia. Kami membantu pengguna menemukan pengalaman terbaik dengan proses booking yang aman, cepat, dan transparan.</p>

<h2>Misi Kami</h2>
<ul>
  <li>Mempermudah akses ke produk wisata dan hiburan berkualitas.</li>
  <li>Mendukung mitra lokal untuk tumbuh melalui kanal digital.</li>
  <li>Menghadirkan pengalaman pemesanan yang nyaman dan terpercaya.</li>
</ul>

<h2>Nilai Utama</h2>
<ul>
  <li><strong>Keamanan</strong>: transaksi terlindungi melalui payment gateway resmi.</li>
  <li><strong>Transparansi</strong>: informasi harga dan ketersediaan tampil jelas.</li>
  <li><strong>Pelayanan</strong>: dukungan pelanggan untuk membantu setiap langkah perjalanan.</li>
</ul>

<h2>Komitmen Layanan</h2>
<p>Kami terus meningkatkan kualitas layanan, mulai dari proses booking, sistem pembayaran, hingga dukungan pasca transaksi. Indotix hadir untuk membuat perjalanan, event, dan pengalaman Anda lebih mudah dan menyenangkan.</p>
HTML,
            'is_active' => true,
        ]);
    }
}
