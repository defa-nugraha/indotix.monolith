<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('event_organizers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->enum('status', ['pending', 'verified', 'suspended'])->default('pending');
            $table->text('notes')->nullable();
            $table->json('documents')->nullable();
            $table->timestamps();
        });

        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_organizer_id')->constrained('event_organizers')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('city_code')->nullable();
            $table->string('location')->nullable();
            $table->string('address')->nullable();
            $table->dateTime('start_at')->nullable();
            $table->dateTime('end_at')->nullable();
            $table->enum('status', ['draft', 'pending_review', 'published', 'postponed', 'cancelled', 'completed'])->default('draft');
            $table->unsignedInteger('capacity_total')->default(0);
            $table->unsignedInteger('capacity_sold')->default(0);
            $table->boolean('sales_stopped')->default(false);
            $table->text('status_reason')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('event_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->json('benefits')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('max_per_user')->default(1);
            $table->unsignedInteger('quota')->default(0);
            $table->unsignedInteger('sold_count')->default(0);
            $table->timestamps();
        });

        Schema::create('event_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_ticket_id')->constrained('event_tickets')->cascadeOnDelete();
            $table->string('booking_code')->unique();
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('total_price', 12, 2)->default(0);
            $table->enum('status', ['pending_payment', 'paid', 'cancelled', 'expired', 'completed'])->default('pending_payment');
            $table->string('payment_status')->nullable();
            $table->timestamp('payment_deadline')->nullable();
            $table->string('guest_name')->nullable();
            $table->string('guest_email')->nullable();
            $table->string('guest_phone')->nullable();
            $table->string('midtrans_order_id')->nullable();
            $table->timestamps();
        });

        Schema::create('event_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_booking_id')->constrained('event_bookings')->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('checked_in')->default(false);
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamps();
        });

        Schema::create('event_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_booking_id')->constrained('event_bookings')->cascadeOnDelete();
            $table->foreignId('event_ticket_id')->constrained('event_tickets')->cascadeOnDelete();
            $table->timestamp('scanned_at')->nullable();
            $table->string('officer_name')->nullable();
            $table->string('location')->nullable();
            $table->boolean('is_anomaly')->default(false);
            $table->timestamps();
        });

        Schema::create('event_refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_booking_id')->constrained('event_bookings')->cascadeOnDelete();
            $table->decimal('amount', 12, 2)->default(0);
            $table->enum('status', ['requested', 'processing', 'paid', 'rejected'])->default('requested');
            $table->text('reason')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('event_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('value', 12, 2)->default(0);
            $table->date('starts_at')->nullable();
            $table->date('ends_at')->nullable();
            $table->timestamps();
        });

        Schema::create('event_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_organizer_id')->constrained('event_organizers')->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('total_sales', 14, 2)->default(0);
            $table->decimal('commission_amount', 14, 2)->default(0);
            $table->decimal('net_payout', 14, 2)->default(0);
            $table->enum('status', ['pending', 'approved', 'paid', 'rejected'])->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('event_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('event_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('booking_timeout_minutes')->default(15);
            $table->unsignedInteger('max_ticket_per_user')->default(4);
            $table->unsignedInteger('sales_cutoff_minutes')->default(30);
            $table->text('refund_policy')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_settings');
        Schema::dropIfExists('event_audit_logs');
        Schema::dropIfExists('event_settlements');
        Schema::dropIfExists('event_commissions');
        Schema::dropIfExists('event_refunds');
        Schema::dropIfExists('event_scans');
        Schema::dropIfExists('event_attendees');
        Schema::dropIfExists('event_bookings');
        Schema::dropIfExists('event_tickets');
        Schema::dropIfExists('events');
        Schema::dropIfExists('event_organizers');
    }
};
