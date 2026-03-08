<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        Faq::query()->delete();

        $items = [
            [
                'question' => 'Bagaimana cara melakukan booking wisata?',
                'answer' => 'Pilih destinasi, tentukan tiket dan tanggal kunjungan, isi data tamu, lalu lanjutkan ke pembayaran. Setelah pembayaran sukses, tiket akan muncul di riwayat dan tersedia untuk diunduh.',
                'category' => 'Wisata',
                'sort_order' => 1,
            ],
            [
                'question' => 'Bagaimana cara membayar pesanan saya?',
                'answer' => 'Pembayaran dilakukan melalui Midtrans Snap. Setelah klik "Lanjutkan Pembayaran", Anda akan diarahkan ke metode pembayaran yang tersedia.',
                'category' => 'Pembayaran',
                'sort_order' => 2,
            ],
            [
                'question' => 'Apakah tiket bisa dibatalkan?',
                'answer' => 'Pembatalan hanya dapat dilakukan jika status masih pending payment. Untuk tiket yang sudah dibayar, mengikuti kebijakan refund pada produk masing-masing.',
                'category' => 'Pembatalan',
                'sort_order' => 3,
            ],
            [
                'question' => 'Bagaimana validasi tiket di lokasi?',
                'answer' => 'Petugas akan memindai QR code pada tiket Anda. Pastikan tiket belum pernah digunakan dan sesuai jadwal kunjungan.',
                'category' => 'Tiket',
                'sort_order' => 4,
            ],
            [
                'question' => 'Bagaimana cara memesan hotel?',
                'answer' => 'Pilih hotel dan tipe kamar, tentukan tanggal check-in/check-out serta jumlah tamu, lalu lanjutkan pembayaran.',
                'category' => 'Hotel',
                'sort_order' => 5,
            ],
            [
                'question' => 'Bagaimana cara membeli tiket event?',
                'answer' => 'Masuk ke halaman event, pilih jenis tiket dan jumlah, lalu lanjutkan pembayaran. QR code akan tersedia setelah pembayaran sukses.',
                'category' => 'Event',
                'sort_order' => 6,
            ],
            [
                'question' => 'Apa itu Special Program?',
                'answer' => 'Special Program adalah campaign promo atau highlight produk tertentu dengan benefit khusus, seperti diskon atau subsidi.',
                'category' => 'Special Program',
                'sort_order' => 7,
            ],
            [
                'question' => 'Bagaimana cara memesan kelas di Eljohn Academy?',
                'answer' => 'Pilih kelas, pilih tiket, isi data peserta, lalu lanjutkan pembayaran. Tiket kelas akan tersedia di riwayat setelah pembayaran sukses.',
                'category' => 'Academy',
                'sort_order' => 8,
            ],
            [
                'question' => 'Bagaimana cara membeli produk di Retail Shop?',
                'answer' => 'Masukkan produk ke keranjang, atur jumlah, lalu lanjutkan checkout dan pembayaran. Status pengiriman dapat dilihat di riwayat.',
                'category' => 'Retail Shop',
                'sort_order' => 9,
            ],
            [
                'question' => 'Apakah saya bisa memberikan ulasan?',
                'answer' => 'Ulasan hanya dapat diberikan setelah transaksi selesai dan tiket sudah digunakan (atau pesanan souvenir sudah sampai).',
                'category' => 'Ulasan',
                'sort_order' => 10,
            ],
            [
                'question' => 'Apakah data pribadi saya aman?',
                'answer' => 'Kami menggunakan langkah-langkah keamanan teknis dan organisasi untuk melindungi data Anda sesuai kebijakan privasi.',
                'category' => 'Akun',
                'sort_order' => 11,
            ],
            [
                'question' => 'Bagaimana menghubungi bantuan?',
                'answer' => 'Anda dapat menggunakan fitur live chat atau menghubungi kontak resmi pada halaman profil dan bantuan.',
                'category' => 'Bantuan',
                'sort_order' => 12,
            ],
        ];

        foreach ($items as $item) {
            Faq::create([
                'question' => $item['question'],
                'answer' => $item['answer'],
                'category' => $item['category'],
                'sort_order' => $item['sort_order'],
                'is_active' => true,
            ]);
        }
    }
}
