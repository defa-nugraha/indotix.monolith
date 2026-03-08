<?php

use Illuminate\Support\Facades\Route;

Route::get('/', [\App\Http\Controllers\PublicHomeController::class, 'index'])
    ->name('home');

Route::get('dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'admin'])
    ->name('dashboard');

Route::middleware(['auth', 'verified', 'admin', 'admin.log'])->group(function () {
    Route::get('admin/chat', [\App\Http\Controllers\Admin\ChatController::class, 'index'])
        ->name('admin.chat.index');
    Route::get('admin/chat/{conversation}', [\App\Http\Controllers\Admin\ChatController::class, 'show'])
        ->name('admin.chat.show');
    Route::post('admin/chat/{conversation}/messages', [\App\Http\Controllers\Admin\ChatController::class, 'store'])
        ->name('admin.chat.messages.store');

    Route::get('admin/special-programs/{section?}', [\App\Http\Controllers\Admin\SpecialProgramController::class, 'index'])
        ->where('section', 'programs|scope|benefits|visibility|monitoring|finance|compliance')
        ->name('admin.special-programs.index');
    Route::post('admin/special-programs', [\App\Http\Controllers\Admin\SpecialProgramController::class, 'store'])
        ->name('admin.special-programs.store');
    Route::put('admin/special-programs/{program}', [\App\Http\Controllers\Admin\SpecialProgramController::class, 'update'])
        ->name('admin.special-programs.update');
    Route::post('admin/special-programs/{program}/duplicate', [\App\Http\Controllers\Admin\SpecialProgramController::class, 'duplicate'])
        ->name('admin.special-programs.duplicate');
    Route::post('admin/special-programs/{program}/status', [\App\Http\Controllers\Admin\SpecialProgramController::class, 'updateStatus'])
        ->name('admin.special-programs.status');
    Route::delete('admin/special-programs/{program}', [\App\Http\Controllers\Admin\SpecialProgramController::class, 'destroy'])
        ->name('admin.special-programs.destroy');

    Route::get('admin/souvenir/products', [\App\Http\Controllers\Admin\SouvenirProductController::class, 'index'])
        ->name('admin.souvenir.products.index');
    Route::post('admin/souvenir/products', [\App\Http\Controllers\Admin\SouvenirProductController::class, 'store'])
        ->name('admin.souvenir.products.store');
    Route::put('admin/souvenir/products/{product}', [\App\Http\Controllers\Admin\SouvenirProductController::class, 'update'])
        ->name('admin.souvenir.products.update');
    Route::post('admin/souvenir/products/{product}/duplicate', [\App\Http\Controllers\Admin\SouvenirProductController::class, 'duplicate'])
        ->name('admin.souvenir.products.duplicate');
    Route::delete('admin/souvenir/products/{product}', [\App\Http\Controllers\Admin\SouvenirProductController::class, 'destroy'])
        ->name('admin.souvenir.products.destroy');
    Route::delete('admin/souvenir/products/{product}/force', [\App\Http\Controllers\Admin\SouvenirProductController::class, 'forceDelete'])
        ->name('admin.souvenir.products.force-delete');
    Route::delete('admin/souvenir/products/{product}/images/{image}', [\App\Http\Controllers\Admin\SouvenirProductController::class, 'destroyImage'])
        ->name('admin.souvenir.products.images.destroy');

    Route::get('admin/souvenir/categories', [\App\Http\Controllers\Admin\SouvenirCategoryController::class, 'index'])
        ->name('admin.souvenir.categories.index');
    Route::post('admin/souvenir/categories', [\App\Http\Controllers\Admin\SouvenirCategoryController::class, 'store'])
        ->name('admin.souvenir.categories.store');
    Route::put('admin/souvenir/categories/{category}', [\App\Http\Controllers\Admin\SouvenirCategoryController::class, 'update'])
        ->name('admin.souvenir.categories.update');
    Route::delete('admin/souvenir/categories/{category}', [\App\Http\Controllers\Admin\SouvenirCategoryController::class, 'destroy'])
        ->name('admin.souvenir.categories.destroy');

    Route::get('admin/souvenir/variants', [\App\Http\Controllers\Admin\SouvenirVariantController::class, 'index'])
        ->name('admin.souvenir.variants.index');
    Route::post('admin/souvenir/variants', [\App\Http\Controllers\Admin\SouvenirVariantController::class, 'store'])
        ->name('admin.souvenir.variants.store');
    Route::put('admin/souvenir/variants/{variant}', [\App\Http\Controllers\Admin\SouvenirVariantController::class, 'update'])
        ->name('admin.souvenir.variants.update');
    Route::delete('admin/souvenir/variants/{variant}', [\App\Http\Controllers\Admin\SouvenirVariantController::class, 'destroy'])
        ->name('admin.souvenir.variants.destroy');

    Route::get('admin/souvenir/inventory', [\App\Http\Controllers\Admin\SouvenirInventoryController::class, 'index'])
        ->name('admin.souvenir.inventory.index');
    Route::post('admin/souvenir/inventory', [\App\Http\Controllers\Admin\SouvenirInventoryController::class, 'store'])
        ->name('admin.souvenir.inventory.store');

    Route::get('admin/souvenir/orders', [\App\Http\Controllers\Admin\SouvenirOrderController::class, 'index'])
        ->name('admin.souvenir.orders.index');
    Route::get('admin/souvenir/orders/{order}', [\App\Http\Controllers\Admin\SouvenirOrderController::class, 'show'])
        ->name('admin.souvenir.orders.show');
    Route::post('admin/souvenir/orders/{order}/status', [\App\Http\Controllers\Admin\SouvenirOrderController::class, 'updateStatus'])
        ->name('admin.souvenir.orders.status');
    Route::post('admin/souvenir/orders/{order}/shipping', [\App\Http\Controllers\Admin\SouvenirOrderController::class, 'updateShipping'])
        ->name('admin.souvenir.orders.shipping');
    Route::get('admin/souvenir/fulfillment', [\App\Http\Controllers\Admin\SouvenirOrderController::class, 'fulfillment'])
        ->name('admin.souvenir.fulfillment.index');

    Route::get('admin/souvenir/refunds', [\App\Http\Controllers\Admin\SouvenirRefundController::class, 'index'])
        ->name('admin.souvenir.refunds.index');
    Route::post('admin/souvenir/refunds', [\App\Http\Controllers\Admin\SouvenirRefundController::class, 'store'])
        ->name('admin.souvenir.refunds.store');
    Route::put('admin/souvenir/refunds/{refund}', [\App\Http\Controllers\Admin\SouvenirRefundController::class, 'update'])
        ->name('admin.souvenir.refunds.update');

    Route::get('admin/souvenir/promotions', [\App\Http\Controllers\Admin\SouvenirPromotionController::class, 'index'])
        ->name('admin.souvenir.promotions.index');
    Route::post('admin/souvenir/promotions', [\App\Http\Controllers\Admin\SouvenirPromotionController::class, 'store'])
        ->name('admin.souvenir.promotions.store');
    Route::put('admin/souvenir/promotions/{promotion}', [\App\Http\Controllers\Admin\SouvenirPromotionController::class, 'update'])
        ->name('admin.souvenir.promotions.update');
    Route::delete('admin/souvenir/promotions/{promotion}', [\App\Http\Controllers\Admin\SouvenirPromotionController::class, 'destroy'])
        ->name('admin.souvenir.promotions.destroy');

    Route::get('admin/souvenir/reports', [\App\Http\Controllers\Admin\SouvenirReportController::class, 'index'])
        ->name('admin.souvenir.reports.index');
    Route::get('admin/souvenir/audit', [\App\Http\Controllers\Admin\SouvenirAuditController::class, 'index'])
        ->name('admin.souvenir.audit.index');

    Route::get('admin/souvenir/settings', [\App\Http\Controllers\Admin\SouvenirSettingController::class, 'index'])
        ->name('admin.souvenir.settings.index');
    Route::post('admin/souvenir/settings', [\App\Http\Controllers\Admin\SouvenirSettingController::class, 'update'])
        ->name('admin.souvenir.settings.update');

    Route::get('admin/blog/posts', [\App\Http\Controllers\Admin\BlogPostController::class, 'index'])
        ->name('admin.blog.posts.index');
    Route::get('admin/blog/posts/create', [\App\Http\Controllers\Admin\BlogPostController::class, 'create'])
        ->name('admin.blog.posts.create');
    Route::post('admin/blog/posts', [\App\Http\Controllers\Admin\BlogPostController::class, 'store'])
        ->name('admin.blog.posts.store');
    Route::get('admin/blog/posts/{post}/edit', [\App\Http\Controllers\Admin\BlogPostController::class, 'edit'])
        ->name('admin.blog.posts.edit');
    Route::put('admin/blog/posts/{post}', [\App\Http\Controllers\Admin\BlogPostController::class, 'update'])
        ->name('admin.blog.posts.update');
    Route::delete('admin/blog/posts/{post}', [\App\Http\Controllers\Admin\BlogPostController::class, 'destroy'])
        ->name('admin.blog.posts.destroy');

    Route::get('admin/blog/categories', [\App\Http\Controllers\Admin\BlogCategoryController::class, 'index'])
        ->name('admin.blog.categories.index');
    Route::post('admin/blog/categories', [\App\Http\Controllers\Admin\BlogCategoryController::class, 'store'])
        ->name('admin.blog.categories.store');
    Route::put('admin/blog/categories/{category}', [\App\Http\Controllers\Admin\BlogCategoryController::class, 'update'])
        ->name('admin.blog.categories.update');
    Route::delete('admin/blog/categories/{category}', [\App\Http\Controllers\Admin\BlogCategoryController::class, 'destroy'])
        ->name('admin.blog.categories.destroy');

    Route::get('admin/blog/tags', [\App\Http\Controllers\Admin\BlogTagController::class, 'index'])
        ->name('admin.blog.tags.index');
    Route::post('admin/blog/tags', [\App\Http\Controllers\Admin\BlogTagController::class, 'store'])
        ->name('admin.blog.tags.store');
    Route::put('admin/blog/tags/{tag}', [\App\Http\Controllers\Admin\BlogTagController::class, 'update'])
        ->name('admin.blog.tags.update');
    Route::delete('admin/blog/tags/{tag}', [\App\Http\Controllers\Admin\BlogTagController::class, 'destroy'])
        ->name('admin.blog.tags.destroy');

    Route::get('admin/events/organizers', [\App\Http\Controllers\Admin\EventOrganizerController::class, 'index'])
        ->name('admin.events.organizers.index');
    Route::post('admin/events/organizers', [\App\Http\Controllers\Admin\EventOrganizerController::class, 'store'])
        ->name('admin.events.organizers.store');
    Route::get('admin/events/organizers/{organizer}', [\App\Http\Controllers\Admin\EventOrganizerController::class, 'show'])
        ->name('admin.events.organizers.show');
    Route::post('admin/events/organizers/{organizer}/status', [\App\Http\Controllers\Admin\EventOrganizerController::class, 'updateStatus'])
        ->name('admin.events.organizers.status');

    Route::get('admin/events', [\App\Http\Controllers\Admin\EventController::class, 'index'])
        ->name('admin.events.index');

    Route::get('admin/events/tickets', [\App\Http\Controllers\Admin\EventTicketController::class, 'index'])
        ->name('admin.events.tickets.index');
    Route::post('admin/events/tickets/{ticket}', [\App\Http\Controllers\Admin\EventTicketController::class, 'update'])
        ->name('admin.events.tickets.update');

    Route::get('admin/events/bookings', [\App\Http\Controllers\Admin\EventBookingController::class, 'index'])
        ->name('admin.events.bookings.index');
    Route::get('admin/events/bookings/{booking}', [\App\Http\Controllers\Admin\EventBookingController::class, 'show'])
        ->name('admin.events.bookings.show');

    Route::get('admin/events/attendees', [\App\Http\Controllers\Admin\EventAttendeeController::class, 'index'])
        ->name('admin.events.attendees.index');

    Route::get('admin/events/scans', [\App\Http\Controllers\Admin\EventScanController::class, 'index'])
        ->name('admin.events.scans.index');
    Route::get('admin/events/content', [\App\Http\Controllers\Admin\EventContentController::class, 'index'])
        ->name('admin.events.content.index');
    Route::get('admin/events/reviews', [\App\Http\Controllers\Admin\EventReviewController::class, 'index'])
        ->name('admin.events.reviews.index');

    Route::get('admin/reviews', [\App\Http\Controllers\Admin\ProductReviewController::class, 'index'])
        ->name('admin.reviews.index');
    Route::post('admin/reviews/{review}/reply', [\App\Http\Controllers\Admin\ProductReviewController::class, 'reply'])
        ->name('admin.reviews.reply');
    Route::delete('admin/reviews/{review}', [\App\Http\Controllers\Admin\ProductReviewController::class, 'destroy'])
        ->name('admin.reviews.destroy');

    Route::get('admin/events/exceptions', [\App\Http\Controllers\Admin\EventExceptionController::class, 'index'])
        ->name('admin.events.exceptions.index');
    Route::post('admin/events/{event}/exception', [\App\Http\Controllers\Admin\EventExceptionController::class, 'updateEvent'])
        ->whereNumber('event')
        ->name('admin.events.exceptions.update');
    Route::post('admin/events/bookings/{booking}/refund', [\App\Http\Controllers\Admin\EventExceptionController::class, 'refund'])
        ->name('admin.events.refunds.store');

    Route::get('admin/events/finance/commissions', [\App\Http\Controllers\Admin\EventFinanceController::class, 'commissions'])
        ->name('admin.events.finance.commissions');
    Route::post('admin/events/finance/commissions', [\App\Http\Controllers\Admin\EventFinanceController::class, 'storeCommission'])
        ->name('admin.events.finance.commissions.store');
    Route::get('admin/events/finance/settlements', [\App\Http\Controllers\Admin\EventFinanceController::class, 'settlements'])
        ->name('admin.events.finance.settlements');
    Route::post('admin/events/finance/settlements', [\App\Http\Controllers\Admin\EventFinanceController::class, 'createSettlement'])
        ->name('admin.events.finance.settlements.create');
    Route::get('admin/events/finance/reports', [\App\Http\Controllers\Admin\EventFinanceController::class, 'reports'])
        ->name('admin.events.finance.reports');

    Route::get('admin/events/system/audit-logs', [\App\Http\Controllers\Admin\EventAuditController::class, 'index'])
        ->name('admin.events.audit.index');
    Route::get('admin/events/system/settings', [\App\Http\Controllers\Admin\EventSettingController::class, 'index'])
        ->name('admin.events.settings.index');
    Route::post('admin/events/system/settings', [\App\Http\Controllers\Admin\EventSettingController::class, 'update'])
        ->name('admin.events.settings.update');
    Route::get('admin/events/{event}', [\App\Http\Controllers\Admin\EventController::class, 'show'])
        ->whereNumber('event')
        ->name('admin.events.show');
    Route::post('admin/events/{event}/status', [\App\Http\Controllers\Admin\EventController::class, 'updateStatus'])
        ->whereNumber('event')
        ->name('admin.events.status');
    Route::post('admin/events/{event}/capacity', [\App\Http\Controllers\Admin\EventController::class, 'updateCapacity'])
        ->whereNumber('event')
        ->name('admin.events.capacity');

    Route::get('admin/academy/classes', [\App\Http\Controllers\Admin\Academy\ClassController::class, 'index'])
        ->name('admin.academy.classes.index');
    Route::post('admin/academy/classes', [\App\Http\Controllers\Admin\Academy\ClassController::class, 'store'])
        ->name('admin.academy.classes.store');
    Route::get('admin/academy/classes/{class}', [\App\Http\Controllers\Admin\Academy\ClassController::class, 'show'])
        ->name('admin.academy.classes.show');
    Route::put('admin/academy/classes/{class}', [\App\Http\Controllers\Admin\Academy\ClassController::class, 'update'])
        ->name('admin.academy.classes.update');
    Route::delete('admin/academy/classes/{class}/images/{image}', [\App\Http\Controllers\Admin\Academy\ClassController::class, 'destroyImage'])
        ->name('admin.academy.classes.images.destroy');

    Route::get('admin/academy/tickets', [\App\Http\Controllers\Admin\Academy\TicketController::class, 'index'])
        ->name('admin.academy.tickets.index');
    Route::post('admin/academy/tickets', [\App\Http\Controllers\Admin\Academy\TicketController::class, 'store'])
        ->name('admin.academy.tickets.store');
    Route::put('admin/academy/tickets/{ticket}', [\App\Http\Controllers\Admin\Academy\TicketController::class, 'update'])
        ->name('admin.academy.tickets.update');

    Route::get('admin/academy/bookings', [\App\Http\Controllers\Admin\Academy\BookingController::class, 'index'])
        ->name('admin.academy.bookings.index');
    Route::get('admin/academy/bookings/{booking}', [\App\Http\Controllers\Admin\Academy\BookingController::class, 'show'])
        ->name('admin.academy.bookings.show');

    Route::get('admin/academy/attendees', [\App\Http\Controllers\Admin\Academy\AttendeeController::class, 'index'])
        ->name('admin.academy.attendees.index');

    Route::get('admin/academy/scans', [\App\Http\Controllers\Admin\Academy\ScanController::class, 'index'])
        ->name('admin.academy.scans.index');

    Route::get('admin/academy/finance', [\App\Http\Controllers\Admin\Academy\FinanceController::class, 'index'])
        ->name('admin.academy.finance.index');
    Route::post('admin/academy/bookings/{booking}/refund', [\App\Http\Controllers\Admin\Academy\FinanceController::class, 'refund'])
        ->name('admin.academy.bookings.refund');

    Route::get('admin/academy/reports', [\App\Http\Controllers\Admin\Academy\ReportController::class, 'index'])
        ->name('admin.academy.reports.index');

    Route::get('admin/academy/system/audit', [\App\Http\Controllers\Admin\Academy\AuditController::class, 'index'])
        ->name('admin.academy.audit.index');
    Route::get('admin/academy/system/settings', [\App\Http\Controllers\Admin\Academy\SettingController::class, 'index'])
        ->name('admin.academy.settings.index');
    Route::post('admin/academy/system/settings', [\App\Http\Controllers\Admin\Academy\SettingController::class, 'update'])
        ->name('admin.academy.settings.update');
    Route::get('admin/mitra', [\App\Http\Controllers\Admin\MitraController::class, 'index'])
        ->name('admin.mitra.index');
    Route::post('admin/mitra', [\App\Http\Controllers\Admin\MitraController::class, 'store'])
        ->name('admin.mitra.store');
    Route::get('admin/mitra/{user}', [\App\Http\Controllers\Admin\MitraController::class, 'show'])
        ->name('admin.mitra.show');
    Route::post('admin/mitra/{user}/verify', [\App\Http\Controllers\Admin\MitraController::class, 'verify'])
        ->name('admin.mitra.verify');
    Route::post('admin/mitra/{user}/payout', [\App\Http\Controllers\Admin\MitraController::class, 'payout'])
        ->name('admin.mitra.payout');
    Route::post('admin/mitra/{user}/suspend', [\App\Http\Controllers\Admin\MitraController::class, 'suspend'])
        ->name('admin.mitra.suspend');
    Route::get('admin/mitra-wisata', [\App\Http\Controllers\Admin\MitraWisataController::class, 'index'])
        ->name('admin.mitra-wisata.index');
    Route::post('admin/mitra-wisata', [\App\Http\Controllers\Admin\MitraWisataController::class, 'store'])
        ->name('admin.mitra-wisata.store');
    Route::get('admin/mitra-wisata/{user}', [\App\Http\Controllers\Admin\MitraWisataController::class, 'show'])
        ->name('admin.mitra-wisata.show');
    Route::post('admin/mitra-wisata/{user}/verify', [\App\Http\Controllers\Admin\MitraWisataController::class, 'verify'])
        ->name('admin.mitra-wisata.verify');
    Route::post('admin/mitra-wisata/{user}/payout', [\App\Http\Controllers\Admin\MitraWisataController::class, 'payout'])
        ->name('admin.mitra-wisata.payout');
    Route::post('admin/mitra-wisata/{user}/suspend', [\App\Http\Controllers\Admin\MitraWisataController::class, 'suspend'])
        ->name('admin.mitra-wisata.suspend');

    Route::get('admin/wisata/destinations', [\App\Http\Controllers\Admin\WisataDestinationController::class, 'index'])
        ->name('admin.wisata.destinations.index');
    Route::get('admin/wisata/destinations/{destination}', [\App\Http\Controllers\Admin\WisataDestinationController::class, 'show'])
        ->name('admin.wisata.destinations.show');
    Route::put('admin/wisata/destinations/{destination}', [\App\Http\Controllers\Admin\WisataDestinationController::class, 'update'])
        ->name('admin.wisata.destinations.update');
    Route::post('admin/wisata/destinations/{destination}/suspend', [\App\Http\Controllers\Admin\WisataDestinationController::class, 'suspend'])
        ->name('admin.wisata.destinations.suspend');

    Route::get('admin/wisata/tickets', [\App\Http\Controllers\Admin\WisataTicketController::class, 'index'])
        ->name('admin.wisata.tickets.index');
    Route::get('admin/wisata/tickets/create', [\App\Http\Controllers\Admin\WisataTicketController::class, 'create'])
        ->name('admin.wisata.tickets.create');
    Route::post('admin/wisata/tickets', [\App\Http\Controllers\Admin\WisataTicketController::class, 'store'])
        ->name('admin.wisata.tickets.store');
    Route::put('admin/wisata/tickets/{ticket}', [\App\Http\Controllers\Admin\WisataTicketController::class, 'update'])
        ->name('admin.wisata.tickets.update');
    Route::delete('admin/wisata/tickets/{ticket}', [\App\Http\Controllers\Admin\WisataTicketController::class, 'destroy'])
        ->name('admin.wisata.tickets.destroy');

    Route::get('admin/wisata/bookings', [\App\Http\Controllers\Admin\WisataBookingController::class, 'index'])
        ->name('admin.wisata.bookings.index');
    Route::get('admin/wisata/bookings/{booking}', [\App\Http\Controllers\Admin\WisataBookingController::class, 'show'])
        ->name('admin.wisata.bookings.show');

    Route::get('admin/wisata/scans', [\App\Http\Controllers\Admin\WisataScanController::class, 'index'])
        ->name('admin.wisata.scans.index');

    Route::get('admin/wisata/exceptions', [\App\Http\Controllers\Admin\WisataExceptionController::class, 'index'])
        ->name('admin.wisata.exceptions.index');
    Route::post('admin/wisata/bookings/{booking}/cancel', [\App\Http\Controllers\Admin\WisataExceptionController::class, 'cancel'])
        ->name('admin.wisata.bookings.cancel');
    Route::post('admin/wisata/bookings/{booking}/refund', [\App\Http\Controllers\Admin\WisataExceptionController::class, 'refund'])
        ->name('admin.wisata.bookings.refund');
    Route::post('admin/wisata/disputes/{dispute}', [\App\Http\Controllers\Admin\WisataExceptionController::class, 'resolveDispute'])
        ->name('admin.wisata.disputes.update');

    Route::get('admin/wisata/finance/commissions', [\App\Http\Controllers\Admin\WisataFinanceController::class, 'commissions'])
        ->name('admin.wisata.finance.commissions');
    Route::post('admin/wisata/finance/commissions', [\App\Http\Controllers\Admin\WisataFinanceController::class, 'storeCommission'])
        ->name('admin.wisata.finance.commissions.store');
    Route::get('admin/wisata/finance/payouts', [\App\Http\Controllers\Admin\WisataFinanceController::class, 'payouts'])
        ->name('admin.wisata.finance.payouts');
    Route::post('admin/wisata/finance/payouts', [\App\Http\Controllers\Admin\WisataFinanceController::class, 'generatePayout'])
        ->name('admin.wisata.finance.payouts.create');
    Route::post('admin/wisata/finance/payouts/{payout}', [\App\Http\Controllers\Admin\WisataFinanceController::class, 'updatePayout'])
        ->name('admin.wisata.finance.payouts.update');
    Route::get('admin/wisata/finance/reports', [\App\Http\Controllers\Admin\WisataFinanceController::class, 'reports'])
        ->name('admin.wisata.finance.reports');

    Route::get('admin/wisata/content', [\App\Http\Controllers\Admin\WisataContentController::class, 'index'])
        ->name('admin.wisata.content.index');
    Route::post('admin/wisata/content/{destination}', [\App\Http\Controllers\Admin\WisataContentController::class, 'hideContent'])
        ->name('admin.wisata.content.update');
    Route::post('admin/wisata/reviews/{review}', [\App\Http\Controllers\Admin\WisataContentController::class, 'updateReview'])
        ->name('admin.wisata.reviews.update');

    Route::get('admin/wisata/affiliates', [\App\Http\Controllers\Admin\WisataAffiliate\AffiliateController::class, 'index'])
        ->name('admin.wisata.affiliates.index');
    Route::post('admin/wisata/affiliates', [\App\Http\Controllers\Admin\WisataAffiliate\AffiliateController::class, 'store'])
        ->name('admin.wisata.affiliates.store');
    Route::get('admin/wisata/affiliates/commissions', [\App\Http\Controllers\Admin\WisataAffiliate\CommissionController::class, 'index'])
        ->name('admin.wisata.affiliates.commissions.index');
    Route::post('admin/wisata/affiliates/commissions', [\App\Http\Controllers\Admin\WisataAffiliate\CommissionController::class, 'store'])
        ->name('admin.wisata.affiliates.commissions.store');

    Route::get('admin/wisata/affiliates/links', [\App\Http\Controllers\Admin\WisataAffiliate\LinkController::class, 'index'])
        ->name('admin.wisata.affiliates.links.index');
    Route::post('admin/wisata/affiliates/links', [\App\Http\Controllers\Admin\WisataAffiliate\LinkController::class, 'store'])
        ->name('admin.wisata.affiliates.links.store');
    Route::post('admin/wisata/affiliates/links/{link}/status', [\App\Http\Controllers\Admin\WisataAffiliate\LinkController::class, 'updateStatus'])
        ->name('admin.wisata.affiliates.links.status');
    Route::post('admin/wisata/affiliates/links/{link}/regenerate', [\App\Http\Controllers\Admin\WisataAffiliate\LinkController::class, 'regenerateToken'])
        ->name('admin.wisata.affiliates.links.regenerate');

    Route::get('admin/wisata/affiliates/performance', [\App\Http\Controllers\Admin\WisataAffiliate\PerformanceController::class, 'index'])
        ->name('admin.wisata.affiliates.performance.index');
    Route::get('admin/wisata/affiliates/commission-items', [\App\Http\Controllers\Admin\WisataAffiliate\CommissionLogController::class, 'index'])
        ->name('admin.wisata.affiliates.commission-items.index');
    Route::get('admin/wisata/affiliates/payouts', [\App\Http\Controllers\Admin\WisataAffiliate\PayoutController::class, 'index'])
        ->name('admin.wisata.affiliates.payouts.index');
    Route::post('admin/wisata/affiliates/payouts', [\App\Http\Controllers\Admin\WisataAffiliate\PayoutController::class, 'store'])
        ->name('admin.wisata.affiliates.payouts.store');
    Route::post('admin/wisata/affiliates/payouts/{payout}/status', [\App\Http\Controllers\Admin\WisataAffiliate\PayoutController::class, 'updateStatus'])
        ->name('admin.wisata.affiliates.payouts.status');

    Route::get('admin/wisata/affiliates/campaigns', [\App\Http\Controllers\Admin\WisataAffiliate\CampaignController::class, 'index'])
        ->name('admin.wisata.affiliates.campaigns.index');
    Route::post('admin/wisata/affiliates/campaigns', [\App\Http\Controllers\Admin\WisataAffiliate\CampaignController::class, 'store'])
        ->name('admin.wisata.affiliates.campaigns.store');
    Route::post('admin/wisata/affiliates/campaigns/{campaign}/status', [\App\Http\Controllers\Admin\WisataAffiliate\CampaignController::class, 'updateStatus'])
        ->name('admin.wisata.affiliates.campaigns.status');

    Route::get('admin/wisata/affiliates/exceptions', [\App\Http\Controllers\Admin\WisataAffiliate\ExceptionController::class, 'index'])
        ->name('admin.wisata.affiliates.exceptions.index');
    Route::post('admin/wisata/affiliates/exceptions', [\App\Http\Controllers\Admin\WisataAffiliate\ExceptionController::class, 'store'])
        ->name('admin.wisata.affiliates.exceptions.store');

    Route::get('admin/wisata/affiliates/system/audit', [\App\Http\Controllers\Admin\WisataAffiliate\AuditController::class, 'index'])
        ->name('admin.wisata.affiliates.audit.index');
    Route::get('admin/wisata/affiliates/system/settings', [\App\Http\Controllers\Admin\WisataAffiliate\SettingController::class, 'index'])
        ->name('admin.wisata.affiliates.settings.index');
    Route::post('admin/wisata/affiliates/system/settings', [\App\Http\Controllers\Admin\WisataAffiliate\SettingController::class, 'update'])
        ->name('admin.wisata.affiliates.settings.update');

    Route::get('admin/wisata/affiliates/{affiliate}', [\App\Http\Controllers\Admin\WisataAffiliate\AffiliateController::class, 'show'])
        ->name('admin.wisata.affiliates.show');
    Route::put('admin/wisata/affiliates/{affiliate}', [\App\Http\Controllers\Admin\WisataAffiliate\AffiliateController::class, 'update'])
        ->name('admin.wisata.affiliates.update');
    Route::post('admin/wisata/affiliates/{affiliate}/status', [\App\Http\Controllers\Admin\WisataAffiliate\AffiliateController::class, 'updateStatus'])
        ->name('admin.wisata.affiliates.status');

    Route::get('admin/bookings', [\App\Http\Controllers\Admin\BookingController::class, 'index'])
        ->name('admin.bookings.index');
    Route::get('admin/bookings/{booking}', [\App\Http\Controllers\Admin\BookingController::class, 'show'])
        ->name('admin.bookings.show');
    Route::post('admin/bookings/{booking}/cancel', [\App\Http\Controllers\Admin\BookingController::class, 'cancel'])
        ->name('admin.bookings.cancel');
    Route::post('admin/bookings/{booking}/refund', [\App\Http\Controllers\Admin\BookingController::class, 'refund'])
        ->name('admin.bookings.refund');
    Route::post('admin/bookings/{booking}/dispute', [\App\Http\Controllers\Admin\BookingController::class, 'dispute'])
        ->name('admin.bookings.dispute');

    Route::get('admin/finance/commissions', [\App\Http\Controllers\Admin\CommissionRuleController::class, 'index'])
        ->name('admin.finance.commissions.index');
    Route::post('admin/finance/commissions', [\App\Http\Controllers\Admin\CommissionRuleController::class, 'store'])
        ->name('admin.finance.commissions.store');
    Route::put('admin/finance/commissions/{commissionRule}', [\App\Http\Controllers\Admin\CommissionRuleController::class, 'update'])
        ->name('admin.finance.commissions.update');
    Route::delete('admin/finance/commissions/{commissionRule}', [\App\Http\Controllers\Admin\CommissionRuleController::class, 'destroy'])
        ->name('admin.finance.commissions.destroy');

    Route::get('admin/finance/payouts', [\App\Http\Controllers\Admin\PayoutController::class, 'index'])
        ->name('admin.payouts.index');
    Route::get('admin/finance/payouts/create', [\App\Http\Controllers\Admin\PayoutController::class, 'create'])
        ->name('admin.payouts.create');
    Route::post('admin/finance/payouts', [\App\Http\Controllers\Admin\PayoutController::class, 'store'])
        ->name('admin.payouts.store');
    Route::post('admin/finance/payouts/{payout}/approve', [\App\Http\Controllers\Admin\PayoutController::class, 'approve'])
        ->name('admin.payouts.approve');
    Route::post('admin/finance/payouts/{payout}/transfer', [\App\Http\Controllers\Admin\PayoutController::class, 'transfer'])
        ->name('admin.payouts.transfer');

    Route::get('admin/finance/reports', [\App\Http\Controllers\Admin\FinanceReportController::class, 'index'])
        ->name('admin.finance.reports.index');

    Route::get('admin/marketing/vouchers', [\App\Http\Controllers\Admin\VoucherController::class, 'index'])
        ->name('admin.vouchers.index');
    Route::post('admin/marketing/vouchers', [\App\Http\Controllers\Admin\VoucherController::class, 'store'])
        ->name('admin.vouchers.store');
    Route::put('admin/marketing/vouchers/{voucher}', [\App\Http\Controllers\Admin\VoucherController::class, 'update'])
        ->name('admin.vouchers.update');
    Route::delete('admin/marketing/vouchers/{voucher}', [\App\Http\Controllers\Admin\VoucherController::class, 'destroy'])
        ->name('admin.vouchers.destroy');

    Route::get('admin/system/audit-logs', [\App\Http\Controllers\Admin\AdminAuditLogController::class, 'index'])
        ->name('admin.audit-logs.index');
    Route::get('admin/system/settings', [\App\Http\Controllers\Admin\SystemSettingController::class, 'index'])
        ->name('admin.system.settings.index');
    Route::post('admin/system/settings', [\App\Http\Controllers\Admin\SystemSettingController::class, 'update'])
        ->name('admin.system.settings.update');
    Route::get('admin/system/notifications', [\App\Http\Controllers\Admin\NotificationControlController::class, 'index'])
        ->name('admin.system.notifications.index');
    Route::post('admin/system/notifications/templates', [\App\Http\Controllers\Admin\NotificationControlController::class, 'storeTemplate'])
        ->name('admin.system.notifications.templates.store');
    Route::put('admin/system/notifications/templates/{template}', [\App\Http\Controllers\Admin\NotificationControlController::class, 'updateTemplate'])
        ->name('admin.system.notifications.templates.update');
    Route::delete('admin/system/notifications/templates/{template}', [\App\Http\Controllers\Admin\NotificationControlController::class, 'destroyTemplate'])
        ->name('admin.system.notifications.templates.destroy');
    Route::put('admin/system/notifications/triggers/{trigger}', [\App\Http\Controllers\Admin\NotificationControlController::class, 'updateTrigger'])
        ->name('admin.system.notifications.triggers.update');
    Route::get('admin/system/roles', [\App\Http\Controllers\Admin\RoleManagementController::class, 'index'])
        ->name('admin.system.roles.index');
    Route::put('admin/system/roles/{user}', [\App\Http\Controllers\Admin\RoleManagementController::class, 'update'])
        ->name('admin.system.roles.update');
    Route::get('admin/system/special-admins', [\App\Http\Controllers\Admin\SpecialAdminController::class, 'index'])
        ->name('admin.system.special-admins.index');
    Route::post('admin/system/special-admins', [\App\Http\Controllers\Admin\SpecialAdminController::class, 'store'])
        ->name('admin.system.special-admins.store');
    Route::put('admin/system/special-admins/{user}', [\App\Http\Controllers\Admin\SpecialAdminController::class, 'update'])
        ->name('admin.system.special-admins.update');
    Route::delete('admin/system/special-admins/{user}', [\App\Http\Controllers\Admin\SpecialAdminController::class, 'destroy'])
        ->name('admin.system.special-admins.destroy');

    Route::get('admin/public/banners', [\App\Http\Controllers\Admin\PublicBannerController::class, 'index'])
        ->name('admin.public.banners.index');
    Route::get('admin/public/banners/create', [\App\Http\Controllers\Admin\PublicBannerController::class, 'create'])
        ->name('admin.public.banners.create');
    Route::post('admin/public/banners', [\App\Http\Controllers\Admin\PublicBannerController::class, 'store'])
        ->name('admin.public.banners.store');
    Route::get('admin/public/banners/{banner}/edit', [\App\Http\Controllers\Admin\PublicBannerController::class, 'edit'])
        ->name('admin.public.banners.edit');
    Route::put('admin/public/banners/{banner}', [\App\Http\Controllers\Admin\PublicBannerController::class, 'update'])
        ->name('admin.public.banners.update');
    Route::delete('admin/public/banners/{banner}', [\App\Http\Controllers\Admin\PublicBannerController::class, 'destroy'])
        ->name('admin.public.banners.destroy');

    Route::get('admin/public/promo-videos', [\App\Http\Controllers\Admin\PromoVideoController::class, 'index'])
        ->name('admin.public.promo-videos.index');
    Route::get('admin/public/promo-videos/create', [\App\Http\Controllers\Admin\PromoVideoController::class, 'create'])
        ->name('admin.public.promo-videos.create');
    Route::post('admin/public/promo-videos', [\App\Http\Controllers\Admin\PromoVideoController::class, 'store'])
        ->name('admin.public.promo-videos.store');
    Route::get('admin/public/promo-videos/{promoVideo}/edit', [\App\Http\Controllers\Admin\PromoVideoController::class, 'edit'])
        ->name('admin.public.promo-videos.edit');
    Route::put('admin/public/promo-videos/{promoVideo}', [\App\Http\Controllers\Admin\PromoVideoController::class, 'update'])
        ->name('admin.public.promo-videos.update');
    Route::delete('admin/public/promo-videos/{promoVideo}', [\App\Http\Controllers\Admin\PromoVideoController::class, 'destroy'])
        ->name('admin.public.promo-videos.destroy');

    Route::get('admin/public/promo-items', [\App\Http\Controllers\Admin\PromoItemController::class, 'index'])
        ->name('admin.public.promo-items.index');
    Route::get('admin/public/promo-items/create', [\App\Http\Controllers\Admin\PromoItemController::class, 'create'])
        ->name('admin.public.promo-items.create');
    Route::post('admin/public/promo-items', [\App\Http\Controllers\Admin\PromoItemController::class, 'store'])
        ->name('admin.public.promo-items.store');
    Route::get('admin/public/promo-items/{promoItem}/edit', [\App\Http\Controllers\Admin\PromoItemController::class, 'edit'])
        ->name('admin.public.promo-items.edit');
    Route::put('admin/public/promo-items/{promoItem}', [\App\Http\Controllers\Admin\PromoItemController::class, 'update'])
        ->name('admin.public.promo-items.update');
    Route::delete('admin/public/promo-items/{promoItem}', [\App\Http\Controllers\Admin\PromoItemController::class, 'destroy'])
        ->name('admin.public.promo-items.destroy');
    Route::get('admin/public/partners', [\App\Http\Controllers\Admin\PublicPartnerController::class, 'index'])
        ->name('admin.public.partners.index');
    Route::get('admin/public/partners/create', [\App\Http\Controllers\Admin\PublicPartnerController::class, 'create'])
        ->name('admin.public.partners.create');
    Route::post('admin/public/partners', [\App\Http\Controllers\Admin\PublicPartnerController::class, 'store'])
        ->name('admin.public.partners.store');
    Route::get('admin/public/partners/{partner}/edit', [\App\Http\Controllers\Admin\PublicPartnerController::class, 'edit'])
        ->name('admin.public.partners.edit');
    Route::put('admin/public/partners/{partner}', [\App\Http\Controllers\Admin\PublicPartnerController::class, 'update'])
        ->name('admin.public.partners.update');
    Route::delete('admin/public/partners/{partner}', [\App\Http\Controllers\Admin\PublicPartnerController::class, 'destroy'])
        ->name('admin.public.partners.destroy');

    Route::get('admin/public/faqs', [\App\Http\Controllers\Admin\FaqController::class, 'index'])
        ->name('admin.public.faqs.index');
    Route::get('admin/public/faqs/create', [\App\Http\Controllers\Admin\FaqController::class, 'create'])
        ->name('admin.public.faqs.create');
    Route::post('admin/public/faqs', [\App\Http\Controllers\Admin\FaqController::class, 'store'])
        ->name('admin.public.faqs.store');
    Route::get('admin/public/faqs/{faq}/edit', [\App\Http\Controllers\Admin\FaqController::class, 'edit'])
        ->name('admin.public.faqs.edit');
    Route::put('admin/public/faqs/{faq}', [\App\Http\Controllers\Admin\FaqController::class, 'update'])
        ->name('admin.public.faqs.update');
    Route::delete('admin/public/faqs/{faq}', [\App\Http\Controllers\Admin\FaqController::class, 'destroy'])
        ->name('admin.public.faqs.destroy');

    Route::get('admin/public/privacy-policy', [\App\Http\Controllers\Admin\PrivacyPolicyController::class, 'edit'])
        ->name('admin.public.privacy-policy.edit');
    Route::put('admin/public/privacy-policy', [\App\Http\Controllers\Admin\PrivacyPolicyController::class, 'update'])
        ->name('admin.public.privacy-policy.update');

    Route::get('admin/public/contacts', [\App\Http\Controllers\Admin\PublicContactController::class, 'edit'])
        ->name('admin.public.contacts.edit');
    Route::put('admin/public/contacts', [\App\Http\Controllers\Admin\PublicContactController::class, 'update'])
        ->name('admin.public.contacts.update');
});

Route::get('mitra/dashboard', [\App\Http\Controllers\Mitra\DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'mitra'])
    ->name('mitra.dashboard');

Route::middleware(['auth', 'verified', 'mitra'])->group(function () {
    Route::get('mitra/chat', [\App\Http\Controllers\Mitra\ChatController::class, 'index'])
        ->name('mitra.chat.index');
    Route::get('mitra/chat/{conversation}', [\App\Http\Controllers\Mitra\ChatController::class, 'show'])
        ->name('mitra.chat.show');
    Route::post('mitra/chat/{conversation}/messages', [\App\Http\Controllers\Mitra\ChatController::class, 'store'])
        ->name('mitra.chat.messages.store');

    Route::post('mitra/onboarding/type', [\App\Http\Controllers\MitraOnboardingController::class, 'selectType'])
        ->name('mitra.onboarding.type');
    Route::get('mitra/onboarding', [\App\Http\Controllers\MitraOnboardingController::class, 'show'])
        ->name('mitra.onboarding');
    Route::patch('mitra/onboarding/step-1', [\App\Http\Controllers\MitraOnboardingController::class, 'updateStepOne'])
        ->name('mitra.onboarding.step1');
    Route::patch('mitra/onboarding/step-2', [\App\Http\Controllers\MitraOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.onboarding.step2');
    Route::post('mitra/onboarding/step-2', [\App\Http\Controllers\MitraOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.onboarding.step2.post');
    Route::patch('mitra/onboarding/step-3', [\App\Http\Controllers\MitraOnboardingController::class, 'updateStepThree'])
        ->name('mitra.onboarding.step3');
    Route::post('mitra/onboarding/submit-verification', [\App\Http\Controllers\MitraOnboardingController::class, 'submitVerification'])
        ->name('mitra.onboarding.submitVerification');
    Route::post('mitra/onboarding/submit-payout', [\App\Http\Controllers\MitraOnboardingController::class, 'submitPayout'])
        ->name('mitra.onboarding.submitPayout');

    Route::get('mitra/wisata/onboarding', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'show'])
        ->name('mitra.wisata.onboarding');
    Route::patch('mitra/wisata/onboarding/step-1', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'updateStepOne'])
        ->name('mitra.wisata.onboarding.step1');
    Route::post('mitra/wisata/onboarding/step-1', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'updateStepOne'])
        ->name('mitra.wisata.onboarding.step1.post');
    Route::patch('mitra/wisata/onboarding/step-2', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.wisata.onboarding.step2');
    Route::post('mitra/wisata/onboarding/step-2', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.wisata.onboarding.step2.post');
    Route::patch('mitra/wisata/onboarding/step-3', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'updateStepThree'])
        ->name('mitra.wisata.onboarding.step3');
    Route::post('mitra/wisata/onboarding/step-3', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'updateStepThree'])
        ->name('mitra.wisata.onboarding.step3.post');
    Route::post('mitra/wisata/onboarding/submit-verification', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'submitVerification'])
        ->name('mitra.wisata.onboarding.submitVerification');
    Route::post('mitra/wisata/onboarding/submit-payout', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'submitPayout'])
        ->name('mitra.wisata.onboarding.submitPayout');

    Route::get('mitra/event/onboarding', [\App\Http\Controllers\MitraEventOnboardingController::class, 'show'])
        ->name('mitra.event.onboarding');
    Route::patch('mitra/event/onboarding/step-1', [\App\Http\Controllers\MitraEventOnboardingController::class, 'updateStepOne'])
        ->name('mitra.event.onboarding.step1');
    Route::post('mitra/event/onboarding/step-1', [\App\Http\Controllers\MitraEventOnboardingController::class, 'updateStepOne'])
        ->name('mitra.event.onboarding.step1.post');
    Route::patch('mitra/event/onboarding/step-2', [\App\Http\Controllers\MitraEventOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.event.onboarding.step2');
    Route::post('mitra/event/onboarding/step-2', [\App\Http\Controllers\MitraEventOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.event.onboarding.step2.post');
    Route::patch('mitra/event/onboarding/step-3', [\App\Http\Controllers\MitraEventOnboardingController::class, 'updateStepThree'])
        ->name('mitra.event.onboarding.step3');
    Route::post('mitra/event/onboarding/step-3', [\App\Http\Controllers\MitraEventOnboardingController::class, 'updateStepThree'])
        ->name('mitra.event.onboarding.step3.post');
    Route::patch('mitra/event/onboarding/step-4', [\App\Http\Controllers\MitraEventOnboardingController::class, 'updateStepFour'])
        ->name('mitra.event.onboarding.step4');
    Route::post('mitra/event/onboarding/step-4', [\App\Http\Controllers\MitraEventOnboardingController::class, 'updateStepFour'])
        ->name('mitra.event.onboarding.step4.post');
    Route::post('mitra/event/onboarding/submit-verification', [\App\Http\Controllers\MitraEventOnboardingController::class, 'submitVerification'])
        ->name('mitra.event.onboarding.submitVerification');
});

Route::prefix('mitra')
    ->name('mitra.')
    ->middleware(['auth', 'verified', 'mitra', 'mitra.verified'])
    ->group(function () {
        Route::resource('hotels', \App\Http\Controllers\Mitra\HotelController::class)->except(['show']);
        Route::delete('hotels/{hotel}/images/{hotelImage}', [\App\Http\Controllers\Mitra\HotelController::class, 'destroyImage'])
            ->name('hotels.images.destroy');
        Route::resource('room-types', \App\Http\Controllers\Mitra\RoomTypeController::class);
        Route::delete('room-types/{roomType}/images/{roomImage}', [\App\Http\Controllers\Mitra\RoomTypeController::class, 'destroyImage'])
            ->name('room-types.images.destroy');
        Route::delete('room-inventories/bulk', [\App\Http\Controllers\Mitra\RoomInventoryController::class, 'bulkDestroy'])
            ->name('room-inventories.bulk-destroy');
        Route::resource('room-inventories', \App\Http\Controllers\Mitra\RoomInventoryController::class)->except(['show']);
        Route::get('bookings', [\App\Http\Controllers\Mitra\BookingController::class, 'index'])
            ->name('bookings.index');
        Route::get('bookings/{booking}', [\App\Http\Controllers\Mitra\BookingController::class, 'show'])
            ->name('bookings.show');
        Route::post('bookings/{booking}/cancel', [\App\Http\Controllers\Mitra\BookingController::class, 'cancel'])
            ->name('bookings.cancel');
        Route::post('bookings/{booking}/stay-status', [\App\Http\Controllers\Mitra\BookingController::class, 'updateStayStatus'])
            ->name('bookings.stay-status');
        Route::patch('bookings/{booking}/notes', [\App\Http\Controllers\Mitra\BookingController::class, 'updateNotes'])
            ->name('bookings.notes');
        Route::post('bookings/{booking}/refund', [\App\Http\Controllers\Mitra\BookingController::class, 'refund'])
            ->name('bookings.refund');
        Route::post('bookings/{booking}/dispute', [\App\Http\Controllers\Mitra\BookingController::class, 'dispute'])
            ->name('bookings.dispute');
        Route::get('occupancy', [\App\Http\Controllers\Mitra\OccupancyController::class, 'index'])
            ->name('occupancy.index');
        Route::get('finance/summary', [\App\Http\Controllers\Mitra\FinanceSummaryController::class, 'index'])
            ->name('finance.summary');
        Route::get('finance/payouts', [\App\Http\Controllers\Mitra\PayoutController::class, 'index'])
            ->name('finance.payouts');
        Route::get('finance/bank', [\App\Http\Controllers\Mitra\BankAccountController::class, 'edit'])
            ->name('finance.bank.edit');
        Route::patch('finance/bank', [\App\Http\Controllers\Mitra\BankAccountController::class, 'update'])
            ->name('finance.bank.update');
        Route::get('reviews', [\App\Http\Controllers\Mitra\ReviewController::class, 'index'])
            ->defaults('type', 'hotel')
            ->name('reviews.index');
        Route::post('reviews/{review}/reply', [\App\Http\Controllers\Mitra\ReviewController::class, 'reply'])
            ->defaults('type', 'hotel')
            ->name('reviews.reply');
        Route::delete('reviews/{review}', [\App\Http\Controllers\Mitra\ReviewController::class, 'destroy'])
            ->defaults('type', 'hotel')
            ->name('reviews.destroy');
    });

Route::prefix('mitra/wisata')
    ->name('mitra.wisata.')
    ->middleware(['auth', 'verified', 'mitra', 'mitra.wisata'])
    ->group(function () {
        Route::get('destination', [\App\Http\Controllers\Mitra\Wisata\DestinationController::class, 'edit'])
            ->name('destination.edit');
        Route::put('destination', [\App\Http\Controllers\Mitra\Wisata\DestinationController::class, 'update'])
            ->name('destination.update');

        Route::get('tickets', [\App\Http\Controllers\Mitra\Wisata\TicketController::class, 'index'])
            ->name('tickets.index');
        Route::get('tickets/create', [\App\Http\Controllers\Mitra\Wisata\TicketController::class, 'create'])
            ->name('tickets.create');
        Route::post('tickets', [\App\Http\Controllers\Mitra\Wisata\TicketController::class, 'store'])
            ->name('tickets.store');
        Route::put('tickets/{ticket}', [\App\Http\Controllers\Mitra\Wisata\TicketController::class, 'update'])
            ->name('tickets.update');
        Route::delete('tickets/{ticket}', [\App\Http\Controllers\Mitra\Wisata\TicketController::class, 'destroy'])
            ->name('tickets.destroy');

        Route::get('bookings', [\App\Http\Controllers\Mitra\Wisata\BookingController::class, 'index'])
            ->name('bookings.index');
        Route::get('bookings/{booking}', [\App\Http\Controllers\Mitra\Wisata\BookingController::class, 'show'])
            ->name('bookings.show');

        Route::get('scans', [\App\Http\Controllers\Mitra\Wisata\ScanController::class, 'index'])
            ->name('scans.index');
        Route::post('scans', [\App\Http\Controllers\Mitra\Wisata\ScanController::class, 'store'])
            ->name('scans.store');

        Route::get('finance/summary', [\App\Http\Controllers\Mitra\Wisata\FinanceController::class, 'summary'])
            ->name('finance.summary');
        Route::get('finance/payouts', [\App\Http\Controllers\Mitra\Wisata\FinanceController::class, 'payouts'])
            ->name('finance.payouts');

        Route::get('notifications', [\App\Http\Controllers\Mitra\Wisata\NotificationController::class, 'index'])
            ->name('notifications.index');
        Route::get('reviews', [\App\Http\Controllers\Mitra\ReviewController::class, 'index'])
            ->defaults('type', 'wisata')
            ->name('reviews.index');
        Route::post('reviews/{review}/reply', [\App\Http\Controllers\Mitra\ReviewController::class, 'reply'])
            ->defaults('type', 'wisata')
            ->name('reviews.reply');
        Route::delete('reviews/{review}', [\App\Http\Controllers\Mitra\ReviewController::class, 'destroy'])
            ->defaults('type', 'wisata')
            ->name('reviews.destroy');

        Route::get('disputes', [\App\Http\Controllers\Mitra\Wisata\DisputeController::class, 'index'])
            ->name('disputes.index');
        Route::post('disputes', [\App\Http\Controllers\Mitra\Wisata\DisputeController::class, 'store'])
            ->name('disputes.store');
    });

Route::prefix('mitra/events')
    ->name('mitra.events.')
    ->middleware(['auth', 'verified', 'mitra', 'mitra.event'])
    ->group(function () {
        Route::get('/', [\App\Http\Controllers\Mitra\Event\EventController::class, 'index'])
            ->name('index');
        Route::get('create', [\App\Http\Controllers\Mitra\Event\EventController::class, 'create'])
            ->name('create');
        Route::post('/', [\App\Http\Controllers\Mitra\Event\EventController::class, 'store'])
            ->name('store');

        Route::get('tickets', [\App\Http\Controllers\Mitra\Event\TicketController::class, 'index'])
            ->name('tickets.index');
        Route::get('tickets/create', [\App\Http\Controllers\Mitra\Event\TicketController::class, 'create'])
            ->name('tickets.create');
        Route::post('tickets', [\App\Http\Controllers\Mitra\Event\TicketController::class, 'store'])
            ->name('tickets.store');
        Route::put('tickets/{ticket}', [\App\Http\Controllers\Mitra\Event\TicketController::class, 'update'])
            ->name('tickets.update');
        Route::delete('tickets/{ticket}', [\App\Http\Controllers\Mitra\Event\TicketController::class, 'destroy'])
            ->name('tickets.destroy');

        Route::get('bookings', [\App\Http\Controllers\Mitra\Event\BookingController::class, 'index'])
            ->name('bookings.index');
        Route::get('bookings/{booking}', [\App\Http\Controllers\Mitra\Event\BookingController::class, 'show'])
            ->name('bookings.show');

        Route::get('attendees', [\App\Http\Controllers\Mitra\Event\AttendeeController::class, 'index'])
            ->name('attendees.index');

        Route::get('scans', [\App\Http\Controllers\Mitra\Event\ScanController::class, 'index'])
            ->name('scans.index');
        Route::post('scans', [\App\Http\Controllers\Mitra\Event\ScanController::class, 'store'])
            ->name('scans.store');

        Route::get('finance/summary', [\App\Http\Controllers\Mitra\Event\FinanceController::class, 'summary'])
            ->name('finance.summary');
        Route::get('finance/payouts', [\App\Http\Controllers\Mitra\Event\FinanceController::class, 'payouts'])
            ->name('finance.payouts');

        Route::get('notifications', [\App\Http\Controllers\Mitra\Event\NotificationController::class, 'index'])
            ->name('notifications.index');
        Route::get('reviews', [\App\Http\Controllers\Mitra\ReviewController::class, 'index'])
            ->defaults('type', 'event')
            ->name('reviews.index');
        Route::post('reviews/{review}/reply', [\App\Http\Controllers\Mitra\ReviewController::class, 'reply'])
            ->defaults('type', 'event')
            ->name('reviews.reply');
        Route::delete('reviews/{review}', [\App\Http\Controllers\Mitra\ReviewController::class, 'destroy'])
            ->defaults('type', 'event')
            ->name('reviews.destroy');

        Route::get('disputes', [\App\Http\Controllers\Mitra\Event\DisputeController::class, 'index'])
            ->name('disputes.index');
        Route::post('disputes', [\App\Http\Controllers\Mitra\Event\DisputeController::class, 'store'])
            ->name('disputes.store');

        Route::get('{event}', [\App\Http\Controllers\Mitra\Event\EventController::class, 'show'])
            ->name('show');
        Route::get('{event}/edit', [\App\Http\Controllers\Mitra\Event\EventController::class, 'edit'])
            ->name('edit');
        Route::put('{event}', [\App\Http\Controllers\Mitra\Event\EventController::class, 'update'])
            ->name('update');
        Route::post('{event}/submit', [\App\Http\Controllers\Mitra\Event\EventController::class, 'submit'])
            ->name('submit');
    });

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('hotels', \App\Http\Controllers\HotelController::class)->except(['show']);
    Route::resource('room-types', \App\Http\Controllers\RoomTypeController::class);
    Route::delete('room-inventories/bulk', [\App\Http\Controllers\RoomInventoryController::class, 'bulkDestroy'])
        ->name('room-inventories.bulk-destroy');
    Route::resource('room-inventories', \App\Http\Controllers\RoomInventoryController::class)->except(['show']);
    Route::delete('room-types/{roomType}/images/{roomImage}', [\App\Http\Controllers\RoomTypeController::class, 'destroyImage'])
        ->name('room-types.images.destroy');
    Route::delete('hotels/{hotel}/images/{hotelImage}', [\App\Http\Controllers\HotelController::class, 'destroyImage'])
        ->name('hotels.images.destroy');
    Route::post('reviews', [\App\Http\Controllers\PublicReviewController::class, 'store'])
        ->name('reviews.store');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/email/otp', [\App\Http\Controllers\EmailOtpController::class, 'show'])
        ->name('email-otp.notice');
    Route::post('/email/otp', [\App\Http\Controllers\EmailOtpController::class, 'verify'])
        ->name('email-otp.verify');
    Route::post('/email/otp/resend', [\App\Http\Controllers\EmailOtpController::class, 'resend'])
        ->name('email-otp.resend');
});

Route::get('/stay', [\App\Http\Controllers\PublicHotelController::class, 'search'])
    ->name('public.hotels.search');
Route::get('/stay/hotels/{hotel}', [\App\Http\Controllers\PublicHotelController::class, 'show'])
    ->name('public.hotels.show');
Route::get('/events', [\App\Http\Controllers\PublicEventController::class, 'index'])
    ->name('events.search');
Route::get('/events/{event}', [\App\Http\Controllers\PublicEventController::class, 'show'])
    ->name('events.show');
Route::get('/academy', [\App\Http\Controllers\PublicAcademyController::class, 'index'])
    ->name('academy.search');
Route::get('/academy/{class}', [\App\Http\Controllers\PublicAcademyController::class, 'show'])
    ->name('academy.show');
Route::get('/special-programs', [\App\Http\Controllers\PublicSpecialProgramController::class, 'index'])
    ->name('special-programs.search');
Route::get('/special-programs/{program}', [\App\Http\Controllers\PublicSpecialProgramController::class, 'show'])
    ->name('special-programs.show');
Route::get('/jelajah', [\App\Http\Controllers\PublicBlogController::class, 'index'])
    ->name('public.blog.index');
Route::get('/jelajah/{slug}', [\App\Http\Controllers\PublicBlogController::class, 'show'])
    ->name('public.blog.show');
Route::get('/faq', [\App\Http\Controllers\PublicFaqController::class, 'index'])
    ->name('public.faq');
Route::get('/privacy-policy', [\App\Http\Controllers\PublicPrivacyPolicyController::class, 'show'])
    ->name('public.privacy-policy');

Route::get('/souvenir/cart', [\App\Http\Controllers\SouvenirCartController::class, 'index'])
    ->name('souvenir.cart');
Route::post('/souvenir/cart/add', [\App\Http\Controllers\SouvenirCartController::class, 'add'])
    ->name('souvenir.cart.add');
Route::post('/souvenir/cart/update', [\App\Http\Controllers\SouvenirCartController::class, 'update'])
    ->name('souvenir.cart.update');
Route::post('/souvenir/cart/remove', [\App\Http\Controllers\SouvenirCartController::class, 'remove'])
    ->name('souvenir.cart.remove');
Route::post('/souvenir/cart/clear', [\App\Http\Controllers\SouvenirCartController::class, 'clear'])
    ->name('souvenir.cart.clear');
Route::get('/souvenir', [\App\Http\Controllers\PublicSouvenirController::class, 'index'])
    ->name('souvenir.search');

Route::middleware(['auth', 'verified', 'user'])->group(function () {
    Route::get('/souvenir/checkout', [\App\Http\Controllers\SouvenirBookingController::class, 'review'])
        ->name('souvenir.checkout.review');
    Route::post('/souvenir/checkout/confirm', [\App\Http\Controllers\SouvenirBookingController::class, 'confirm'])
        ->name('souvenir.checkout.confirm');
    Route::get('/souvenir/booking/{order}', [\App\Http\Controllers\SouvenirBookingController::class, 'show'])
        ->name('souvenir.booking.show');
    Route::get('/souvenir/booking/{order}/payment', [\App\Http\Controllers\SouvenirBookingController::class, 'payment'])
        ->name('souvenir.booking.payment');
});
Route::get('/souvenir/{product}', [\App\Http\Controllers\PublicSouvenirController::class, 'show'])
    ->name('souvenir.show');
Route::get('/wisata', [\App\Http\Controllers\PublicWisataController::class, 'index'])
    ->name('wisata.search');
Route::get('/wisata/{destination}', [\App\Http\Controllers\PublicWisataController::class, 'show'])
    ->name('wisata.show');
Route::post('/events/booking/prepare', [\App\Http\Controllers\EventPublicBookingController::class, 'prepare'])
    ->name('events.booking.prepare');
Route::post('/academy/booking/prepare', [\App\Http\Controllers\AcademyPublicBookingController::class, 'prepare'])
    ->name('academy.booking.prepare');
Route::post('/special-programs/booking/prepare', [\App\Http\Controllers\SpecialProgramBookingController::class, 'prepare'])
    ->name('special-programs.booking.prepare');
Route::post('/wisata/booking/prepare', [\App\Http\Controllers\WisataBookingController::class, 'prepare'])
    ->name('wisata.booking.prepare');
Route::post('/booking/prepare', [\App\Http\Controllers\BookingController::class, 'prepare'])
    ->name('booking.prepare');

Route::get('/auth/google/redirect', [\App\Http\Controllers\Auth\SocialAuthController::class, 'redirect'])
    ->name('auth.google.redirect');
Route::get('/auth/google/callback', [\App\Http\Controllers\Auth\SocialAuthController::class, 'callback'])
    ->name('auth.google.callback');

Route::post('/affiliate/referral/apply', [\App\Http\Controllers\Affiliate\ReferralController::class, 'apply'])
    ->name('affiliate.referral.apply');
Route::post('/affiliate/referral/clear', [\App\Http\Controllers\Affiliate\ReferralController::class, 'clear'])
    ->name('affiliate.referral.clear');

Route::middleware(['auth', 'verified', 'user'])->prefix('affiliate')->name('affiliate.')->group(function () {
    Route::get('register', [\App\Http\Controllers\Affiliate\RegisterController::class, 'create'])
        ->name('register');
    Route::post('register', [\App\Http\Controllers\Affiliate\RegisterController::class, 'store'])
        ->name('register.store');
});

Route::middleware(['auth', 'verified', 'user', 'affiliate.user'])->prefix('affiliate')->name('affiliate.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Affiliate\DashboardController::class, 'index'])
        ->name('dashboard');
    Route::get('profile', [\App\Http\Controllers\Affiliate\ProfileController::class, 'show'])
        ->name('profile');
    Route::put('profile', [\App\Http\Controllers\Affiliate\ProfileController::class, 'update'])
        ->name('profile.update');
    Route::get('catalog', [\App\Http\Controllers\Affiliate\CatalogController::class, 'index'])
        ->name('catalog');
    Route::get('links', [\App\Http\Controllers\Affiliate\LinkController::class, 'index'])
        ->name('links');
    Route::post('links', [\App\Http\Controllers\Affiliate\LinkController::class, 'store'])
        ->name('links.store');
    Route::get('commissions', [\App\Http\Controllers\Affiliate\CommissionController::class, 'index'])
        ->name('commissions');
    Route::get('payouts', [\App\Http\Controllers\Affiliate\PayoutController::class, 'index'])
        ->name('payouts');
    Route::post('payouts', [\App\Http\Controllers\Affiliate\PayoutController::class, 'store'])
        ->name('payouts.store');
    Route::get('notifications', [\App\Http\Controllers\Affiliate\NotificationController::class, 'index'])
        ->name('notifications');
    Route::get('terms', [\App\Http\Controllers\Affiliate\TermsController::class, 'index'])
        ->name('terms');
    Route::get('support', [\App\Http\Controllers\Affiliate\SupportController::class, 'index'])
        ->name('support');
});
Route::middleware(['auth', 'verified', 'user'])->group(function () {
    Route::get('/chat', [\App\Http\Controllers\ChatController::class, 'index'])
        ->name('chat.index');
    Route::get('/chat/start/{type}/{id?}', [\App\Http\Controllers\ChatController::class, 'start'])
        ->name('chat.start');
    Route::get('/chat/{conversation}', [\App\Http\Controllers\ChatController::class, 'show'])
        ->name('chat.show');
    Route::post('/chat/{conversation}/messages', [\App\Http\Controllers\ChatController::class, 'store'])
        ->name('chat.messages.store');

    Route::get('/notifications', [\App\Http\Controllers\PublicNotificationController::class, 'index'])
        ->name('public.notifications');
    Route::post('/notifications/read-all', [\App\Http\Controllers\PublicNotificationController::class, 'markAllRead'])
        ->name('public.notifications.readAll');
    Route::post('/notifications/{notification}/read', [\App\Http\Controllers\PublicNotificationController::class, 'markRead'])
        ->name('public.notifications.read');
    Route::get('/history', [\App\Http\Controllers\PublicHistoryController::class, 'index'])
        ->name('public.history');
    Route::get('/wisata/history', [\App\Http\Controllers\PublicWisataHistoryController::class, 'index'])
        ->name('public.wisata.history');
    Route::get('/booking/review', [\App\Http\Controllers\BookingController::class, 'review'])
        ->name('booking.review');
    Route::post('/booking/confirm', [\App\Http\Controllers\BookingController::class, 'confirm'])
        ->name('booking.confirm');
    Route::post('/booking/voucher', [\App\Http\Controllers\BookingController::class, 'applyVoucher'])
        ->name('booking.voucher.apply');
    Route::post('/booking/voucher/remove', [\App\Http\Controllers\BookingController::class, 'removeVoucher'])
        ->name('booking.voucher.remove');
    Route::get('/booking/{booking}/payment', [\App\Http\Controllers\BookingController::class, 'payment'])
        ->name('booking.payment');
    Route::post('/booking/{booking}/payment', [\App\Http\Controllers\BookingController::class, 'pay'])
        ->name('booking.pay');
    Route::post('/booking/{booking}/cancel', [\App\Http\Controllers\BookingController::class, 'cancel'])
        ->name('booking.cancel');
    Route::get('/booking/{booking}/invoice', [\App\Http\Controllers\BookingController::class, 'invoice'])
        ->name('booking.invoice');
    Route::get('/booking/{booking}', [\App\Http\Controllers\BookingController::class, 'show'])
        ->name('booking.show');

    Route::get('/events/booking/review', [\App\Http\Controllers\EventPublicBookingController::class, 'review'])
        ->name('events.booking.review');
    Route::post('/events/booking/confirm', [\App\Http\Controllers\EventPublicBookingController::class, 'confirm'])
        ->name('events.booking.confirm');
    Route::get('/events/booking/{booking}/payment', [\App\Http\Controllers\EventPublicBookingController::class, 'payment'])
        ->name('events.booking.payment');
    Route::post('/events/booking/{booking}/payment', [\App\Http\Controllers\EventPublicBookingController::class, 'pay'])
        ->name('events.booking.pay');
    Route::get('/events/booking/{booking}/ticket', [\App\Http\Controllers\EventPublicBookingController::class, 'ticket'])
        ->name('events.booking.ticket');
    Route::get('/events/booking/{booking}', [\App\Http\Controllers\EventPublicBookingController::class, 'show'])
        ->name('events.booking.show');

    Route::get('/academy/booking/review', [\App\Http\Controllers\AcademyPublicBookingController::class, 'review'])
        ->name('academy.booking.review');
    Route::post('/academy/booking/confirm', [\App\Http\Controllers\AcademyPublicBookingController::class, 'confirm'])
        ->name('academy.booking.confirm');
    Route::get('/academy/booking/{booking}/payment', [\App\Http\Controllers\AcademyPublicBookingController::class, 'payment'])
        ->name('academy.booking.payment');
    Route::get('/academy/booking/{booking}/ticket', [\App\Http\Controllers\AcademyPublicBookingController::class, 'ticket'])
        ->name('academy.booking.ticket');
    Route::get('/academy/booking/{booking}', [\App\Http\Controllers\AcademyPublicBookingController::class, 'show'])
        ->name('academy.booking.show');

    Route::get('/special-programs/booking/review', [\App\Http\Controllers\SpecialProgramBookingController::class, 'review'])
        ->name('special-programs.booking.review');
    Route::post('/special-programs/booking/confirm', [\App\Http\Controllers\SpecialProgramBookingController::class, 'confirm'])
        ->name('special-programs.booking.confirm');
    Route::get('/special-programs/booking/{booking}/payment', [\App\Http\Controllers\SpecialProgramBookingController::class, 'payment'])
        ->name('special-programs.booking.payment');
    Route::get('/special-programs/booking/{booking}/ticket', [\App\Http\Controllers\SpecialProgramBookingController::class, 'ticket'])
        ->name('special-programs.booking.ticket');
    Route::get('/special-programs/booking/{booking}', [\App\Http\Controllers\SpecialProgramBookingController::class, 'show'])
        ->name('special-programs.booking.show');

    Route::get('/wisata/booking/review', [\App\Http\Controllers\WisataBookingController::class, 'review'])
        ->name('wisata.booking.review');
    Route::post('/wisata/booking/confirm', [\App\Http\Controllers\WisataBookingController::class, 'confirm'])
        ->name('wisata.booking.confirm');
    Route::get('/wisata/booking/{booking}/payment', [\App\Http\Controllers\WisataBookingController::class, 'payment'])
        ->name('wisata.booking.payment');
    Route::post('/wisata/booking/{booking}/payment', [\App\Http\Controllers\WisataBookingController::class, 'pay'])
        ->name('wisata.booking.pay');
    Route::get('/wisata/booking/{booking}/ticket', [\App\Http\Controllers\WisataBookingController::class, 'ticket'])
        ->name('wisata.booking.ticket');
    Route::get('/wisata/booking/{booking}', [\App\Http\Controllers\WisataBookingController::class, 'show'])
        ->name('wisata.booking.show');
});
Route::post('/payments/midtrans/callback', \App\Http\Controllers\MidtransCallbackController::class)
    ->name('payments.midtrans.callback');

require __DIR__.'/settings.php';
