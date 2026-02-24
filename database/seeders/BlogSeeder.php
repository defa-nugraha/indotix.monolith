<?php

namespace Database\Seeders;

use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BlogSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('role', 'admin')->first();

        $categories = collect([
            ['name' => 'Tips Perjalanan', 'description' => 'Panduan praktis sebelum berangkat'],
            ['name' => 'Rekomendasi Destinasi', 'description' => 'Destinasi unggulan dan trending'],
            ['name' => 'Kuliner Nusantara', 'description' => 'Referensi tempat makan terbaik'],
            ['name' => 'Event & Festival', 'description' => 'Agenda event populer'],
        ])->map(function (array $item) {
            return BlogCategory::query()->firstOrCreate(
                ['slug' => Str::slug($item['name'])],
                [
                    'name' => $item['name'],
                    'description' => $item['description'],
                    'is_active' => true,
                ]
            );
        });

        $tags = collect([
            'liburan',
            'staycation',
            'kuliner',
            'backpacker',
            'family-trip',
            'event',
            'hidden-gem',
        ])->map(function (string $name) {
            return BlogTag::query()->firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
        });

        $posts = [
            [
                'title' => '7 Tips Liburan Hemat Tapi Tetap Seru',
                'excerpt' => 'Rangkuman singkat agar liburan tetap nyaman meski budget terbatas.',
                'content' => '<p>Susun itinerary sejak awal, pilih tiket dengan harga terbaik, dan manfaatkan promo Indotix untuk menghemat biaya perjalanan.</p>',
                'label' => 'Highlight',
                'category_slug' => 'tips-perjalanan',
                'tags' => ['liburan', 'backpacker'],
            ],
            [
                'title' => 'Destinasi Favorit di Akhir Pekan',
                'excerpt' => 'Pilihan destinasi yang cocok untuk recharge akhir pekan.',
                'content' => '<p>Mulai dari wisata alam hingga city escape, jelajahi spot pilihan yang ramah keluarga.</p>',
                'label' => 'Trending',
                'category_slug' => 'rekomendasi-destinasi',
                'tags' => ['family-trip', 'hidden-gem'],
            ],
            [
                'title' => 'Kuliner Khas yang Wajib Dicoba',
                'excerpt' => 'Daftar makanan legendaris untuk menemani perjalananmu.',
                'content' => '<p>Nikmati kuliner khas dari berbagai daerah, lengkap dengan rekomendasi tempat terbaik.</p>',
                'label' => 'Kuliner',
                'category_slug' => 'kuliner-nusantara',
                'tags' => ['kuliner', 'staycation'],
            ],
            [
                'title' => 'Agenda Event Paling Dinanti',
                'excerpt' => 'Jadwal event yang wajib masuk list perjalanan tahun ini.',
                'content' => '<p>Cek kalender event terbaru dan dapatkan tiket lebih cepat lewat Indotix.</p>',
                'label' => 'Event',
                'category_slug' => 'event-festival',
                'tags' => ['event'],
            ],
        ];

        foreach ($posts as $post) {
            $category = $categories->firstWhere('slug', $post['category_slug']);
            $record = BlogPost::query()->firstOrCreate(
                ['slug' => Str::slug($post['title'])],
                [
                    'title' => $post['title'],
                    'excerpt' => $post['excerpt'],
                    'content' => $post['content'],
                    'label' => $post['label'],
                    'category_id' => $category?->id,
                    'author_id' => $admin?->id,
                    'status' => 'published',
                    'published_at' => now()->subDays(rand(0, 10)),
                ]
            );

            $tagIds = $tags
                ->filter(fn (BlogTag $tag) => in_array($tag->name, $post['tags'], true))
                ->pluck('id')
                ->all();

            $record->tags()->sync($tagIds);
        }
    }
}
