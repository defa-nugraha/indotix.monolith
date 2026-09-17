<?php

// Documentation fixtures are deliberately restricted to a dedicated local database.
require dirname(__DIR__, 3).'/vendor/autoload.php';
$app = require dirname(__DIR__, 3).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (! $app->environment('local') || config('database.connections.mysql.database') !== 'indotix_user_guide'
    || ! in_array(config('database.connections.mysql.host'), ['127.0.0.1', 'localhost'], true)
    || (int) config('database.connections.mysql.port') !== 13316) {
    throw new RuntimeException('Fixtures require local indotix_user_guide on 127.0.0.1:13316.');
}
$password = getenv('GUIDE_PASSWORD');
if (! $password || strlen($password) < 12) {
    throw new RuntimeException('Set GUIDE_PASSWORD to a temporary password of at least 12 characters.');
}
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataTicket;
use App\Models\WisataBooking;
use App\Models\WisataBookingItem;
use App\Models\WisataTicketScan;
use App\Models\WisataCommissionRule;
use App\Models\WisataPayout;
use App\Models\ProductReview;
use App\Models\UserNotification;
use App\Models\ChatConversation;
use App\Models\ChatMessage;

DB::transaction(function () use ($password) {
    DB::table('provinces')->updateOrInsert(['code' => '32'], ['name' => 'JAWA BARAT']);
    DB::table('regencies')->updateOrInsert(['code' => '3210'], ['province_code' => '32', 'name' => 'KABUPATEN MAJALENGKA', 'type' => 'Kabupaten']);
    $owner = User::updateOrCreate(['email' => 'pengelola@example.com'], [
        'name' => 'Pengelola Telaga Biru', 'phone' => '080000000001', 'password' => $password,
        'role' => 'mitra', 'mitra_onboarding_type' => 'wisata', 'email_verified_at' => now(),
    ]);
    $visitor = User::updateOrCreate(['email' => 'pengunjung@example.com'], [
        'name' => 'Pengunjung Telaga', 'phone' => '080000000002', 'password' => $password,
        'role' => 'user', 'email_verified_at' => now(),
    ]);
    $owner->forceFill(['email_verified_at' => now()])->save();
    $visitor->forceFill(['email_verified_at' => now()])->save();
    User::updateOrCreate(['email' => 'pendaftaran@example.com'], [
        'name' => 'Pengelola Wisata Baru', 'phone' => '080000000003', 'password' => $password,
        'role' => 'mitra', 'mitra_onboarding_type' => null, 'email_verified_at' => null,
    ]);
    $destination = MitraWisataOnboarding::updateOrCreate(['user_id' => $owner->id], [
        'current_step' => 3, 'responsible_name' => 'Pengelola Telaga Biru', 'responsible_phone' => '080000000001',
        'responsible_role' => 'owner', 'destination_name' => 'Telaga Biru Majalengka', 'destination_type' => 'alam',
        'description' => 'Nikmati wisata alam bersama keluarga, area berjalan santai, dan pemandangan telaga.',
        'highlights' => 'Pemandangan telaga dan area rekreasi keluarga.', 'province_code' => '32', 'city_code' => '3210',
        'address_full' => 'Kawasan Wisata Telaga Biru, Majalengka, Jawa Barat',
        'maps_pin_url' => 'https://maps.google.com/?q=Majalengka',
        'open_days' => ['mon','tue','wed','thu','fri','sat','sun'],
        'open_time' => '08:00', 'close_time' => '17:00', 'facilities' => ['toilet','mushola','parkir'],
        'contact_phone' => '080000000001', 'contact_hours' => '08:00-17:00',
        'bank_name' => 'Bank Mandiri', 'bank_account_number' => '000000000000', 'bank_account_name' => 'Pengelola Telaga Biru',
        'legal_doc_type' => 'nib', 'legal_doc_number' => 'CONTOH-DOKUMEN',
        'verification_status' => 'verified', 'payout_status' => 'verified', 'is_live' => true,
        'is_suspended' => false, 'is_temporarily_closed' => false,
    ]);
    $ticket = WisataTicket::updateOrCreate(['mitra_wisata_onboarding_id' => $destination->id, 'name' => 'Tiket Masuk Reguler'], [
        'description' => 'Akses masuk kawasan wisata untuk satu pengunjung.', 'price' => 35000, 'quota' => 500,
        'daily_quota' => 150, 'ticket_type' => 'perorangan', 'ticket_kind' => 'single',
        'is_active' => true, 'is_closed' => false, 'min_order_quantity' => 1, 'max_order_quantity' => 10,
    ]);
    foreach (['paid', 'pending_payment', 'completed', 'cancelled'] as $i => $status) {
        $booking = WisataBooking::updateOrCreate(['booking_code' => 'WST-PANDUAN-'.str_pad((string) ($i+1), 3, '0', STR_PAD_LEFT)], [
            'user_id' => $visitor->id, 'mitra_wisata_onboarding_id' => $destination->id, 'wisata_ticket_id' => $ticket->id,
            'visit_date' => today(), 'quantity' => 2, 'unit_price' => 35000, 'total_price' => 70000,
            'subtotal_price' => 70000, 'status' => $status, 'guest_name' => $visitor->name, 'guest_email' => $visitor->email,
        ]);
        $item = WisataBookingItem::updateOrCreate(['wisata_booking_id' => $booking->id, 'wisata_ticket_id' => $ticket->id], [
            'ticket_name' => $ticket->name, 'quantity' => 2, 'unit_price' => 35000, 'subtotal' => 70000,
        ]);
        if ($status === 'completed') {
            WisataTicketScan::updateOrCreate(['wisata_booking_id' => $booking->id], [
                'scanned_at' => now(), 'officer_name' => 'Pengunjung Telaga', 'location' => 'Gerbang Utama',
                'quantity' => 2, 'is_anomaly' => false,
            ]);
        }
    }
    WisataCommissionRule::updateOrCreate(['mitra_wisata_onboarding_id' => $destination->id], ['type' => 'percentage', 'value' => 10, 'is_forever' => true]);
    WisataPayout::updateOrCreate(['mitra_wisata_onboarding_id' => $destination->id, 'period_start' => today()->startOfMonth()], [
        'period_end' => today(), 'total_gmv' => 140000, 'commission_amount' => 14000, 'net_payout' => 126000, 'status' => 'pending',
    ]);
    ProductReview::updateOrCreate(['product_type' => 'wisata', 'product_id' => $destination->id, 'user_id' => $visitor->id], [
        'rating' => 5, 'comment' => 'Pemandangan indah dan petugas membantu proses masuk dengan baik.', 'status' => 'active',
    ]);
    UserNotification::updateOrCreate(['user_id' => $owner->id, 'title' => 'Booking wisata baru'], [
        'message' => 'Dua tiket masuk reguler telah dipesan untuk kunjungan hari ini.', 'type' => 'booking', 'is_read' => false,
    ]);
    $chat = ChatConversation::updateOrCreate(['user_id' => $visitor->id, 'partner_id' => $owner->id, 'subject_type' => 'wisata', 'subject_id' => $destination->id], [
        'status' => 'open', 'last_message_at' => now(),
    ]);
    ChatMessage::firstOrCreate(['conversation_id' => $chat->id, 'sender_id' => $visitor->id, 'body' => 'Selamat pagi. Apakah destinasi buka pada akhir pekan?']);
});
echo "Documentation fixtures ready. No production data used.\n";
