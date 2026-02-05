<?php

namespace Database\Seeders;

use App\Models\SouvenirAuditLog;
use App\Models\SouvenirCategory;
use App\Models\SouvenirOrder;
use App\Models\SouvenirOrderItem;
use App\Models\SouvenirProduct;
use App\Models\SouvenirProductImage;
use App\Models\SouvenirPromotion;
use App\Models\SouvenirRefund;
use App\Models\SouvenirStockMovement;
use App\Models\SouvenirVariant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class SouvenirSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        SouvenirRefund::query()->delete();
        SouvenirOrderItem::query()->delete();
        SouvenirOrder::query()->delete();
        SouvenirStockMovement::query()->delete();
        SouvenirVariant::query()->delete();
        SouvenirProduct::query()->delete();
        SouvenirCategory::query()->delete();
        SouvenirPromotion::query()->delete();
        SouvenirAuditLog::query()->delete();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $user = User::query()->find(3) ?? User::query()->first();
        $userId = $user?->id;

        $categories = collect([
            'Aksesoris',
            'Kerajinan',
            'Fashion',
            'Makanan Khas',
        ])->map(fn (string $name) => SouvenirCategory::create([
            'name' => $name,
            'is_active' => true,
        ]));

        $products = collect([
            [
                'name' => 'Gantungan Kunci Nusantara',
                'category' => 'Aksesoris',
                'price' => 25000,
                'cost_price' => 12000,
                'sku' => 'AKS-001',
                'weight' => 100,
                'stock' => 120,
                'min_stock' => 10,
                'status' => 'active',
            ],
            [
                'name' => 'Tas Anyaman Bali',
                'category' => 'Fashion',
                'price' => 175000,
                'cost_price' => 95000,
                'sku' => 'FSH-002',
                'weight' => 700,
                'stock' => 45,
                'min_stock' => 5,
                'status' => 'active',
            ],
            [
                'name' => 'Patung Kayu Mini',
                'category' => 'Kerajinan',
                'price' => 90000,
                'cost_price' => 50000,
                'sku' => 'KRJ-003',
                'weight' => 450,
                'stock' => 30,
                'min_stock' => 3,
                'status' => 'active',
            ],
            [
                'name' => 'Kopi Gayo Premium 250g',
                'category' => 'Makanan Khas',
                'price' => 78000,
                'cost_price' => 42000,
                'sku' => 'MKN-004',
                'weight' => 300,
                'stock' => 80,
                'min_stock' => 8,
                'status' => 'active',
            ],
        ])->map(function (array $data) use ($categories, $userId) {
            $category = $categories->firstWhere('name', $data['category']);

            return SouvenirProduct::create([
                'name' => $data['name'],
                'category_id' => $category?->id,
                'description' => 'Produk unggulan '.$data['name'].'.',
                'price' => $data['price'],
                'cost_price' => $data['cost_price'],
                'sku' => $data['sku'],
                'weight' => $data['weight'],
                'length' => 20,
                'width' => 12,
                'height' => 8,
                'status' => $data['status'],
                'is_active' => $data['status'] === 'active',
                'min_stock' => $data['min_stock'],
                'stock' => $data['stock'],
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        });

        $imageSets = [
            'Gantungan Kunci Nusantara' => [
                'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80',
            ],
            'Tas Anyaman Bali' => [
                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
            ],
            'Patung Kayu Mini' => [
                'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80',
            ],
            'Kopi Gayo Premium 250g' => [
                'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=1200&q=80',
            ],
        ];

        foreach ($products as $product) {
            $urls = $imageSets[$product->name] ?? [];
            $order = 1;
            foreach ($urls as $url) {
                try {
                    $response = Http::timeout(10)->get($url);
                    if (! $response->successful()) {
                        continue;
                    }
                    $path = 'souvenir-products/seed-'.strtolower(preg_replace('/\\W+/', '-', $product->sku)).'-'.$order.'.jpg';
                    Storage::disk('public')->put($path, $response->body());
                    SouvenirProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $path,
                        'sort_order' => $order,
                    ]);
                    $order++;
                } catch (\Throwable $exception) {
                    continue;
                }
            }
        }

        $variantA = SouvenirVariant::create([
            'product_id' => $products[0]->id,
            'variant_type' => 'warna',
            'name' => 'Merah',
            'sku' => 'AKS-001-RD',
            'additional_price' => 0,
            'stock' => 40,
            'is_active' => true,
        ]);

        $variantB = SouvenirVariant::create([
            'product_id' => $products[0]->id,
            'variant_type' => 'warna',
            'name' => 'Biru',
            'sku' => 'AKS-001-BL',
            'additional_price' => 0,
            'stock' => 30,
            'is_active' => true,
        ]);

        $variantC = SouvenirVariant::create([
            'product_id' => $products[1]->id,
            'variant_type' => 'ukuran',
            'name' => 'Medium',
            'sku' => 'FSH-002-M',
            'additional_price' => 0,
            'stock' => 20,
            'is_active' => true,
        ]);

        $variantD = SouvenirVariant::create([
            'product_id' => $products[1]->id,
            'variant_type' => 'ukuran',
            'name' => 'Large',
            'sku' => 'FSH-002-L',
            'additional_price' => 15000,
            'stock' => 15,
            'is_active' => true,
        ]);

        foreach ($products as $product) {
            SouvenirStockMovement::create([
                'product_id' => $product->id,
                'type' => 'in',
                'quantity' => $product->stock,
                'note' => 'Stok awal',
                'created_by' => $userId,
            ]);
        }

        SouvenirStockMovement::create([
            'product_id' => $products[0]->id,
            'variant_id' => $variantA->id,
            'type' => 'in',
            'quantity' => 40,
            'note' => 'Stok awal varian',
            'created_by' => $userId,
        ]);

        SouvenirStockMovement::create([
            'product_id' => $products[0]->id,
            'variant_id' => $variantB->id,
            'type' => 'in',
            'quantity' => 30,
            'note' => 'Stok awal varian',
            'created_by' => $userId,
        ]);

        SouvenirStockMovement::create([
            'product_id' => $products[1]->id,
            'variant_id' => $variantC->id,
            'type' => 'in',
            'quantity' => 20,
            'note' => 'Stok awal varian',
            'created_by' => $userId,
        ]);

        SouvenirStockMovement::create([
            'product_id' => $products[1]->id,
            'variant_id' => $variantD->id,
            'type' => 'in',
            'quantity' => 15,
            'note' => 'Stok awal varian',
            'created_by' => $userId,
        ]);

        $order = SouvenirOrder::create([
            'user_id' => $userId,
            'status' => 'paid',
            'payment_status' => 'paid',
            'total_price' => 225000,
            'shipping_method' => 'delivery',
            'shipping_address' => 'Jl. Indotix No. 8, Jakarta Barat',
            'shipping_cost' => 15000,
            'shipping_status' => 'processing',
            'payment_deadline' => now()->addHours(12),
        ]);

        SouvenirOrderItem::create([
            'souvenir_order_id' => $order->id,
            'product_id' => $products[0]->id,
            'variant_id' => $variantA->id,
            'product_name' => $products[0]->name,
            'sku' => $variantA->sku,
            'unit_price' => 25000,
            'quantity' => 2,
            'subtotal' => 50000,
        ]);

        SouvenirOrderItem::create([
            'souvenir_order_id' => $order->id,
            'product_id' => $products[1]->id,
            'variant_id' => $variantD->id,
            'product_name' => $products[1]->name,
            'sku' => $variantD->sku,
            'unit_price' => 190000,
            'quantity' => 1,
            'subtotal' => 190000,
        ]);

        SouvenirRefund::create([
            'souvenir_order_id' => $order->id,
            'type' => 'partial',
            'amount' => 25000,
            'reason' => 'Barang cacat pada batch pertama.',
            'status' => 'approved',
            'resolved_at' => now(),
            'created_by' => $userId,
        ]);

        SouvenirPromotion::create([
            'name' => 'Diskon Souvenir Akhir Pekan',
            'type' => 'discount',
            'value' => 10,
            'is_active' => true,
            'starts_at' => now()->subDays(2)->toDateString(),
            'ends_at' => now()->addDays(10)->toDateString(),
            'rules' => [
                'min_transaction' => 50000,
                'max_quota' => 200,
                'per_user_limit' => 1,
            ],
        ]);

        SouvenirAuditLog::create([
            'action' => 'seed_completed',
            'description' => 'Seeder souvenir dijalankan.',
            'data' => [
                'products' => $products->count(),
                'categories' => $categories->count(),
            ],
            'created_by' => $userId,
        ]);
    }
}
