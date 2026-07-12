<?php

use App\Http\Controllers\AcademyPublicBookingController;
use App\Http\Controllers\Admin\AboutPageController;
use App\Http\Controllers\Admin\Academy\AttendeeController;
use App\Http\Controllers\Admin\Academy\AuditController;
use App\Http\Controllers\Admin\Academy\ClassController;
use App\Http\Controllers\Admin\Academy\FinanceController;
use App\Http\Controllers\Admin\Academy\ReportController;
use App\Http\Controllers\Admin\Academy\ScanController;
use App\Http\Controllers\Admin\Academy\SettingController;
use App\Http\Controllers\Admin\Academy\TicketController;
use App\Http\Controllers\Admin\AdminAuditLogController;
use App\Http\Controllers\Admin\BlogCategoryController;
use App\Http\Controllers\Admin\BlogPostController;
use App\Http\Controllers\Admin\BlogTagController;
use App\Http\Controllers\Admin\CommissionRuleController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EventAttendeeController;
use App\Http\Controllers\Admin\EventAuditController;
use App\Http\Controllers\Admin\EventBookingController;
use App\Http\Controllers\Admin\EventContentController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\EventExceptionController;
use App\Http\Controllers\Admin\EventFinanceController;
use App\Http\Controllers\Admin\EventOrganizerController;
use App\Http\Controllers\Admin\EventReviewController;
use App\Http\Controllers\Admin\EventScanController;
use App\Http\Controllers\Admin\EventSettingController;
use App\Http\Controllers\Admin\EventTicketController;
use App\Http\Controllers\Admin\FaqController;
use App\Http\Controllers\Admin\FinanceReportController;
use App\Http\Controllers\Admin\HomeContentController;
use App\Http\Controllers\Admin\MitraController;
use App\Http\Controllers\Admin\MitraWisataController;
use App\Http\Controllers\Admin\NotificationControlController;
use App\Http\Controllers\Admin\PartnerTermsDocumentController;
use App\Http\Controllers\Admin\PayoutController;
use App\Http\Controllers\Admin\PrivacyPolicyController;
use App\Http\Controllers\Admin\ProductReviewController;
use App\Http\Controllers\Admin\PromoItemController;
use App\Http\Controllers\Admin\PublicBannerController;
use App\Http\Controllers\Admin\PublicContactController;
use App\Http\Controllers\Admin\RoleManagementController;
use App\Http\Controllers\Admin\SouvenirAuditController;
use App\Http\Controllers\Admin\SouvenirCategoryController;
use App\Http\Controllers\Admin\SouvenirInventoryController;
use App\Http\Controllers\Admin\SouvenirOrderController;
use App\Http\Controllers\Admin\SouvenirProductController;
use App\Http\Controllers\Admin\SouvenirPromotionController;
use App\Http\Controllers\Admin\SouvenirRefundController;
use App\Http\Controllers\Admin\SouvenirReportController;
use App\Http\Controllers\Admin\SouvenirSettingController;
use App\Http\Controllers\Admin\SouvenirVariantController;
use App\Http\Controllers\Admin\SpecialAdminController;
use App\Http\Controllers\Admin\SpecialProgramAttendeeController;
use App\Http\Controllers\Admin\SpecialProgramController;
use App\Http\Controllers\Admin\SpecialProgramReviewController;
use App\Http\Controllers\Admin\SpecialProgramScanController;
use App\Http\Controllers\Admin\SpecialProgramTicketController;
use App\Http\Controllers\Admin\SystemSettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VoucherController;
use App\Http\Controllers\Admin\WisataAffiliate\AffiliateController;
use App\Http\Controllers\Admin\WisataAffiliate\CampaignController;
use App\Http\Controllers\Admin\WisataAffiliate\CommissionLogController;
use App\Http\Controllers\Admin\WisataAffiliate\ExceptionController;
use App\Http\Controllers\Admin\WisataAffiliate\PerformanceController;
use App\Http\Controllers\Admin\WisataContentController;
use App\Http\Controllers\Admin\WisataDestinationController;
use App\Http\Controllers\Admin\WisataExceptionController;
use App\Http\Controllers\Admin\WisataFinanceController;
use App\Http\Controllers\Admin\WisataScanController;
use App\Http\Controllers\Admin\WisataTicketController;
use App\Http\Controllers\Affiliate\CatalogController;
use App\Http\Controllers\Affiliate\CommissionController;
use App\Http\Controllers\Affiliate\LinkController;
use App\Http\Controllers\Affiliate\NotificationController;
use App\Http\Controllers\Affiliate\ProfileController;
use App\Http\Controllers\Affiliate\ReferralController;
use App\Http\Controllers\Affiliate\RegisterController;
use App\Http\Controllers\Affiliate\SupportController;
use App\Http\Controllers\Affiliate\TermsController;
use App\Http\Controllers\Auth\MobileEmailVerificationController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\EventPublicBookingController;
use App\Http\Controllers\HotelController;
use App\Http\Controllers\MidtransCallbackController;
use App\Http\Controllers\Mitra\BankAccountController;
use App\Http\Controllers\Mitra\FinanceSummaryController;
use App\Http\Controllers\Mitra\OccupancyController;
use App\Http\Controllers\Mitra\PartnerTermsSignatureController;
use App\Http\Controllers\Mitra\ReviewController;
use App\Http\Controllers\Mitra\Wisata\DestinationController;
use App\Http\Controllers\Mitra\Wisata\DisputeController;
use App\Http\Controllers\MitraEventOnboardingController;
use App\Http\Controllers\MitraOnboardingController;
use App\Http\Controllers\MitraWisataOnboardingController;
use App\Http\Controllers\PublicAboutController;
use App\Http\Controllers\PublicAcademyController;
use App\Http\Controllers\PublicBlogController;
use App\Http\Controllers\PublicDeleteAccountController;
use App\Http\Controllers\PublicEventController;
use App\Http\Controllers\PublicFaqController;
use App\Http\Controllers\PublicHistoryController;
use App\Http\Controllers\PublicHomeController;
use App\Http\Controllers\PublicHotelController;
use App\Http\Controllers\PublicNotificationController;
use App\Http\Controllers\PublicPrivacyPolicyController;
use App\Http\Controllers\PublicPromoController;
use App\Http\Controllers\PublicReviewController;
use App\Http\Controllers\PublicSouvenirController;
use App\Http\Controllers\PublicSpecialProgramController;
use App\Http\Controllers\PublicWisataController;
use App\Http\Controllers\PublicWisataHistoryController;
use App\Http\Controllers\RoomInventoryController;
use App\Http\Controllers\RoomTypeController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\SouvenirBookingController;
use App\Http\Controllers\SouvenirCartController;
use App\Http\Controllers\SpecialProgramBookingController;
use App\Http\Controllers\WisataBookingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicHomeController::class, 'index'])
    ->name('home');
Route::get('/promo', [PublicPromoController::class, 'index'])
    ->name('promo.index');
Route::get('/promo/{promoItem:slug}', [PublicPromoController::class, 'show'])
    ->name('promo.show');
Route::get('/sitemap.xml', SitemapController::class)
    ->name('sitemap');

Route::get(
    '/mobile/email/verify/{id}/{hash}',
    MobileEmailVerificationController::class,
)
    ->middleware(['signed', 'throttle:6,1'])
    ->whereNumber('id')
    ->name('mobile.verification.verify');

Route::get('dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'admin'])
    ->name('dashboard');

Route::middleware(['auth', 'verified', 'admin', 'admin.log'])->group(function () {
    Route::get('admin/chat', [App\Http\Controllers\Admin\ChatController::class, 'index'])
        ->name('admin.chat.index');
    Route::get('admin/chat/{conversation}', [App\Http\Controllers\Admin\ChatController::class, 'show'])
        ->name('admin.chat.show');
    Route::post('admin/chat/{conversation}/messages', [App\Http\Controllers\Admin\ChatController::class, 'store'])
        ->name('admin.chat.messages.store');

    Route::get('admin/special-programs', [SpecialProgramController::class, 'index'])
        ->name('admin.special-programs.index');
    Route::get('admin/special-programs/create', [SpecialProgramController::class, 'create'])
        ->name('admin.special-programs.create');
    Route::post('admin/special-programs', [SpecialProgramController::class, 'store'])
        ->name('admin.special-programs.store');
    Route::get('admin/special-programs/tickets', [SpecialProgramTicketController::class, 'index'])
        ->name('admin.special-programs.tickets.index');
    Route::post('admin/special-programs/tickets', [SpecialProgramTicketController::class, 'store'])
        ->name('admin.special-programs.tickets.store');
    Route::put('admin/special-programs/tickets/{ticket}', [SpecialProgramTicketController::class, 'update'])
        ->name('admin.special-programs.tickets.update');
    Route::delete('admin/special-programs/tickets/{ticket}', [SpecialProgramTicketController::class, 'destroy'])
        ->name('admin.special-programs.tickets.destroy');
    Route::get('admin/special-programs/bookings', [App\Http\Controllers\Admin\SpecialProgramBookingController::class, 'index'])
        ->name('admin.special-programs.bookings.index');
    Route::get('admin/special-programs/bookings/{booking}', [App\Http\Controllers\Admin\SpecialProgramBookingController::class, 'show'])
        ->name('admin.special-programs.bookings.show');
    Route::post('admin/special-programs/bookings/{booking}/status', [App\Http\Controllers\Admin\SpecialProgramBookingController::class, 'updateStatus'])
        ->name('admin.special-programs.bookings.status');
    Route::get('admin/special-programs/attendees', [SpecialProgramAttendeeController::class, 'index'])
        ->name('admin.special-programs.attendees.index');
    Route::get('admin/special-programs/scans', [SpecialProgramScanController::class, 'index'])
        ->name('admin.special-programs.scans.index');
    Route::post('admin/special-programs/scans', [SpecialProgramScanController::class, 'store'])
        ->name('admin.special-programs.scans.store');
    Route::get('admin/special-programs/reviews', [SpecialProgramReviewController::class, 'index'])
        ->name('admin.special-programs.reviews.index');
    Route::post('admin/special-programs/reviews/{review}/reply', [SpecialProgramReviewController::class, 'reply'])
        ->name('admin.special-programs.reviews.reply');
    Route::delete('admin/special-programs/reviews/{review}', [SpecialProgramReviewController::class, 'destroy'])
        ->name('admin.special-programs.reviews.destroy');
    Route::get('admin/special-programs/{program}/edit', [SpecialProgramController::class, 'edit'])
        ->name('admin.special-programs.edit');
    Route::put('admin/special-programs/{program}', [SpecialProgramController::class, 'update'])
        ->name('admin.special-programs.update');
    Route::delete('admin/special-programs/{program}', [SpecialProgramController::class, 'destroy'])
        ->name('admin.special-programs.destroy');
    Route::get('admin/special-programs/{program}', [SpecialProgramController::class, 'show'])
        ->name('admin.special-programs.show');
    Route::post('admin/special-programs/{program}/status', [SpecialProgramController::class, 'updateStatus'])
        ->name('admin.special-programs.status');

    Route::get('admin/retail-shop/products', [SouvenirProductController::class, 'index'])
        ->name('admin.souvenir.products.index');
    Route::post('admin/retail-shop/products', [SouvenirProductController::class, 'store'])
        ->name('admin.souvenir.products.store');
    Route::put('admin/retail-shop/products/{product}', [SouvenirProductController::class, 'update'])
        ->name('admin.souvenir.products.update');
    Route::post('admin/retail-shop/products/{product}/duplicate', [SouvenirProductController::class, 'duplicate'])
        ->name('admin.souvenir.products.duplicate');
    Route::delete('admin/retail-shop/products/{product}', [SouvenirProductController::class, 'destroy'])
        ->name('admin.souvenir.products.destroy');
    Route::delete('admin/retail-shop/products/{product}/force', [SouvenirProductController::class, 'forceDelete'])
        ->name('admin.souvenir.products.force-delete');
    Route::delete('admin/retail-shop/products/{product}/images/{image}', [SouvenirProductController::class, 'destroyImage'])
        ->name('admin.souvenir.products.images.destroy');

    Route::get('admin/retail-shop/categories', [SouvenirCategoryController::class, 'index'])
        ->name('admin.souvenir.categories.index');
    Route::post('admin/retail-shop/categories', [SouvenirCategoryController::class, 'store'])
        ->name('admin.souvenir.categories.store');
    Route::put('admin/retail-shop/categories/{category}', [SouvenirCategoryController::class, 'update'])
        ->name('admin.souvenir.categories.update');
    Route::delete('admin/retail-shop/categories/{category}', [SouvenirCategoryController::class, 'destroy'])
        ->name('admin.souvenir.categories.destroy');

    Route::get('admin/retail-shop/variants', [SouvenirVariantController::class, 'index'])
        ->name('admin.souvenir.variants.index');
    Route::post('admin/retail-shop/variants', [SouvenirVariantController::class, 'store'])
        ->name('admin.souvenir.variants.store');
    Route::put('admin/retail-shop/variants/{variant}', [SouvenirVariantController::class, 'update'])
        ->name('admin.souvenir.variants.update');
    Route::delete('admin/retail-shop/variants/{variant}', [SouvenirVariantController::class, 'destroy'])
        ->name('admin.souvenir.variants.destroy');

    Route::get('admin/retail-shop/inventory', [SouvenirInventoryController::class, 'index'])
        ->name('admin.souvenir.inventory.index');
    Route::post('admin/retail-shop/inventory', [SouvenirInventoryController::class, 'store'])
        ->name('admin.souvenir.inventory.store');

    Route::get('admin/retail-shop/orders', [SouvenirOrderController::class, 'index'])
        ->name('admin.souvenir.orders.index');
    Route::get('admin/retail-shop/orders/{order}', [SouvenirOrderController::class, 'show'])
        ->name('admin.souvenir.orders.show');
    Route::post('admin/retail-shop/orders/{order}/status', [SouvenirOrderController::class, 'updateStatus'])
        ->name('admin.souvenir.orders.status');
    Route::post('admin/retail-shop/orders/{order}/shipping', [SouvenirOrderController::class, 'updateShipping'])
        ->name('admin.souvenir.orders.shipping');
    Route::get('admin/retail-shop/fulfillment', [SouvenirOrderController::class, 'fulfillment'])
        ->name('admin.souvenir.fulfillment.index');

    Route::get('admin/retail-shop/refunds', [SouvenirRefundController::class, 'index'])
        ->name('admin.souvenir.refunds.index');
    Route::post('admin/retail-shop/refunds', [SouvenirRefundController::class, 'store'])
        ->name('admin.souvenir.refunds.store');
    Route::put('admin/retail-shop/refunds/{refund}', [SouvenirRefundController::class, 'update'])
        ->name('admin.souvenir.refunds.update');

    Route::get('admin/retail-shop/promotions', [SouvenirPromotionController::class, 'index'])
        ->name('admin.souvenir.promotions.index');
    Route::post('admin/retail-shop/promotions', [SouvenirPromotionController::class, 'store'])
        ->name('admin.souvenir.promotions.store');
    Route::put('admin/retail-shop/promotions/{promotion}', [SouvenirPromotionController::class, 'update'])
        ->name('admin.souvenir.promotions.update');
    Route::delete('admin/retail-shop/promotions/{promotion}', [SouvenirPromotionController::class, 'destroy'])
        ->name('admin.souvenir.promotions.destroy');

    Route::get('admin/retail-shop/reports', [SouvenirReportController::class, 'index'])
        ->name('admin.souvenir.reports.index');
    Route::get('admin/retail-shop/audit', [SouvenirAuditController::class, 'index'])
        ->name('admin.souvenir.audit.index');

    Route::get('admin/retail-shop/settings', [SouvenirSettingController::class, 'index'])
        ->name('admin.souvenir.settings.index');
    Route::post('admin/retail-shop/settings', [SouvenirSettingController::class, 'update'])
        ->name('admin.souvenir.settings.update');

    Route::redirect('admin/souvenir', 'admin/retail-shop/products');
    Route::redirect('admin/souvenir/{any}', 'admin/retail-shop/{any}')->where('any', '.*');

    Route::get('admin/blog/posts', [BlogPostController::class, 'index'])
        ->name('admin.blog.posts.index');
    Route::get('admin/blog/posts/create', [BlogPostController::class, 'create'])
        ->name('admin.blog.posts.create');
    Route::post('admin/blog/posts', [BlogPostController::class, 'store'])
        ->name('admin.blog.posts.store');
    Route::get('admin/blog/posts/{post}/edit', [BlogPostController::class, 'edit'])
        ->name('admin.blog.posts.edit');
    Route::put('admin/blog/posts/{post}', [BlogPostController::class, 'update'])
        ->name('admin.blog.posts.update');
    Route::delete('admin/blog/posts/{post}', [BlogPostController::class, 'destroy'])
        ->name('admin.blog.posts.destroy');

    Route::get('admin/blog/categories', [BlogCategoryController::class, 'index'])
        ->name('admin.blog.categories.index');
    Route::post('admin/blog/categories', [BlogCategoryController::class, 'store'])
        ->name('admin.blog.categories.store');
    Route::put('admin/blog/categories/{category}', [BlogCategoryController::class, 'update'])
        ->name('admin.blog.categories.update');
    Route::delete('admin/blog/categories/{category}', [BlogCategoryController::class, 'destroy'])
        ->name('admin.blog.categories.destroy');

    Route::get('admin/blog/tags', [BlogTagController::class, 'index'])
        ->name('admin.blog.tags.index');
    Route::post('admin/blog/tags', [BlogTagController::class, 'store'])
        ->name('admin.blog.tags.store');
    Route::put('admin/blog/tags/{tag}', [BlogTagController::class, 'update'])
        ->name('admin.blog.tags.update');
    Route::delete('admin/blog/tags/{tag}', [BlogTagController::class, 'destroy'])
        ->name('admin.blog.tags.destroy');

    Route::get('admin/events/organizers', [EventOrganizerController::class, 'index'])
        ->name('admin.events.organizers.index');
    Route::post('admin/events/organizers', [EventOrganizerController::class, 'store'])
        ->name('admin.events.organizers.store');
    Route::get('admin/events/organizers/{organizer}', [EventOrganizerController::class, 'show'])
        ->name('admin.events.organizers.show');
    Route::delete('admin/events/organizers/{organizer}', [EventOrganizerController::class, 'destroy'])
        ->name('admin.events.organizers.destroy');
    Route::post('admin/events/organizers/{organizer}/status', [EventOrganizerController::class, 'updateStatus'])
        ->name('admin.events.organizers.status');

    Route::get('admin/events', [EventController::class, 'index'])
        ->name('admin.events.index');
    Route::get('admin/events/create', [EventController::class, 'create'])
        ->name('admin.events.create');
    Route::post('admin/events', [EventController::class, 'store'])
        ->name('admin.events.store');

    Route::get('admin/events/tickets', [EventTicketController::class, 'index'])
        ->name('admin.events.tickets.index');
    Route::get('admin/events/tickets/create', [EventTicketController::class, 'create'])
        ->name('admin.events.tickets.create');
    Route::post('admin/events/tickets', [EventTicketController::class, 'store'])
        ->name('admin.events.tickets.store');
    Route::get('admin/events/tickets/{ticket}/edit', [EventTicketController::class, 'edit'])
        ->name('admin.events.tickets.edit');
    Route::put('admin/events/tickets/{ticket}', [EventTicketController::class, 'update'])
        ->name('admin.events.tickets.update');
    Route::delete('admin/events/tickets/{ticket}', [EventTicketController::class, 'destroy'])
        ->name('admin.events.tickets.destroy');

    Route::get('admin/events/bookings', [EventBookingController::class, 'index'])
        ->name('admin.events.bookings.index');
    Route::get('admin/events/bookings/{booking}', [EventBookingController::class, 'show'])
        ->name('admin.events.bookings.show');

    Route::get('admin/events/attendees', [EventAttendeeController::class, 'index'])
        ->name('admin.events.attendees.index');

    Route::get('admin/events/scans', [EventScanController::class, 'index'])
        ->name('admin.events.scans.index');
    Route::get('admin/events/content', [EventContentController::class, 'index'])
        ->name('admin.events.content.index');
    Route::get('admin/events/reviews', [EventReviewController::class, 'index'])
        ->name('admin.events.reviews.index');

    Route::get('admin/reviews', [ProductReviewController::class, 'index'])
        ->name('admin.reviews.index');
    Route::post('admin/reviews/{review}/reply', [ProductReviewController::class, 'reply'])
        ->name('admin.reviews.reply');
    Route::delete('admin/reviews/{review}', [ProductReviewController::class, 'destroy'])
        ->name('admin.reviews.destroy');

    Route::get('admin/events/exceptions', [EventExceptionController::class, 'index'])
        ->name('admin.events.exceptions.index');
    Route::post('admin/events/{event}/exception', [EventExceptionController::class, 'updateEvent'])
        ->whereNumber('event')
        ->name('admin.events.exceptions.update');
    Route::post('admin/events/bookings/{booking}/refund', [EventExceptionController::class, 'refund'])
        ->name('admin.events.refunds.store');

    Route::get('admin/events/finance/commissions', [EventFinanceController::class, 'commissions'])
        ->name('admin.events.finance.commissions');
    Route::post('admin/events/finance/commissions', [EventFinanceController::class, 'storeCommission'])
        ->name('admin.events.finance.commissions.store');
    Route::get('admin/events/finance/settlements', [EventFinanceController::class, 'settlements'])
        ->name('admin.events.finance.settlements');
    Route::post('admin/events/finance/settlements', [EventFinanceController::class, 'createSettlement'])
        ->name('admin.events.finance.settlements.create');
    Route::get('admin/events/finance/reports', [EventFinanceController::class, 'reports'])
        ->name('admin.events.finance.reports');

    Route::get('admin/events/system/audit-logs', [EventAuditController::class, 'index'])
        ->name('admin.events.audit.index');
    Route::get('admin/events/system/settings', [EventSettingController::class, 'index'])
        ->name('admin.events.settings.index');
    Route::post('admin/events/system/settings', [EventSettingController::class, 'update'])
        ->name('admin.events.settings.update');
    Route::get('admin/events/{event}', [EventController::class, 'show'])
        ->whereNumber('event')
        ->name('admin.events.show');
    Route::get('admin/events/{event}/edit', [EventController::class, 'edit'])
        ->whereNumber('event')
        ->name('admin.events.edit');
    Route::put('admin/events/{event}', [EventController::class, 'update'])
        ->whereNumber('event')
        ->name('admin.events.update');
    Route::delete('admin/events/{event}', [EventController::class, 'destroy'])
        ->whereNumber('event')
        ->name('admin.events.destroy');
    Route::post('admin/events/{event}/status', [EventController::class, 'updateStatus'])
        ->whereNumber('event')
        ->name('admin.events.status');
    Route::post('admin/events/{event}/capacity', [EventController::class, 'updateCapacity'])
        ->whereNumber('event')
        ->name('admin.events.capacity');

    Route::get('admin/academy/classes', [ClassController::class, 'index'])
        ->name('admin.academy.classes.index');
    Route::post('admin/academy/classes', [ClassController::class, 'store'])
        ->name('admin.academy.classes.store');
    Route::get('admin/academy/classes/{class}', [ClassController::class, 'show'])
        ->name('admin.academy.classes.show');
    Route::put('admin/academy/classes/{class}', [ClassController::class, 'update'])
        ->name('admin.academy.classes.update');
    Route::delete('admin/academy/classes/{class}', [ClassController::class, 'destroy'])
        ->name('admin.academy.classes.destroy');
    Route::delete('admin/academy/classes/{class}/images/{image}', [ClassController::class, 'destroyImage'])
        ->name('admin.academy.classes.images.destroy');

    Route::get('admin/academy/tickets', [TicketController::class, 'index'])
        ->name('admin.academy.tickets.index');
    Route::post('admin/academy/tickets', [TicketController::class, 'store'])
        ->name('admin.academy.tickets.store');
    Route::put('admin/academy/tickets/{ticket}', [TicketController::class, 'update'])
        ->name('admin.academy.tickets.update');
    Route::delete('admin/academy/tickets/{ticket}', [TicketController::class, 'destroy'])
        ->name('admin.academy.tickets.destroy');

    Route::get('admin/academy/bookings', [App\Http\Controllers\Admin\Academy\BookingController::class, 'index'])
        ->name('admin.academy.bookings.index');
    Route::get('admin/academy/bookings/{booking}', [App\Http\Controllers\Admin\Academy\BookingController::class, 'show'])
        ->name('admin.academy.bookings.show');

    Route::get('admin/academy/attendees', [AttendeeController::class, 'index'])
        ->name('admin.academy.attendees.index');

    Route::get('admin/academy/scans', [ScanController::class, 'index'])
        ->name('admin.academy.scans.index');
    Route::post('admin/academy/scans', [ScanController::class, 'store'])
        ->name('admin.academy.scans.store');

    Route::get('admin/academy/finance', [FinanceController::class, 'index'])
        ->name('admin.academy.finance.index');
    Route::post('admin/academy/bookings/{booking}/refund', [FinanceController::class, 'refund'])
        ->name('admin.academy.bookings.refund');

    Route::get('admin/academy/reports', [ReportController::class, 'index'])
        ->name('admin.academy.reports.index');

    Route::get('admin/academy/system/audit', [AuditController::class, 'index'])
        ->name('admin.academy.audit.index');
    Route::get('admin/academy/system/settings', [SettingController::class, 'index'])
        ->name('admin.academy.settings.index');
    Route::post('admin/academy/system/settings', [SettingController::class, 'update'])
        ->name('admin.academy.settings.update');
    Route::get('admin/mitra', [MitraController::class, 'index'])
        ->name('admin.mitra.index');
    Route::post('admin/mitra', [MitraController::class, 'store'])
        ->name('admin.mitra.store');
    Route::put('admin/mitra/{user}', [MitraController::class, 'update'])
        ->name('admin.mitra.update');
    Route::get('admin/mitra/{user}', [MitraController::class, 'show'])
        ->name('admin.mitra.show');
    Route::delete('admin/mitra/{user}', [MitraController::class, 'destroy'])
        ->name('admin.mitra.destroy');
    Route::post('admin/mitra/{user}/verify', [MitraController::class, 'verify'])
        ->name('admin.mitra.verify');
    Route::post('admin/mitra/{user}/payout', [MitraController::class, 'payout'])
        ->name('admin.mitra.payout');
    Route::post('admin/mitra/{user}/suspend', [MitraController::class, 'suspend'])
        ->name('admin.mitra.suspend');
    Route::get('admin/mitra-documents', [PartnerTermsDocumentController::class, 'index'])
        ->name('admin.mitra-documents.index');
    Route::post('admin/mitra-documents', [PartnerTermsDocumentController::class, 'store'])
        ->name('admin.mitra-documents.store');
    Route::get('admin/users', [UserController::class, 'index'])
        ->name('admin.users.index');
    Route::post('admin/users', [UserController::class, 'store'])
        ->name('admin.users.store');
    Route::get('admin/users/{user}', [UserController::class, 'show'])
        ->name('admin.users.show');
    Route::put('admin/users/{user}', [UserController::class, 'update'])
        ->name('admin.users.update');
    Route::post('admin/users/{user}/suspend', [UserController::class, 'suspend'])
        ->name('admin.users.suspend');
    Route::delete('admin/users/{user}', [UserController::class, 'destroy'])
        ->name('admin.users.destroy');
    Route::get('admin/mitra-wisata', [MitraWisataController::class, 'index'])
        ->name('admin.mitra-wisata.index');
    Route::post('admin/mitra-wisata', [MitraWisataController::class, 'store'])
        ->name('admin.mitra-wisata.store');
    Route::get('admin/mitra-wisata/{user}', [MitraWisataController::class, 'show'])
        ->name('admin.mitra-wisata.show');
    Route::delete('admin/mitra-wisata/{user}', [MitraWisataController::class, 'destroy'])
        ->name('admin.mitra-wisata.destroy');
    Route::post('admin/mitra-wisata/{user}/verify', [MitraWisataController::class, 'verify'])
        ->name('admin.mitra-wisata.verify');
    Route::post('admin/mitra-wisata/{user}/payout', [MitraWisataController::class, 'payout'])
        ->name('admin.mitra-wisata.payout');
    Route::post('admin/mitra-wisata/{user}/suspend', [MitraWisataController::class, 'suspend'])
        ->name('admin.mitra-wisata.suspend');

    Route::get('admin/wisata/destinations', [WisataDestinationController::class, 'index'])
        ->name('admin.wisata.destinations.index');
    Route::get('admin/wisata/destinations/create', [WisataDestinationController::class, 'create'])
        ->name('admin.wisata.destinations.create');
    Route::post('admin/wisata/destinations', [WisataDestinationController::class, 'store'])
        ->name('admin.wisata.destinations.store');
    Route::get('admin/wisata/destinations/{destination}', [WisataDestinationController::class, 'show'])
        ->name('admin.wisata.destinations.show');
    Route::put('admin/wisata/destinations/{destination}', [WisataDestinationController::class, 'update'])
        ->name('admin.wisata.destinations.update');
    Route::delete('admin/wisata/destinations/{destination}', [WisataDestinationController::class, 'destroy'])
        ->name('admin.wisata.destinations.destroy');
    Route::post('admin/wisata/destinations/{destination}/suspend', [WisataDestinationController::class, 'suspend'])
        ->name('admin.wisata.destinations.suspend');

    Route::get('admin/wisata/tickets', [WisataTicketController::class, 'index'])
        ->name('admin.wisata.tickets.index');
    Route::get('admin/wisata/tickets/create', [WisataTicketController::class, 'create'])
        ->name('admin.wisata.tickets.create');
    Route::post('admin/wisata/tickets', [WisataTicketController::class, 'store'])
        ->name('admin.wisata.tickets.store');
    Route::put('admin/wisata/tickets/{ticket}', [WisataTicketController::class, 'update'])
        ->name('admin.wisata.tickets.update');
    Route::delete('admin/wisata/tickets/{ticket}', [WisataTicketController::class, 'destroy'])
        ->name('admin.wisata.tickets.destroy');

    Route::get('admin/wisata/bookings', [App\Http\Controllers\Admin\WisataBookingController::class, 'index'])
        ->name('admin.wisata.bookings.index');
    Route::get('admin/wisata/bookings/{booking}', [App\Http\Controllers\Admin\WisataBookingController::class, 'show'])
        ->name('admin.wisata.bookings.show');

    Route::get('admin/wisata/scans', [WisataScanController::class, 'index'])
        ->name('admin.wisata.scans.index');

    Route::get('admin/wisata/exceptions', [WisataExceptionController::class, 'index'])
        ->name('admin.wisata.exceptions.index');
    Route::post('admin/wisata/bookings/{booking}/cancel', [WisataExceptionController::class, 'cancel'])
        ->name('admin.wisata.bookings.cancel');
    Route::post('admin/wisata/bookings/{booking}/refund', [WisataExceptionController::class, 'refund'])
        ->name('admin.wisata.bookings.refund');
    Route::post('admin/wisata/disputes/{dispute}', [WisataExceptionController::class, 'resolveDispute'])
        ->name('admin.wisata.disputes.update');

    Route::get('admin/wisata/finance/commissions', [WisataFinanceController::class, 'commissions'])
        ->name('admin.wisata.finance.commissions');
    Route::post('admin/wisata/finance/commissions', [WisataFinanceController::class, 'storeCommission'])
        ->name('admin.wisata.finance.commissions.store');
    Route::get('admin/wisata/finance/payouts', [WisataFinanceController::class, 'payouts'])
        ->name('admin.wisata.finance.payouts');
    Route::post('admin/wisata/finance/payouts', [WisataFinanceController::class, 'generatePayout'])
        ->name('admin.wisata.finance.payouts.create');
    Route::post('admin/wisata/finance/payouts/{payout}', [WisataFinanceController::class, 'updatePayout'])
        ->name('admin.wisata.finance.payouts.update');
    Route::get('admin/wisata/finance/reports', [WisataFinanceController::class, 'reports'])
        ->name('admin.wisata.finance.reports');

    Route::get('admin/wisata/content', [WisataContentController::class, 'index'])
        ->name('admin.wisata.content.index');
    Route::post('admin/wisata/content/{destination}', [WisataContentController::class, 'hideContent'])
        ->name('admin.wisata.content.update');
    Route::post('admin/wisata/reviews/{review}', [WisataContentController::class, 'updateReview'])
        ->name('admin.wisata.reviews.update');

    Route::get('admin/wisata/affiliates', [AffiliateController::class, 'index'])
        ->name('admin.wisata.affiliates.index');
    Route::post('admin/wisata/affiliates', [AffiliateController::class, 'store'])
        ->name('admin.wisata.affiliates.store');
    Route::get('admin/wisata/affiliates/commissions', [App\Http\Controllers\Admin\WisataAffiliate\CommissionController::class, 'index'])
        ->name('admin.wisata.affiliates.commissions.index');
    Route::post('admin/wisata/affiliates/commissions', [App\Http\Controllers\Admin\WisataAffiliate\CommissionController::class, 'store'])
        ->name('admin.wisata.affiliates.commissions.store');

    Route::get('admin/wisata/affiliates/links', [App\Http\Controllers\Admin\WisataAffiliate\LinkController::class, 'index'])
        ->name('admin.wisata.affiliates.links.index');
    Route::post('admin/wisata/affiliates/links', [App\Http\Controllers\Admin\WisataAffiliate\LinkController::class, 'store'])
        ->name('admin.wisata.affiliates.links.store');
    Route::post('admin/wisata/affiliates/links/{link}/status', [App\Http\Controllers\Admin\WisataAffiliate\LinkController::class, 'updateStatus'])
        ->name('admin.wisata.affiliates.links.status');
    Route::post('admin/wisata/affiliates/links/{link}/regenerate', [App\Http\Controllers\Admin\WisataAffiliate\LinkController::class, 'regenerateToken'])
        ->name('admin.wisata.affiliates.links.regenerate');

    Route::get('admin/wisata/affiliates/performance', [PerformanceController::class, 'index'])
        ->name('admin.wisata.affiliates.performance.index');
    Route::get('admin/wisata/affiliates/commission-items', [CommissionLogController::class, 'index'])
        ->name('admin.wisata.affiliates.commission-items.index');
    Route::get('admin/wisata/affiliates/payouts', [App\Http\Controllers\Admin\WisataAffiliate\PayoutController::class, 'index'])
        ->name('admin.wisata.affiliates.payouts.index');
    Route::post('admin/wisata/affiliates/payouts', [App\Http\Controllers\Admin\WisataAffiliate\PayoutController::class, 'store'])
        ->name('admin.wisata.affiliates.payouts.store');
    Route::post('admin/wisata/affiliates/payouts/{payout}/status', [App\Http\Controllers\Admin\WisataAffiliate\PayoutController::class, 'updateStatus'])
        ->name('admin.wisata.affiliates.payouts.status');

    Route::get('admin/wisata/affiliates/campaigns', [CampaignController::class, 'index'])
        ->name('admin.wisata.affiliates.campaigns.index');
    Route::post('admin/wisata/affiliates/campaigns', [CampaignController::class, 'store'])
        ->name('admin.wisata.affiliates.campaigns.store');
    Route::post('admin/wisata/affiliates/campaigns/{campaign}/status', [CampaignController::class, 'updateStatus'])
        ->name('admin.wisata.affiliates.campaigns.status');

    Route::get('admin/wisata/affiliates/exceptions', [ExceptionController::class, 'index'])
        ->name('admin.wisata.affiliates.exceptions.index');
    Route::post('admin/wisata/affiliates/exceptions', [ExceptionController::class, 'store'])
        ->name('admin.wisata.affiliates.exceptions.store');

    Route::get('admin/wisata/affiliates/system/audit', [App\Http\Controllers\Admin\WisataAffiliate\AuditController::class, 'index'])
        ->name('admin.wisata.affiliates.audit.index');
    Route::get('admin/wisata/affiliates/system/settings', [App\Http\Controllers\Admin\WisataAffiliate\SettingController::class, 'index'])
        ->name('admin.wisata.affiliates.settings.index');
    Route::post('admin/wisata/affiliates/system/settings', [App\Http\Controllers\Admin\WisataAffiliate\SettingController::class, 'update'])
        ->name('admin.wisata.affiliates.settings.update');

    Route::get('admin/wisata/affiliates/{affiliate}', [AffiliateController::class, 'show'])
        ->name('admin.wisata.affiliates.show');
    Route::put('admin/wisata/affiliates/{affiliate}', [AffiliateController::class, 'update'])
        ->name('admin.wisata.affiliates.update');
    Route::post('admin/wisata/affiliates/{affiliate}/status', [AffiliateController::class, 'updateStatus'])
        ->name('admin.wisata.affiliates.status');

    Route::get('admin/bookings', [App\Http\Controllers\Admin\BookingController::class, 'index'])
        ->name('admin.bookings.index');
    Route::get('admin/hotel/exceptions', [App\Http\Controllers\Admin\BookingController::class, 'exceptions'])
        ->name('admin.hotel.exceptions.index');
    Route::get('admin/bookings/{booking}', [App\Http\Controllers\Admin\BookingController::class, 'show'])
        ->name('admin.bookings.show');
    Route::post('admin/bookings/{booking}/cancel', [App\Http\Controllers\Admin\BookingController::class, 'cancel'])
        ->name('admin.bookings.cancel');
    Route::post('admin/bookings/{booking}/refund', [App\Http\Controllers\Admin\BookingController::class, 'refund'])
        ->name('admin.bookings.refund');
    Route::post('admin/bookings/{booking}/dispute', [App\Http\Controllers\Admin\BookingController::class, 'dispute'])
        ->name('admin.bookings.dispute');

    Route::get('admin/finance/commissions', [CommissionRuleController::class, 'index'])
        ->name('admin.finance.commissions.index');
    Route::post('admin/finance/commissions', [CommissionRuleController::class, 'store'])
        ->name('admin.finance.commissions.store');
    Route::put('admin/finance/commissions/{commissionRule}', [CommissionRuleController::class, 'update'])
        ->name('admin.finance.commissions.update');
    Route::delete('admin/finance/commissions/{commissionRule}', [CommissionRuleController::class, 'destroy'])
        ->name('admin.finance.commissions.destroy');

    Route::get('admin/finance/payouts', [PayoutController::class, 'index'])
        ->name('admin.payouts.index');
    Route::get('admin/finance/payouts/create', [PayoutController::class, 'create'])
        ->name('admin.payouts.create');
    Route::post('admin/finance/payouts', [PayoutController::class, 'store'])
        ->name('admin.payouts.store');
    Route::post('admin/finance/payouts/{payout}/approve', [PayoutController::class, 'approve'])
        ->name('admin.payouts.approve');
    Route::post('admin/finance/payouts/{payout}/transfer', [PayoutController::class, 'transfer'])
        ->name('admin.payouts.transfer');

    Route::get('admin/finance/reports', [FinanceReportController::class, 'index'])
        ->name('admin.finance.reports.index');

    Route::get('admin/marketing/vouchers', [VoucherController::class, 'index'])
        ->name('admin.vouchers.index');
    Route::post('admin/marketing/vouchers', [VoucherController::class, 'store'])
        ->name('admin.vouchers.store');
    Route::put('admin/marketing/vouchers/{voucher}', [VoucherController::class, 'update'])
        ->name('admin.vouchers.update');
    Route::delete('admin/marketing/vouchers/{voucher}', [VoucherController::class, 'destroy'])
        ->name('admin.vouchers.destroy');

    Route::get('admin/system/audit-logs', [AdminAuditLogController::class, 'index'])
        ->name('admin.audit-logs.index');
    Route::get('admin/system/settings', [SystemSettingController::class, 'index'])
        ->name('admin.system.settings.index');
    Route::post('admin/system/settings', [SystemSettingController::class, 'update'])
        ->name('admin.system.settings.update');
    Route::post('admin/system/reset', [SystemSettingController::class, 'reset'])
        ->name('admin.system.reset');
    Route::get('admin/system/notifications', [NotificationControlController::class, 'index'])
        ->name('admin.system.notifications.index');
    Route::post('admin/system/notifications/templates', [NotificationControlController::class, 'storeTemplate'])
        ->name('admin.system.notifications.templates.store');
    Route::put('admin/system/notifications/templates/{template}', [NotificationControlController::class, 'updateTemplate'])
        ->name('admin.system.notifications.templates.update');
    Route::delete('admin/system/notifications/templates/{template}', [NotificationControlController::class, 'destroyTemplate'])
        ->name('admin.system.notifications.templates.destroy');
    Route::put('admin/system/notifications/triggers/{trigger}', [NotificationControlController::class, 'updateTrigger'])
        ->name('admin.system.notifications.triggers.update');
    Route::post('admin/system/notifications/broadcast', [NotificationControlController::class, 'broadcast'])
        ->name('admin.system.notifications.broadcast');
    Route::get('admin/system/roles', [RoleManagementController::class, 'index'])
        ->name('admin.system.roles.index');
    Route::post('admin/system/roles', [RoleManagementController::class, 'store'])
        ->name('admin.system.roles.store');
    Route::put('admin/system/roles/{role}', [RoleManagementController::class, 'update'])
        ->name('admin.system.roles.update');
    Route::delete('admin/system/roles/{role}', [RoleManagementController::class, 'destroy'])
        ->name('admin.system.roles.destroy');
    Route::put('admin/system/roles/users/{user}', [RoleManagementController::class, 'assign'])
        ->name('admin.system.roles.users.assign');
    Route::get('admin/system/special-admins', [SpecialAdminController::class, 'index'])
        ->name('admin.system.special-admins.index');
    Route::post('admin/system/special-admins', [SpecialAdminController::class, 'store'])
        ->name('admin.system.special-admins.store');
    Route::put('admin/system/special-admins/{user}', [SpecialAdminController::class, 'update'])
        ->name('admin.system.special-admins.update');
    Route::delete('admin/system/special-admins/{user}', [SpecialAdminController::class, 'destroy'])
        ->name('admin.system.special-admins.destroy');

    Route::get('admin/public/banners', [PublicBannerController::class, 'index'])
        ->name('admin.public.banners.index');
    Route::get('admin/public/banners/create', [PublicBannerController::class, 'create'])
        ->name('admin.public.banners.create');
    Route::post('admin/public/banners', [PublicBannerController::class, 'store'])
        ->name('admin.public.banners.store');
    Route::get('admin/public/banners/{banner}/edit', [PublicBannerController::class, 'edit'])
        ->name('admin.public.banners.edit');
    Route::put('admin/public/banners/{banner}', [PublicBannerController::class, 'update'])
        ->name('admin.public.banners.update');
    Route::delete('admin/public/banners/{banner}', [PublicBannerController::class, 'destroy'])
        ->name('admin.public.banners.destroy');

    Route::get('admin/public/home', [HomeContentController::class, 'edit'])
        ->name('admin.public.home.edit');
    Route::put('admin/public/home', [HomeContentController::class, 'update'])
        ->name('admin.public.home.update');

    Route::get('admin/public/promo-items', [PromoItemController::class, 'index'])
        ->name('admin.public.promo-items.index');
    Route::get('admin/public/promo-items/create', [PromoItemController::class, 'create'])
        ->name('admin.public.promo-items.create');
    Route::post('admin/public/promo-items', [PromoItemController::class, 'store'])
        ->name('admin.public.promo-items.store');
    Route::get('admin/public/promo-items/{promoItem}/edit', [PromoItemController::class, 'edit'])
        ->name('admin.public.promo-items.edit');
    Route::put('admin/public/promo-items/{promoItem}', [PromoItemController::class, 'update'])
        ->name('admin.public.promo-items.update');
    Route::delete('admin/public/promo-items/{promoItem}', [PromoItemController::class, 'destroy'])
        ->name('admin.public.promo-items.destroy');
    Route::get('admin/public/faqs', [FaqController::class, 'index'])
        ->name('admin.public.faqs.index');
    Route::get('admin/public/faqs/create', [FaqController::class, 'create'])
        ->name('admin.public.faqs.create');
    Route::post('admin/public/faqs', [FaqController::class, 'store'])
        ->name('admin.public.faqs.store');
    Route::get('admin/public/faqs/{faq}/edit', [FaqController::class, 'edit'])
        ->name('admin.public.faqs.edit');
    Route::put('admin/public/faqs/{faq}', [FaqController::class, 'update'])
        ->name('admin.public.faqs.update');
    Route::delete('admin/public/faqs/{faq}', [FaqController::class, 'destroy'])
        ->name('admin.public.faqs.destroy');

    Route::get('admin/public/privacy-policy', [PrivacyPolicyController::class, 'edit'])
        ->name('admin.public.privacy-policy.edit');
    Route::put('admin/public/privacy-policy', [PrivacyPolicyController::class, 'update'])
        ->name('admin.public.privacy-policy.update');
    Route::get('admin/public/about', [AboutPageController::class, 'edit'])
        ->name('admin.public.about.edit');
    Route::put('admin/public/about', [AboutPageController::class, 'update'])
        ->name('admin.public.about.update');

    Route::get('admin/public/contacts', [PublicContactController::class, 'edit'])
        ->name('admin.public.contacts.edit');
    Route::put('admin/public/contacts', [PublicContactController::class, 'update'])
        ->name('admin.public.contacts.update');
});

Route::get('mitra/dashboard', [App\Http\Controllers\Mitra\DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'mitra', 'user.activity'])
    ->name('mitra.dashboard');

Route::middleware(['auth', 'verified', 'mitra', 'user.activity'])->group(function () {
    Route::get('mitra/chat', [App\Http\Controllers\Mitra\ChatController::class, 'index'])
        ->name('mitra.chat.index');
    Route::get('mitra/chat/{conversation}', [App\Http\Controllers\Mitra\ChatController::class, 'show'])
        ->name('mitra.chat.show');
    Route::post('mitra/chat/{conversation}/messages', [App\Http\Controllers\Mitra\ChatController::class, 'store'])
        ->name('mitra.chat.messages.store');

    Route::post('mitra/onboarding/type', [MitraOnboardingController::class, 'selectType'])
        ->name('mitra.onboarding.type');
    Route::get('mitra/onboarding', [MitraOnboardingController::class, 'show'])
        ->name('mitra.onboarding');
    Route::match(['patch', 'post'], 'mitra/onboarding/step-1', [MitraOnboardingController::class, 'updateStepOne'])
        ->name('mitra.onboarding.step1');
    Route::match(['patch', 'post'], 'mitra/onboarding/step-2', [MitraOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.onboarding.step2');
    Route::match(['patch', 'post'], 'mitra/onboarding/step-3', [MitraOnboardingController::class, 'updateStepThree'])
        ->name('mitra.onboarding.step3');
    Route::post('mitra/onboarding/submit-verification', [MitraOnboardingController::class, 'submitVerification'])
        ->name('mitra.onboarding.submitVerification');
    Route::post('mitra/onboarding/submit-payout', [MitraOnboardingController::class, 'submitPayout'])
        ->name('mitra.onboarding.submitPayout');

    Route::get('mitra/wisata/onboarding', [MitraWisataOnboardingController::class, 'show'])
        ->name('mitra.wisata.onboarding');
    Route::match(['patch', 'post'], 'mitra/wisata/onboarding/step-1', [MitraWisataOnboardingController::class, 'updateStepOne'])
        ->name('mitra.wisata.onboarding.step1');
    Route::match(['patch', 'post'], 'mitra/wisata/onboarding/step-2', [MitraWisataOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.wisata.onboarding.step2');
    Route::match(['patch', 'post'], 'mitra/wisata/onboarding/step-3', [MitraWisataOnboardingController::class, 'updateStepThree'])
        ->name('mitra.wisata.onboarding.step3');
    Route::post('mitra/wisata/onboarding/submit-verification', [MitraWisataOnboardingController::class, 'submitVerification'])
        ->name('mitra.wisata.onboarding.submitVerification');
    Route::post('mitra/wisata/onboarding/submit-payout', [MitraWisataOnboardingController::class, 'submitPayout'])
        ->name('mitra.wisata.onboarding.submitPayout');

    Route::get('mitra/event/onboarding', [MitraEventOnboardingController::class, 'show'])
        ->name('mitra.event.onboarding');
    Route::match(['patch', 'post'], 'mitra/event/onboarding/step-1', [MitraEventOnboardingController::class, 'updateStepOne'])
        ->name('mitra.event.onboarding.step1');
    Route::match(['patch', 'post'], 'mitra/event/onboarding/step-2', [MitraEventOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.event.onboarding.step2');
    Route::match(['patch', 'post'], 'mitra/event/onboarding/step-3', [MitraEventOnboardingController::class, 'updateStepThree'])
        ->name('mitra.event.onboarding.step3');
    Route::match(['patch', 'post'], 'mitra/event/onboarding/step-4', [MitraEventOnboardingController::class, 'updateStepFour'])
        ->name('mitra.event.onboarding.step4');
    Route::post('mitra/event/onboarding/submit-verification', [MitraEventOnboardingController::class, 'submitVerification'])
        ->name('mitra.event.onboarding.submitVerification');
    Route::post('mitra/terms/sign', [PartnerTermsSignatureController::class, 'store'])
        ->name('mitra.terms.sign');
});

Route::prefix('mitra')
    ->name('mitra.')
    ->middleware(['auth', 'verified', 'mitra', 'mitra.hotel', 'user.activity'])
    ->group(function () {
        Route::resource('hotels', App\Http\Controllers\Mitra\HotelController::class)->except(['show']);
        Route::delete('hotels/{hotel}/images/{hotelImage}', [App\Http\Controllers\Mitra\HotelController::class, 'destroyImage'])
            ->name('hotels.images.destroy');
        Route::resource('room-types', App\Http\Controllers\Mitra\RoomTypeController::class);
        Route::delete('room-types/{roomType}/images/{roomImage}', [App\Http\Controllers\Mitra\RoomTypeController::class, 'destroyImage'])
            ->name('room-types.images.destroy');
        Route::delete('room-inventories/bulk', [App\Http\Controllers\Mitra\RoomInventoryController::class, 'bulkDestroy'])
            ->name('room-inventories.bulk-destroy');
        Route::resource('room-inventories', App\Http\Controllers\Mitra\RoomInventoryController::class)->except(['show']);
        Route::get('bookings', [App\Http\Controllers\Mitra\BookingController::class, 'index'])
            ->name('bookings.index');
        Route::get('bookings/{booking}', [App\Http\Controllers\Mitra\BookingController::class, 'show'])
            ->name('bookings.show');
        Route::post('bookings/{booking}/cancel', [App\Http\Controllers\Mitra\BookingController::class, 'cancel'])
            ->name('bookings.cancel');
        Route::post('bookings/{booking}/stay-status', [App\Http\Controllers\Mitra\BookingController::class, 'updateStayStatus'])
            ->name('bookings.stay-status');
        Route::patch('bookings/{booking}/notes', [App\Http\Controllers\Mitra\BookingController::class, 'updateNotes'])
            ->name('bookings.notes');
        Route::post('bookings/{booking}/refund', [App\Http\Controllers\Mitra\BookingController::class, 'refund'])
            ->name('bookings.refund');
        Route::post('bookings/{booking}/dispute', [App\Http\Controllers\Mitra\BookingController::class, 'dispute'])
            ->name('bookings.dispute');
        Route::get('occupancy', [OccupancyController::class, 'index'])
            ->name('occupancy.index');
        Route::get('finance/summary', [FinanceSummaryController::class, 'index'])
            ->name('finance.summary');
        Route::get('finance/payouts', [App\Http\Controllers\Mitra\PayoutController::class, 'index'])
            ->name('finance.payouts');
        Route::get('finance/bank', [BankAccountController::class, 'edit'])
            ->name('finance.bank.edit');
        Route::patch('finance/bank', [BankAccountController::class, 'update'])
            ->name('finance.bank.update');
        Route::get('reviews', [ReviewController::class, 'index'])
            ->defaults('type', 'hotel')
            ->name('reviews.index');
        Route::post('reviews/{review}/reply', [ReviewController::class, 'reply'])
            ->defaults('type', 'hotel')
            ->name('reviews.reply');
        Route::delete('reviews/{review}', [ReviewController::class, 'destroy'])
            ->defaults('type', 'hotel')
            ->name('reviews.destroy');
    });

Route::prefix('mitra/wisata')
    ->name('mitra.wisata.')
    ->middleware(['auth', 'verified', 'mitra', 'mitra.wisata', 'user.activity'])
    ->group(function () {
        Route::get('destination', [DestinationController::class, 'edit'])
            ->name('destination.edit');
        Route::put('destination', [DestinationController::class, 'update'])
            ->name('destination.update');

        Route::get('tickets', [App\Http\Controllers\Mitra\Wisata\TicketController::class, 'index'])
            ->name('tickets.index');
        Route::get('tickets/create', [App\Http\Controllers\Mitra\Wisata\TicketController::class, 'create'])
            ->name('tickets.create');
        Route::post('tickets', [App\Http\Controllers\Mitra\Wisata\TicketController::class, 'store'])
            ->name('tickets.store');
        Route::put('tickets/{ticket}', [App\Http\Controllers\Mitra\Wisata\TicketController::class, 'update'])
            ->name('tickets.update');
        Route::delete('tickets/{ticket}', [App\Http\Controllers\Mitra\Wisata\TicketController::class, 'destroy'])
            ->name('tickets.destroy');

        Route::get('bookings', [App\Http\Controllers\Mitra\Wisata\BookingController::class, 'index'])
            ->name('bookings.index');
        Route::get('bookings/{booking}', [App\Http\Controllers\Mitra\Wisata\BookingController::class, 'show'])
            ->name('bookings.show');

        Route::get('scans', [App\Http\Controllers\Mitra\Wisata\ScanController::class, 'index'])
            ->name('scans.index');
        Route::post('scans', [App\Http\Controllers\Mitra\Wisata\ScanController::class, 'store'])
            ->name('scans.store');

        Route::get('finance/summary', [App\Http\Controllers\Mitra\Wisata\FinanceController::class, 'summary'])
            ->name('finance.summary');
        Route::get('finance/payouts', [App\Http\Controllers\Mitra\Wisata\FinanceController::class, 'payouts'])
            ->name('finance.payouts');

        Route::get('notifications', [App\Http\Controllers\Mitra\Wisata\NotificationController::class, 'index'])
            ->name('notifications.index');
        Route::get('reviews', [ReviewController::class, 'index'])
            ->defaults('type', 'wisata')
            ->name('reviews.index');
        Route::post('reviews/{review}/reply', [ReviewController::class, 'reply'])
            ->defaults('type', 'wisata')
            ->name('reviews.reply');
        Route::delete('reviews/{review}', [ReviewController::class, 'destroy'])
            ->defaults('type', 'wisata')
            ->name('reviews.destroy');

        Route::get('disputes', [DisputeController::class, 'index'])
            ->name('disputes.index');
        Route::post('disputes', [DisputeController::class, 'store'])
            ->name('disputes.store');
    });

Route::prefix('mitra/events')
    ->name('mitra.events.')
    ->middleware(['auth', 'verified', 'mitra', 'mitra.event', 'user.activity'])
    ->group(function () {
        Route::get('/', [App\Http\Controllers\Mitra\Event\EventController::class, 'index'])
            ->name('index');
        Route::get('create', [App\Http\Controllers\Mitra\Event\EventController::class, 'create'])
            ->name('create');
        Route::post('/', [App\Http\Controllers\Mitra\Event\EventController::class, 'store'])
            ->name('store');

        Route::get('tickets', [App\Http\Controllers\Mitra\Event\TicketController::class, 'index'])
            ->name('tickets.index');
        Route::get('tickets/create', [App\Http\Controllers\Mitra\Event\TicketController::class, 'create'])
            ->name('tickets.create');
        Route::post('tickets', [App\Http\Controllers\Mitra\Event\TicketController::class, 'store'])
            ->name('tickets.store');
        Route::put('tickets/{ticket}', [App\Http\Controllers\Mitra\Event\TicketController::class, 'update'])
            ->name('tickets.update');
        Route::delete('tickets/{ticket}', [App\Http\Controllers\Mitra\Event\TicketController::class, 'destroy'])
            ->name('tickets.destroy');

        Route::get('bookings', [App\Http\Controllers\Mitra\Event\BookingController::class, 'index'])
            ->name('bookings.index');
        Route::get('bookings/{booking}', [App\Http\Controllers\Mitra\Event\BookingController::class, 'show'])
            ->name('bookings.show');

        Route::get('attendees', [App\Http\Controllers\Mitra\Event\AttendeeController::class, 'index'])
            ->name('attendees.index');

        Route::get('scans', [App\Http\Controllers\Mitra\Event\ScanController::class, 'index'])
            ->name('scans.index');
        Route::post('scans', [App\Http\Controllers\Mitra\Event\ScanController::class, 'store'])
            ->name('scans.store');

        Route::get('finance/summary', [App\Http\Controllers\Mitra\Event\FinanceController::class, 'summary'])
            ->name('finance.summary');
        Route::get('finance/payouts', [App\Http\Controllers\Mitra\Event\FinanceController::class, 'payouts'])
            ->name('finance.payouts');

        Route::get('notifications', [App\Http\Controllers\Mitra\Event\NotificationController::class, 'index'])
            ->name('notifications.index');
        Route::get('reviews', [ReviewController::class, 'index'])
            ->defaults('type', 'event')
            ->name('reviews.index');
        Route::post('reviews/{review}/reply', [ReviewController::class, 'reply'])
            ->defaults('type', 'event')
            ->name('reviews.reply');
        Route::delete('reviews/{review}', [ReviewController::class, 'destroy'])
            ->defaults('type', 'event')
            ->name('reviews.destroy');

        Route::get('disputes', [App\Http\Controllers\Mitra\Event\DisputeController::class, 'index'])
            ->name('disputes.index');
        Route::post('disputes', [App\Http\Controllers\Mitra\Event\DisputeController::class, 'store'])
            ->name('disputes.store');

        Route::get('{event}', [App\Http\Controllers\Mitra\Event\EventController::class, 'show'])
            ->name('show');
        Route::get('{event}/edit', [App\Http\Controllers\Mitra\Event\EventController::class, 'edit'])
            ->name('edit');
        Route::put('{event}', [App\Http\Controllers\Mitra\Event\EventController::class, 'update'])
            ->name('update');
        Route::post('{event}/submit', [App\Http\Controllers\Mitra\Event\EventController::class, 'submit'])
            ->name('submit');
    });

Route::middleware(['auth', 'verified', 'admin', 'admin.log'])->group(function () {
    Route::resource('hotels', HotelController::class)->except(['show']);
    Route::resource('room-types', RoomTypeController::class);
    Route::delete('room-inventories/bulk', [RoomInventoryController::class, 'bulkDestroy'])
        ->name('room-inventories.bulk-destroy');
    Route::resource('room-inventories', RoomInventoryController::class)->except(['show']);
    Route::delete('room-types/{roomType}/images/{roomImage}', [RoomTypeController::class, 'destroyImage'])
        ->name('room-types.images.destroy');
    Route::delete('hotels/{hotel}/images/{hotelImage}', [HotelController::class, 'destroyImage'])
        ->name('hotels.images.destroy');
});

Route::get('reviews/public', [PublicReviewController::class, 'index'])
    ->name('reviews.public.index');

Route::middleware(['auth', 'verified', 'user.activity'])->group(function () {
    Route::post('reviews', [PublicReviewController::class, 'store'])
        ->name('reviews.store');
});

Route::middleware(['auth', 'user.activity'])->group(function () {
    Route::get('/email/otp', fn () => redirect()->route('verification.notice'))
        ->name('email-otp.notice');
    Route::post('/email/otp', fn () => redirect()->route('verification.notice'))
        ->name('email-otp.verify');
    Route::post('/email/otp/resend', function (Request $request) {
        if (! $request->user()?->hasVerifiedEmail()) {
            $request->user()?->sendEmailVerificationNotification();
        }

        return redirect()->route('verification.notice')->with('status', 'verification-link-sent');
    })
        ->name('email-otp.resend');
});

Route::get('/stay', [PublicHotelController::class, 'search'])
    ->name('public.hotels.search');
Route::get('/stay/hotels/{hotel}', [PublicHotelController::class, 'show'])
    ->name('public.hotels.show');
Route::get('/events', [PublicEventController::class, 'index'])
    ->name('events.search');
Route::get('/events/{event}', [PublicEventController::class, 'show'])
    ->name('events.show');
Route::get('/academy', [PublicAcademyController::class, 'index'])
    ->name('academy.search');
Route::get('/academy/{class}', [PublicAcademyController::class, 'show'])
    ->name('academy.show');
Route::get('/special-programs', [PublicSpecialProgramController::class, 'index'])
    ->name('special-programs.search');
Route::get('/special-programs/{program}', [PublicSpecialProgramController::class, 'show'])
    ->name('special-programs.show');
Route::get('/jelajah', [PublicBlogController::class, 'index'])
    ->name('public.blog.index');
Route::get('/jelajah/{slug}', [PublicBlogController::class, 'show'])
    ->name('public.blog.show');
Route::get('/faq', [PublicFaqController::class, 'index'])
    ->name('public.faq');
Route::get('/about', [PublicAboutController::class, 'show'])
    ->name('public.about');
Route::get('/privacy-policy', [PublicPrivacyPolicyController::class, 'show'])
    ->name('public.privacy-policy');
Route::get('/delete-account', [PublicDeleteAccountController::class, 'show'])
    ->name('public.delete-account');

Route::get('/retail-shop/cart', [SouvenirCartController::class, 'index'])
    ->name('souvenir.cart');
Route::post('/retail-shop/cart/add', [SouvenirCartController::class, 'add'])
    ->name('souvenir.cart.add');
Route::post('/retail-shop/cart/update', [SouvenirCartController::class, 'update'])
    ->name('souvenir.cart.update');
Route::post('/retail-shop/cart/remove', [SouvenirCartController::class, 'remove'])
    ->name('souvenir.cart.remove');
Route::post('/retail-shop/cart/clear', [SouvenirCartController::class, 'clear'])
    ->name('souvenir.cart.clear');
Route::get('/retail-shop', [PublicSouvenirController::class, 'index'])
    ->name('souvenir.search');

Route::middleware(['auth', 'verified', 'user', 'user.activity'])->group(function () {
    Route::get('/retail-shop/checkout', [SouvenirBookingController::class, 'review'])
        ->middleware('maintenance.transactions')
        ->name('souvenir.checkout.review');
    Route::post('/retail-shop/checkout/confirm', [SouvenirBookingController::class, 'confirm'])
        ->middleware('maintenance.transactions')
        ->name('souvenir.checkout.confirm');
    Route::get('/retail-shop/booking/{order}', [SouvenirBookingController::class, 'show'])
        ->name('souvenir.booking.show');
    Route::get('/retail-shop/booking/{order}/payment', [SouvenirBookingController::class, 'payment'])
        ->name('souvenir.booking.payment');
});
Route::get('/retail-shop/{product}', [PublicSouvenirController::class, 'show'])
    ->name('souvenir.show');
Route::redirect('/souvenir', '/retail-shop');
Route::redirect('/souvenir/cart', '/retail-shop/cart');
Route::redirect('/souvenir/checkout', '/retail-shop/checkout');
Route::redirect('/souvenir/booking/{order}', '/retail-shop/booking/{order}');
Route::redirect('/souvenir/booking/{order}/payment', '/retail-shop/booking/{order}/payment');
Route::redirect('/souvenir/{product}', '/retail-shop/{product}');
Route::get('/wisata', [PublicWisataController::class, 'index'])
    ->name('wisata.search');
Route::get('/wisata/{destination}', [PublicWisataController::class, 'show'])
    ->name('wisata.show');
Route::post('/events/booking/prepare', [EventPublicBookingController::class, 'prepare'])
    ->middleware('maintenance.transactions')
    ->name('events.booking.prepare');
Route::post('/academy/booking/prepare', [AcademyPublicBookingController::class, 'prepare'])
    ->middleware('maintenance.transactions')
    ->name('academy.booking.prepare');
Route::post('/special-programs/booking/prepare', [SpecialProgramBookingController::class, 'prepare'])
    ->middleware('maintenance.transactions')
    ->name('special-programs.booking.prepare');
Route::post('/wisata/booking/prepare', [WisataBookingController::class, 'prepare'])
    ->middleware('maintenance.transactions')
    ->name('wisata.booking.prepare');
Route::post('/booking/prepare', [BookingController::class, 'prepare'])
    ->middleware('maintenance.transactions')
    ->name('booking.prepare');

Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirect'])
    ->name('auth.google.redirect');
Route::get('/auth/google/callback', [SocialAuthController::class, 'callback'])
    ->name('auth.google.callback');

Route::post('/affiliate/referral/apply', [ReferralController::class, 'apply'])
    ->name('affiliate.referral.apply');
Route::post('/affiliate/referral/clear', [ReferralController::class, 'clear'])
    ->name('affiliate.referral.clear');

Route::middleware(['auth', 'verified', 'user', 'user.activity'])->prefix('affiliate')->name('affiliate.')->group(function () {
    Route::get('register', [RegisterController::class, 'create'])
        ->name('register');
    Route::post('register', [RegisterController::class, 'store'])
        ->name('register.store');
});

Route::middleware(['auth', 'verified', 'user', 'affiliate.user', 'user.activity'])->prefix('affiliate')->name('affiliate.')->group(function () {
    Route::get('/', [App\Http\Controllers\Affiliate\DashboardController::class, 'index'])
        ->name('dashboard');
    Route::get('profile', [ProfileController::class, 'show'])
        ->name('profile');
    Route::put('profile', [ProfileController::class, 'update'])
        ->name('profile.update');
    Route::get('catalog', [CatalogController::class, 'index'])
        ->name('catalog');
    Route::get('links', [LinkController::class, 'index'])
        ->name('links');
    Route::post('links', [LinkController::class, 'store'])
        ->name('links.store');
    Route::get('commissions', [CommissionController::class, 'index'])
        ->name('commissions');
    Route::get('payouts', [App\Http\Controllers\Affiliate\PayoutController::class, 'index'])
        ->name('payouts');
    Route::post('payouts', [App\Http\Controllers\Affiliate\PayoutController::class, 'store'])
        ->name('payouts.store');
    Route::get('notifications', [NotificationController::class, 'index'])
        ->name('notifications');
    Route::get('terms', [TermsController::class, 'index'])
        ->name('terms');
    Route::get('support', [SupportController::class, 'index'])
        ->name('support');
});
Route::middleware(['auth', 'verified', 'user', 'user.activity'])->group(function () {
    Route::get('/chat', [ChatController::class, 'index'])
        ->name('chat.index');
    Route::get('/chat/start/{type}/{id?}', [ChatController::class, 'start'])
        ->name('chat.start');
    Route::get('/chat/{conversation}', [ChatController::class, 'show'])
        ->name('chat.show');
    Route::post('/chat/{conversation}/messages', [ChatController::class, 'store'])
        ->name('chat.messages.store');

    Route::get('/notifications', [PublicNotificationController::class, 'index'])
        ->name('public.notifications');
    Route::post('/notifications/read-all', [PublicNotificationController::class, 'markAllRead'])
        ->name('public.notifications.readAll');
    Route::post('/notifications/{notification}/read', [PublicNotificationController::class, 'markRead'])
        ->name('public.notifications.read');
    Route::get('/history', [PublicHistoryController::class, 'index'])
        ->name('public.history');
    Route::get('/wisata/history', [PublicWisataHistoryController::class, 'index'])
        ->name('public.wisata.history');
    Route::get('/booking/review', [BookingController::class, 'review'])
        ->middleware('maintenance.transactions')
        ->name('booking.review');
    Route::post('/booking/confirm', [BookingController::class, 'confirm'])
        ->middleware('maintenance.transactions')
        ->name('booking.confirm');
    Route::post('/booking/voucher', [BookingController::class, 'applyVoucher'])
        ->middleware('maintenance.transactions')
        ->name('booking.voucher.apply');
    Route::post('/booking/voucher/remove', [BookingController::class, 'removeVoucher'])
        ->middleware('maintenance.transactions')
        ->name('booking.voucher.remove');
    Route::get('/booking/{booking}/payment', [BookingController::class, 'payment'])
        ->middleware('maintenance.transactions')
        ->name('booking.payment');
    Route::post('/booking/{booking}/payment', [BookingController::class, 'pay'])
        ->middleware('maintenance.transactions')
        ->name('booking.pay');
    Route::post('/booking/{booking}/cancel', [BookingController::class, 'cancel'])
        ->name('booking.cancel');
    Route::get('/booking/{booking}/invoice', [BookingController::class, 'invoice'])
        ->name('booking.invoice');
    Route::get('/booking/{booking}', [BookingController::class, 'show'])
        ->name('booking.show');

    Route::get('/events/booking/review', [EventPublicBookingController::class, 'review'])
        ->middleware('maintenance.transactions')
        ->name('events.booking.review');
    Route::post('/events/booking/confirm', [EventPublicBookingController::class, 'confirm'])
        ->middleware('maintenance.transactions')
        ->name('events.booking.confirm');
    Route::get('/events/booking/{booking}/payment', [EventPublicBookingController::class, 'payment'])
        ->middleware('maintenance.transactions')
        ->name('events.booking.payment');
    Route::post('/events/booking/{booking}/payment', [EventPublicBookingController::class, 'pay'])
        ->middleware('maintenance.transactions')
        ->name('events.booking.pay');
    Route::get('/events/booking/{booking}/ticket', [EventPublicBookingController::class, 'ticket'])
        ->name('events.booking.ticket');
    Route::get('/events/booking/{booking}', [EventPublicBookingController::class, 'show'])
        ->name('events.booking.show');

    Route::get('/academy/booking/review', [AcademyPublicBookingController::class, 'review'])
        ->middleware('maintenance.transactions')
        ->name('academy.booking.review');
    Route::post('/academy/booking/confirm', [AcademyPublicBookingController::class, 'confirm'])
        ->middleware('maintenance.transactions')
        ->name('academy.booking.confirm');
    Route::get('/academy/booking/{booking}/payment', [AcademyPublicBookingController::class, 'payment'])
        ->middleware('maintenance.transactions')
        ->name('academy.booking.payment');
    Route::get('/academy/booking/{booking}/ticket', [AcademyPublicBookingController::class, 'ticket'])
        ->name('academy.booking.ticket');
    Route::get('/academy/booking/{booking}', [AcademyPublicBookingController::class, 'show'])
        ->name('academy.booking.show');

    Route::get('/special-programs/booking/review', [SpecialProgramBookingController::class, 'review'])
        ->middleware('maintenance.transactions')
        ->name('special-programs.booking.review');
    Route::post('/special-programs/booking/confirm', [SpecialProgramBookingController::class, 'confirm'])
        ->middleware('maintenance.transactions')
        ->name('special-programs.booking.confirm');
    Route::get('/special-programs/booking/{booking}/payment', [SpecialProgramBookingController::class, 'payment'])
        ->middleware('maintenance.transactions')
        ->name('special-programs.booking.payment');
    Route::post('/special-programs/booking/{booking}/payment', [SpecialProgramBookingController::class, 'pay'])
        ->middleware('maintenance.transactions')
        ->name('special-programs.booking.pay');
    Route::get('/special-programs/booking/{booking}/ticket', [SpecialProgramBookingController::class, 'ticket'])
        ->name('special-programs.booking.ticket');
    Route::get('/special-programs/booking/{booking}', [SpecialProgramBookingController::class, 'show'])
        ->name('special-programs.booking.show');

    Route::get('/wisata/booking/review', [WisataBookingController::class, 'review'])
        ->middleware('maintenance.transactions')
        ->name('wisata.booking.review');
    Route::post('/wisata/booking/confirm', [WisataBookingController::class, 'confirm'])
        ->middleware('maintenance.transactions')
        ->name('wisata.booking.confirm');
    Route::get('/wisata/booking/{booking}/payment', [WisataBookingController::class, 'payment'])
        ->middleware('maintenance.transactions')
        ->name('wisata.booking.payment');
    Route::post('/wisata/booking/{booking}/payment', [WisataBookingController::class, 'pay'])
        ->middleware('maintenance.transactions')
        ->name('wisata.booking.pay');
    Route::get('/wisata/booking/{booking}/ticket', [WisataBookingController::class, 'ticket'])
        ->name('wisata.booking.ticket');
    Route::get('/wisata/booking/{booking}', [WisataBookingController::class, 'show'])
        ->name('wisata.booking.show');
});
Route::post('/payments/midtrans/callback', MidtransCallbackController::class)
    ->name('payments.midtrans.callback');

require __DIR__.'/settings.php';
