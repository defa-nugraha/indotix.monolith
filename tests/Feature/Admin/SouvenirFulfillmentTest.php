<?php

use App\Models\SouvenirOrder;
use App\Models\SouvenirOrderItem;
use App\Models\SouvenirProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function fulfillmentTestProduct(User $admin): SouvenirProduct
{
    return SouvenirProduct::query()->create([
        'name' => 'Produk Fulfillment '.Str::random(8),
        'price' => 125000,
        'sku' => 'FUL-'.Str::upper(Str::random(10)),
        'status' => 'active',
        'is_active' => true,
        'stock' => 20,
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);
}

function fulfillmentTestOrder(
    SouvenirProduct $product,
    User $customer,
    string $status,
    array $attributes = [],
): SouvenirOrder {
    $order = SouvenirOrder::query()->create(array_merge([
        'user_id' => $customer->id,
        'status' => $status,
        'payment_status' => $status === 'pending_payment' ? 'pending' : 'paid',
        'total_price' => 125000,
        'shipping_method' => 'delivery',
        'shipping_status' => $status === 'shipped' ? 'shipped' : 'pending',
    ], $attributes));

    SouvenirOrderItem::query()->create([
        'souvenir_order_id' => $order->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'sku' => $product->sku,
        'unit_price' => 125000,
        'quantity' => 1,
        'subtotal' => 125000,
    ]);

    return $order;
}

test('fulfillment only contains paid processing and shipped orders with queue summary', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $customer = User::factory()->create();
    $product = fulfillmentTestProduct($admin);

    fulfillmentTestOrder($product, $customer, 'pending_payment');
    $paid = fulfillmentTestOrder($product, $customer, 'paid');
    $processing = fulfillmentTestOrder($product, $customer, 'processing', [
        'shipping_status' => 'processing',
    ]);
    $shipped = fulfillmentTestOrder($product, $customer, 'shipped', [
        'tracking_number' => 'JNE-TEST-001',
    ]);
    fulfillmentTestOrder($product, $customer, 'completed');

    $this->actingAs($admin)
        ->get('/admin/retail-shop/fulfillment')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/souvenir/orders/index')
            ->where('mode', 'fulfillment')
            ->has('orders.data', 3)
            ->where('orders.data', fn ($orders) => $orders
                ->pluck('id')
                ->sort()
                ->values()
                ->all() === collect([$paid->id, $processing->id, $shipped->id])
                ->sort()
                ->values()
                ->all())
            ->where('summary.paid', 1)
            ->where('summary.processing', 1)
            ->where('summary.shipped', 1)
            ->where('summary.missing_tracking', 1));

    $this->actingAs($admin)
        ->get('/admin/retail-shop/fulfillment?q=JNE-TEST-001&status=shipped&shipping_method=delivery')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.id', $shipped->id)
            ->where('filters.q', 'JNE-TEST-001')
            ->where('filters.status', 'shipped')
            ->where('filters.shipping_method', 'delivery'));

    $this->actingAs($admin)
        ->get("/admin/retail-shop/fulfillment?q=INDOTIX-SOUV-{$paid->id}&shipping_status=pending")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.id', $paid->id)
            ->where('filters.shipping_status', 'pending'));
});

test('fulfillment keeps order and shipping statuses synchronized and requires tracking', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $customer = User::factory()->create();
    $product = fulfillmentTestProduct($admin);
    $order = fulfillmentTestOrder($product, $customer, 'paid');

    $this->actingAs($admin)
        ->post("/admin/retail-shop/orders/{$order->id}/status", [
            'status' => 'processing',
        ])
        ->assertSessionHasNoErrors();

    expect($order->fresh())
        ->status->toBe('processing')
        ->shipping_status->toBe('processing');

    $this->actingAs($admin)
        ->post("/admin/retail-shop/orders/{$order->id}/shipping", [
            'shipping_status' => 'shipped',
            'tracking_number' => '',
        ])
        ->assertSessionHasErrors('tracking_number');

    expect($order->fresh())
        ->status->toBe('processing')
        ->tracking_number->toBeNull();

    $this->actingAs($admin)
        ->post("/admin/retail-shop/orders/{$order->id}/shipping", [
            'shipping_status' => 'shipped',
            'tracking_number' => 'JNT-VALID-002',
        ])
        ->assertSessionHasNoErrors();

    expect($order->fresh())
        ->status->toBe('shipped')
        ->shipping_status->toBe('shipped')
        ->tracking_number->toBe('JNT-VALID-002')
        ->shipped_at->not->toBeNull();
});
