<?php

namespace Database\Seeders;

use App\Models\AcademyClass;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\CommissionRule;
use App\Models\Event;
use App\Models\EventCommission;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\ProductReview;
use App\Models\ProductReviewMedia;
use App\Models\PromoItem;
use App\Models\PromoVideo;
use App\Models\PublicBanner;
use App\Models\PublicContact;
use App\Models\PublicPartner;
use App\Models\SouvenirProduct;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramFacility;
use App\Models\SpecialProgramInventory;
use App\Models\SpecialProgramVariant;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\WisataCommissionRule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class CompleteFeatureDemoSeeder extends Seeder
{
    private const IMAGES = [
        'banner_wisata' => 'https://picsum.photos/seed/indotix-wisata/1400/600',
        'banner_hotel' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
        'event' => 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80',
        'academy' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
        'special' => 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80',
        'retail' => 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=80',
        'review' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
        'partner' => 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=700&q=80',
        'profile' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80',
    ];

    public function run(): void
    {
        $admin = $this->verifiedUser('Admin Demo Seeder', 'admin.demo@indotix.id', 'admin', '081200009001');
        $user = $this->verifiedUser('User Demo Seeder', 'user.demo@indotix.id', 'user', '081200009002');
        $this->seedUserAddress($user);
        $this->seedPublicContent();
        $this->seedSystemSettings($admin);
        $this->seedSpecialProgramProduct($admin);
        $this->seedCommissions($admin);
        $this->seedReviews($user, $admin);
        $this->seedLiveChat($user);
    }

    private function verifiedUser(string $name, string $email, string $role, string $phone): User
    {
        return User::query()->updateOrCreate(
            ['email' => $email],
            $this->tablePayload('users', [
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'gender' => 'male',
                'role' => $role,
                'password' => 'password',
                'email_verified_at' => now(),
                'is_suspended' => false,
            ])
        );
    }

    private function seedUserAddress(User $user): void
    {
        UserAddress::query()->updateOrCreate(
            ['user_id' => $user->id, 'label' => 'Rumah'],
            $this->tablePayload('user_addresses', [
                'user_id' => $user->id,
                'label' => 'Rumah',
                'recipient_name' => $user->name,
                'phone' => $user->phone ?: '081200009002',
                'address_line' => 'Jl. Asia Afrika No. 10',
                'village' => 'Braga',
                'district' => 'Sumur Bandung',
                'city' => 'Kota Bandung',
                'province' => 'Jawa Barat',
                'postal_code' => '40111',
                'notes' => 'Alamat demo untuk pengujian checkout retail.',
                'is_default' => true,
            ])
        );
    }

    private function seedPublicContent(): void
    {
        $banners = [
            [
                'title' => 'Jelajahi Wisata Pilihan Indonesia',
                'image_path' => $this->remoteImage('seeders/public/banner-wisata-hero-v2.jpg', self::IMAGES['banner_wisata']),
                'link_url' => '/wisata',
                'sort_order' => 1,
            ],
            [
                'title' => 'Hotel Nyaman untuk Liburanmu',
                'image_path' => $this->remoteImage('seeders/public/banner-hotel.jpg', self::IMAGES['banner_hotel']),
                'link_url' => '/stay',
                'sort_order' => 2,
            ],
        ];

        foreach ($banners as $banner) {
            PublicBanner::query()->updateOrCreate(
                ['title' => $banner['title']],
                $this->tablePayload('public_banners', $banner + ['is_active' => true])
            );
        }

        PromoVideo::query()->updateOrCreate(
            ['title' => 'Temukan pengalaman terbaik bersama Indotix'],
            $this->tablePayload('promo_videos', [
                'title' => 'Temukan pengalaman terbaik bersama Indotix',
                'description' => 'Cari tiket wisata, event, hotel, academy, special program, dan retail shop dalam satu platform.',
                'image_path' => $this->remoteImage('seeders/public/promo-video-cover.jpg', self::IMAGES['event']),
                'secondary_video_path' => null,
                'cta_label' => 'Lihat Produk',
                'cta_url' => '/wisata',
                'is_active' => true,
            ])
        );

        $promoItems = [
            [
                'title' => 'Promo Wisata Keluarga',
                'slug' => 'promo-wisata-keluarga',
                'category' => 'wisata',
                'excerpt' => 'Penawaran tiket wisata untuk liburan keluarga.',
                'description' => 'Nikmati promo pilihan untuk pembelian tiket destinasi wisata keluarga di Indotix. Promo ini cocok untuk rencana liburan singkat, akhir pekan, atau agenda rekreasi bersama keluarga.',
                'terms' => "Berlaku untuk produk wisata aktif di Indotix.\nKuota promo terbatas.\nPromo mengikuti ketentuan transaksi yang berlaku.",
                'image_path' => $this->remoteImage('seeders/public/promo-wisata.jpg', self::IMAGES['banner_wisata']),
                'link_url' => '/wisata',
                'sort_order' => 1,
                'starts_at' => now()->subDay()->toDateString(),
                'ends_at' => now()->addMonths(2)->toDateString(),
            ],
            [
                'title' => 'Liburan Akhir Pekan',
                'slug' => 'liburan-akhir-pekan',
                'category' => 'musiman',
                'excerpt' => 'Inspirasi promo untuk rencana liburan akhir pekan.',
                'description' => 'Temukan destinasi wisata yang cocok untuk akhir pekan dan manfaatkan promo aktif yang tersedia di Indotix.',
                'terms' => "Berlaku selama periode promo.\nKetersediaan tiket mengikuti kuota setiap destinasi.\nPromo tidak dapat digabungkan dengan penawaran lain kecuali disebutkan berbeda.",
                'image_path' => $this->remoteImage('seeders/public/promo-event.jpg', self::IMAGES['event']),
                'link_url' => '/wisata',
                'sort_order' => 2,
                'starts_at' => now()->subDay()->toDateString(),
                'ends_at' => now()->addMonth()->toDateString(),
            ],
            [
                'title' => 'Pengguna Baru Lebih Hemat',
                'slug' => 'pengguna-baru-lebih-hemat',
                'category' => 'pengguna_baru',
                'excerpt' => 'Promo khusus untuk pengalaman transaksi pertama.',
                'description' => 'Mulai perjalanan pertamamu di Indotix dengan promo khusus pengguna baru. Pilih destinasi wisata, ikuti alur pemesanan, dan gunakan promo yang tersedia.',
                'terms' => "Berlaku untuk pengguna baru sesuai ketentuan sistem.\nSatu akun hanya dapat menggunakan promo sesuai limit yang berlaku.\nIndotix dapat menyesuaikan promo berdasarkan ketersediaan kuota.",
                'image_path' => $this->remoteImage('seeders/public/promo-retail.jpg', self::IMAGES['retail']),
                'link_url' => '/wisata',
                'sort_order' => 3,
                'starts_at' => now()->subDay()->toDateString(),
                'ends_at' => now()->addMonths(3)->toDateString(),
            ],
        ];

        foreach ($promoItems as $item) {
            PromoItem::query()->updateOrCreate(
                ['title' => $item['title']],
                $this->tablePayload('promo_items', $item + ['is_active' => true])
            );
        }

        PublicContact::query()->updateOrCreate(
            ['email' => 'hello@indotix.id'],
            $this->tablePayload('public_contacts', [
                'company_name' => 'INDOTIX',
                'address' => 'Jakarta, Indonesia',
                'phone' => '+62 812-0000-9000',
                'email' => 'hello@indotix.id',
                'download_url' => '/download',
                'instagram_url' => 'https://instagram.com/indotix',
                'facebook_url' => 'https://facebook.com/indotix',
                'twitter_url' => 'https://twitter.com/indotix',
                'tiktok_url' => 'https://tiktok.com/@indotix',
                'youtube_url' => 'https://youtube.com/@indotix',
            ])
        );

        PublicPartner::query()->updateOrCreate(
            ['name' => 'Partner Demo Indotix'],
            $this->tablePayload('public_partners', [
                'name' => 'Partner Demo Indotix',
                'image_path' => $this->remoteImage('seeders/public/partner-demo.jpg', self::IMAGES['partner']),
                'link_url' => 'https://indotix.id',
                'sort_order' => 1,
                'is_active' => true,
            ])
        );
    }

    private function seedSystemSettings(User $admin): void
    {
        $settings = [
            'booking_timeout_minutes' => ['15', 'integer'],
            'hotel_booking_timeout_minutes' => ['15', 'integer'],
            'wisata_booking_timeout_minutes' => ['15', 'integer'],
            'event_booking_timeout_minutes' => ['15', 'integer'],
            'academy_booking_timeout_minutes' => ['15', 'integer'],
            'special_program_booking_timeout_minutes' => ['15', 'integer'],
            'retail_shop_booking_timeout_minutes' => ['15', 'integer'],
            'public_whatsapp_number' => ['6281200009000', 'string'],
        ];

        foreach ($settings as $key => [$value, $type]) {
            SystemSetting::query()->updateOrCreate(
                ['key' => $key],
                $this->tablePayload('system_settings', [
                    'key' => $key,
                    'value' => $value,
                    'type' => $type,
                    'updated_by' => $admin->id,
                ])
            );
        }
    }

    private function seedSpecialProgramProduct(User $admin): void
    {
        if (! Schema::hasTable('special_programs')) {
            return;
        }

        $program = SpecialProgram::query()->updateOrCreate(
            ['name' => 'Jumbo Juni Makin Heboh'],
            $this->tablePayload('special_programs', [
                'name' => 'Jumbo Juni Makin Heboh',
                'category' => 'Paket Liburan',
                'description' => 'Paket special program demo untuk keluarga dengan benefit tiket, merchandise, dan akses prioritas.',
                'description_internal' => 'Data demo untuk pengujian special program.',
                'base_price' => 250000,
                'capacity' => 500,
                'image_path' => $this->remoteImage('seeders/special-programs/jumbo-juni.jpg', self::IMAGES['special']),
                'program_type' => 'package',
                'starts_at' => now()->addDays(7)->toDateString(),
                'ends_at' => now()->addDays(30)->toDateString(),
                'status' => 'published',
                'is_active' => true,
                'scope' => ['wisata', 'event'],
                'rules' => ['Berlaku untuk pembelian selama periode promo.'],
                'discount' => ['type' => 'percentage', 'value' => 10],
                'visibility' => ['homepage' => true, 'public' => true],
                'budget' => ['limit' => 50000000],
                'compliance' => ['reviewed' => true],
                'terms' => 'Benefit tidak dapat diuangkan dan mengikuti ketersediaan kuota.',
                'priority' => 10,
                'highlight_level' => 'featured',
                'created_by' => $admin->id,
                'updated_by' => $admin->id,
            ])
        );

        SpecialProgramVariant::query()->updateOrCreate(
            ['special_program_id' => $program->id, 'name' => 'Regular Pass'],
            $this->tablePayload('special_program_variants', [
                'special_program_id' => $program->id,
                'name' => 'Regular Pass',
                'price' => 250000,
                'capacity' => 300,
                'sort_order' => 1,
            ])
        );

        SpecialProgramVariant::query()->updateOrCreate(
            ['special_program_id' => $program->id, 'name' => 'Family Pass'],
            $this->tablePayload('special_program_variants', [
                'special_program_id' => $program->id,
                'name' => 'Family Pass',
                'price' => 850000,
                'capacity' => 100,
                'sort_order' => 2,
            ])
        );

        foreach (['Akses prioritas di lokasi', 'Merchandise eksklusif', 'Bantuan customer support Indotix'] as $index => $facility) {
            SpecialProgramFacility::query()->updateOrCreate(
                ['special_program_id' => $program->id, 'content' => $facility],
                $this->tablePayload('special_program_facilities', [
                    'special_program_id' => $program->id,
                    'content' => $facility,
                    'sort_order' => $index + 1,
                ])
            );
        }

        foreach ([7, 14, 21] as $offset) {
            SpecialProgramInventory::query()->updateOrCreate(
                ['special_program_id' => $program->id, 'date' => now()->addDays($offset)->toDateString()],
                $this->tablePayload('special_program_inventories', [
                    'special_program_id' => $program->id,
                    'date' => now()->addDays($offset)->toDateString(),
                    'capacity' => 150,
                ])
            );
        }
    }

    private function seedCommissions(User $admin): void
    {
        $hotel = Hotel::query()->first();
        if ($hotel) {
            CommissionRule::query()->updateOrCreate(
                ['hotel_id' => $hotel->id, 'type' => 'percentage'],
                $this->tablePayload('commission_rules', [
                    'hotel_id' => $hotel->id,
                    'type' => 'percentage',
                    'value' => 10,
                    'starts_at' => null,
                    'ends_at' => null,
                    'is_forever' => true,
                    'is_active' => true,
                    'created_by' => $admin->id,
                    'updated_by' => $admin->id,
                ])
            );
        }

        $destination = MitraWisataOnboarding::query()->first();
        if ($destination) {
            WisataCommissionRule::query()->updateOrCreate(
                ['mitra_wisata_onboarding_id' => $destination->id, 'type' => 'percentage'],
                $this->tablePayload('wisata_commission_rules', [
                    'mitra_wisata_onboarding_id' => $destination->id,
                    'type' => 'percentage',
                    'value' => 10,
                    'start_date' => null,
                    'end_date' => null,
                    'is_forever' => true,
                    'created_by' => $admin->id,
                    'updated_by' => $admin->id,
                ])
            );
        }

        $event = Event::query()->where('event_type', 'event')->first();
        if ($event) {
            EventCommission::query()->updateOrCreate(
                ['event_id' => $event->id, 'type' => 'percentage'],
                $this->tablePayload('event_commissions', [
                    'event_id' => $event->id,
                    'type' => 'percentage',
                    'value' => 10,
                    'starts_at' => null,
                    'ends_at' => null,
                    'is_forever' => true,
                    'created_by' => $admin->id,
                    'updated_by' => $admin->id,
                ])
            );
        }
    }

    private function seedReviews(User $user, User $admin): void
    {
        $items = [
            ['hotel', Hotel::query()->value('id'), 'Hotelnya nyaman, proses booking mudah, dan informasi kamar jelas.'],
            ['wisata', MitraWisataOnboarding::query()->value('id'), 'Destinasinya cocok untuk keluarga dan tiket mudah digunakan.'],
            ['event', Event::query()->where('event_type', 'event')->value('id'), 'Event berjalan rapi, e-ticket cepat masuk ke akun.'],
            ['academy', AcademyClass::query()->value('id'), 'Materi kelas mudah dipahami dan cocok untuk pemula.'],
            ['souvenir', SouvenirProduct::query()->value('id'), 'Produk dikemas rapi dan status pesanan mudah dipantau.'],
            ['special_program', SpecialProgram::query()->value('id'), 'Benefit program jelas dan pilihan paketnya menarik.'],
        ];

        foreach ($items as [$type, $id, $comment]) {
            if (! $id) {
                continue;
            }

            $review = ProductReview::query()->updateOrCreate(
                ['user_id' => $user->id, 'product_type' => $type, 'product_id' => $id],
                $this->tablePayload('product_reviews', [
                    'product_type' => $type,
                    'product_id' => $id,
                    'user_id' => $user->id,
                    'rating' => 5,
                    'comment' => $comment,
                    'status' => 'active',
                    'reply' => 'Terima kasih atas ulasannya. Semoga pengalaman berikutnya semakin menyenangkan.',
                    'replied_by' => $admin->id,
                    'replied_at' => now(),
                ])
            );

            ProductReviewMedia::query()->updateOrCreate(
                ['product_review_id' => $review->id, 'sort_order' => 1],
                $this->tablePayload('product_review_media', [
                    'product_review_id' => $review->id,
                    'type' => 'image',
                    'path' => $this->remoteImage("seeders/reviews/{$type}-review.jpg", self::IMAGES['review']),
                    'thumbnail_path' => null,
                    'mime' => 'image/jpeg',
                    'size' => null,
                    'sort_order' => 1,
                ])
            );
        }
    }

    private function seedLiveChat(User $user): void
    {
        $partner = User::query()
            ->whereIn('role', ['mitra', 'mitra_hotel', 'mitra_wisata', 'mitra_event'])
            ->where('id', '!=', $user->id)
            ->first()
            ?? User::query()->where('role', 'admin')->first();

        if (! $partner) {
            return;
        }

        $hotel = Hotel::query()->first();

        $conversation = ChatConversation::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'partner_id' => $partner->id,
                'subject_type' => 'hotel',
                'subject_id' => $hotel?->id,
            ],
            $this->tablePayload('chat_conversations', [
                'user_id' => $user->id,
                'partner_id' => $partner->id,
                'subject_type' => 'hotel',
                'subject_id' => $hotel?->id,
                'status' => 'open',
                'last_message_at' => now(),
            ])
        );

        ChatMessage::query()->updateOrCreate(
            ['conversation_id' => $conversation->id, 'sender_id' => $user->id, 'body' => 'Halo, apakah kamar masih tersedia untuk akhir pekan?'],
            $this->tablePayload('chat_messages', [
                'conversation_id' => $conversation->id,
                'sender_id' => $user->id,
                'body' => 'Halo, apakah kamar masih tersedia untuk akhir pekan?',
                'read_at' => now(),
            ])
        );

        ChatMessage::query()->updateOrCreate(
            ['conversation_id' => $conversation->id, 'sender_id' => $partner->id, 'body' => 'Halo, kamar masih tersedia. Silakan pilih tanggal check-in dan check-out di halaman hotel.'],
            $this->tablePayload('chat_messages', [
                'conversation_id' => $conversation->id,
                'sender_id' => $partner->id,
                'body' => 'Halo, kamar masih tersedia. Silakan pilih tanggal check-in dan check-out di halaman hotel.',
                'read_at' => null,
            ])
        );
    }

    private function remoteImage(string $path, string $url): string
    {
        if (Storage::disk('public')->exists($path)) {
            return $path;
        }

        try {
            $response = Http::timeout(15)->get($url);

            if ($response->successful() && $response->body() !== '') {
                Storage::disk('public')->put($path, $response->body());

                return $path;
            }
        } catch (Throwable) {
            // Fallback below keeps the seeder usable without internet access.
        }

        Storage::disk('public')->put($path, $this->placeholderSvg());

        return $path;
    }

    private function tablePayload(string $table, array $payload): array
    {
        if (! Schema::hasTable($table)) {
            return $payload;
        }

        return collect($payload)
            ->filter(fn ($value, $column) => Schema::hasColumn($table, (string) $column))
            ->all();
    }

    private function placeholderSvg(): string
    {
        $id = Str::upper(Str::random(4));

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <rect width="1200" height="675" fill="#e8f5fc"/>
  <rect x="80" y="80" width="1040" height="515" rx="28" fill="#ffffff" stroke="#8ccbea" stroke-width="4"/>
  <text x="600" y="316" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" fill="#008fd3">INDOTIX</text>
  <text x="600" y="378" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#5c7282">Demo Image {$id}</text>
</svg>
SVG;
    }
}
