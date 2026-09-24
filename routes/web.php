<?php

use App\Http\Controllers\Admin\AboutPageController;
use App\Http\Controllers\Admin\AdminAuditLogController;
use App\Http\Controllers\Admin\BlogCategoryController;
use App\Http\Controllers\Admin\BlogPostController;
use App\Http\Controllers\Admin\BlogTagController;
use App\Http\Controllers\Admin\CommissionRuleController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FaqController;
use App\Http\Controllers\Admin\FinanceReportController;
use App\Http\Controllers\Admin\HomeContentController;
use App\Http\Controllers\Admin\MitraWisataController;
use App\Http\Controllers\Admin\MobileHomeContentController;
use App\Http\Controllers\Admin\MobilePromoBannerController;
use App\Http\Controllers\Admin\NotificationControlController;
use App\Http\Controllers\Admin\PartnerTermsDocumentController;
use App\Http\Controllers\Admin\PayoutController;
use App\Http\Controllers\Admin\ProductReviewController;
use App\Http\Controllers\Admin\PrivacyPolicyController;
use App\Http\Controllers\Admin\PromoItemController;
use App\Http\Controllers\Admin\PublicBannerController;
use App\Http\Controllers\Admin\PublicContactController;
use App\Http\Controllers\Admin\PublicContactItemController;
use App\Http\Controllers\Admin\PublicPartnerController;
use App\Http\Controllers\Admin\PublicPartOfLogoController;
use App\Http\Controllers\Admin\SystemSettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VoucherController;
use App\Http\Controllers\Admin\WisataAffiliate\AffiliateController;
use App\Http\Controllers\Admin\WisataAffiliate\AuditController;
use App\Http\Controllers\Admin\WisataAffiliate\CampaignController;
use App\Http\Controllers\Admin\WisataAffiliate\CommissionLogController;
use App\Http\Controllers\Admin\WisataAffiliate\ExceptionController;
use App\Http\Controllers\Admin\WisataAffiliate\PerformanceController;
use App\Http\Controllers\Admin\WisataAffiliate\SettingController;
use App\Http\Controllers\Admin\WisataContentController;
use App\Http\Controllers\Admin\WisataDestinationController;
use App\Http\Controllers\Admin\WisataEntryQrTemplateController;
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
use App\Http\Controllers\Auth\PublicEmailVerificationController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\MidtransCallbackController;
use App\Http\Controllers\Mitra\PartnerTermsSignatureController;
use App\Http\Controllers\Mitra\ReviewController;
use App\Http\Controllers\Mitra\Wisata\BookingController;
use App\Http\Controllers\Mitra\Wisata\DestinationController;
use App\Http\Controllers\Mitra\Wisata\DisputeController;
use App\Http\Controllers\Mitra\Wisata\FinanceController;
use App\Http\Controllers\Mitra\Wisata\ScanController;
use App\Http\Controllers\Mitra\Wisata\TicketController;
use App\Http\Controllers\MitraWisataOnboardingController;
use App\Http\Controllers\MitraWisataSensitiveDocumentController;
use App\Http\Controllers\PasskeyAssociationController;
use App\Http\Controllers\PublicAboutController;
use App\Http\Controllers\PublicDeleteAccountController;
use App\Http\Controllers\PublicFaqController;
use App\Http\Controllers\PublicHistoryController;
use App\Http\Controllers\PublicHomeController;
use App\Http\Controllers\PublicBlogController;
use App\Http\Controllers\PublicMitraGuideController;
use App\Http\Controllers\PublicNotificationController;
use App\Http\Controllers\PublicPrivacyPolicyController;
use App\Http\Controllers\PublicContactUsController;
use App\Http\Controllers\PublicPromoController;
use App\Http\Controllers\PublicReviewController;
use App\Http\Controllers\PublicTransactionFinishController;
use App\Http\Controllers\PublicWisataController;
use App\Http\Controllers\PublicWisataHistoryController;
use App\Http\Controllers\PublicWisataTicketScanController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\WisataBookingController;
use App\Http\Controllers\WisataCartController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/.well-known/assetlinks.json', [PasskeyAssociationController::class, 'assetLinks']);
Route::get('/panduan/mitra', PublicMitraGuideController::class)
    ->name('public.guides.mitra');
Route::get('/.well-known/apple-app-site-association', [PasskeyAssociationController::class, 'appleAppSiteAssociation']);

Route::get('/', [PublicHomeController::class, 'index'])
    ->name('home');
Route::get('/promo', [PublicPromoController::class, 'index'])
    ->name('promo.index');
Route::get('/promo/voucher/{voucher:code}', [PublicPromoController::class, 'selectVoucher'])
    ->name('promo.voucher.select');
Route::get('/promo/{promoItem:slug}', [PublicPromoController::class, 'show'])
    ->name('promo.show');
Route::get('/jelajah', [PublicBlogController::class, 'index'])
    ->name('public.blog.index');
Route::get('/jelajah/{post:slug}', [PublicBlogController::class, 'show'])
    ->name('public.blog.show');
Route::get('/sitemap.xml', SitemapController::class)
    ->name('sitemap');

Route::get(
    '/mobile/email/verify/{id}/{hash}',
    MobileEmailVerificationController::class,
)
    ->middleware(['signed', 'throttle:6,1'])
    ->whereNumber('id')
    ->name('mobile.verification.verify');

Route::get(
    '/email/verify-link/{id}/{hash}',
    PublicEmailVerificationController::class,
)
    ->middleware(['signed', 'throttle:6,1'])
    ->whereNumber('id')
    ->name('public.verification.verify');

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

    Route::get('admin/reviews', [ProductReviewController::class, 'index'])
        ->name('admin.reviews.index');
    Route::post('admin/reviews/{review}/reply', [ProductReviewController::class, 'reply'])
        ->name('admin.reviews.reply');
    Route::delete('admin/reviews/{review}', [ProductReviewController::class, 'destroy'])
        ->name('admin.reviews.destroy');

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
    Route::get('admin/mitra-wisata/{user}/documents/{type}', [MitraWisataSensitiveDocumentController::class, 'showAdmin'])
        ->where('type', 'ktp|selfie|legal')
        ->name('admin.mitra-wisata.documents.show');
    Route::delete('admin/mitra-wisata/{user}', [MitraWisataController::class, 'destroy'])
        ->name('admin.mitra-wisata.destroy');
    Route::post('admin/mitra-wisata/{user}/verify', [MitraWisataController::class, 'verify'])
        ->name('admin.mitra-wisata.verify');
    Route::post('admin/mitra-wisata/{user}/payout', [MitraWisataController::class, 'payout'])
        ->name('admin.mitra-wisata.payout');
    Route::post('admin/mitra-wisata/{user}/suspend', [MitraWisataController::class, 'suspend'])
        ->name('admin.mitra-wisata.suspend');
    Route::get('admin/mitra-documents', [PartnerTermsDocumentController::class, 'index'])
        ->name('admin.mitra-documents.index');
    Route::post('admin/mitra-documents', [PartnerTermsDocumentController::class, 'store'])
        ->name('admin.mitra-documents.store');
    Route::get('admin/mitra-documents/{document}/file', [PartnerTermsDocumentController::class, 'file'])
        ->name('admin.mitra-documents.file');
    Route::delete('admin/mitra-documents/{document}', [PartnerTermsDocumentController::class, 'destroy'])
        ->name('admin.mitra-documents.destroy');

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
    Route::get('admin/wisata/tickets/{ticket}/edit', [WisataTicketController::class, 'edit'])
        ->name('admin.wisata.tickets.edit');
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
        ->middleware('throttle:10,1')
        ->name('admin.wisata.bookings.cancel');
    Route::post('admin/wisata/bookings/{booking}/refund', [WisataExceptionController::class, 'refund'])
        ->middleware('throttle:10,1')
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

    Route::get('admin/wisata/vouchers', [VoucherController::class, 'index'])
        ->name('admin.wisata.vouchers.index');
    Route::post('admin/wisata/vouchers', [VoucherController::class, 'store'])
        ->name('admin.wisata.vouchers.store');
    Route::put('admin/wisata/vouchers/{voucher}', [VoucherController::class, 'update'])
        ->name('admin.wisata.vouchers.update');
    Route::delete('admin/wisata/vouchers/{voucher}', [VoucherController::class, 'destroy'])
        ->name('admin.wisata.vouchers.destroy');

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

    Route::get('admin/wisata/affiliates/system/audit', [AuditController::class, 'index'])
        ->name('admin.wisata.affiliates.audit.index');
    Route::get('admin/wisata/affiliates/system/settings', [SettingController::class, 'index'])
        ->name('admin.wisata.affiliates.settings.index');
    Route::post('admin/wisata/affiliates/system/settings', [SettingController::class, 'update'])
        ->name('admin.wisata.affiliates.settings.update');

    Route::get('admin/wisata/affiliates/{affiliate}', [AffiliateController::class, 'show'])
        ->name('admin.wisata.affiliates.show');
    Route::put('admin/wisata/affiliates/{affiliate}', [AffiliateController::class, 'update'])
        ->name('admin.wisata.affiliates.update');
    Route::post('admin/wisata/affiliates/{affiliate}/status', [AffiliateController::class, 'updateStatus'])
        ->name('admin.wisata.affiliates.status');

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
    Route::get('admin/system/roles', fn () => abort(404))
        ->name('admin.system.roles.index');
    Route::post('admin/system/roles', fn () => abort(404))
        ->name('admin.system.roles.store');
    Route::put('admin/system/roles/{role}', fn () => abort(404))
        ->name('admin.system.roles.update');
    Route::delete('admin/system/roles/{role}', fn () => abort(404))
        ->name('admin.system.roles.destroy');
    Route::put('admin/system/roles/users/{user}', fn () => abort(404))
        ->name('admin.system.roles.users.assign');
    Route::get('admin/system/special-admins', fn () => abort(404))
        ->name('admin.system.special-admins.index');
    Route::post('admin/system/special-admins', fn () => abort(404))
        ->name('admin.system.special-admins.store');
    Route::put('admin/system/special-admins/{user}', fn () => abort(404))
        ->name('admin.system.special-admins.update');
    Route::delete('admin/system/special-admins/{user}', fn () => abort(404))
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

    Route::get('admin/mobile/home', [MobileHomeContentController::class, 'index'])
        ->name('admin.mobile.home.index');
    Route::get('admin/mobile/home/heroes/create', [MobileHomeContentController::class, 'create'])
        ->name('admin.mobile.home.heroes.create');
    Route::post('admin/mobile/home/heroes', [MobileHomeContentController::class, 'store'])
        ->name('admin.mobile.home.heroes.store');
    Route::get('admin/mobile/home/heroes/{hero}/edit', [MobileHomeContentController::class, 'edit'])
        ->name('admin.mobile.home.heroes.edit');
    Route::put('admin/mobile/home/heroes/{hero}', [MobileHomeContentController::class, 'update'])
        ->name('admin.mobile.home.heroes.update');
    Route::delete('admin/mobile/home/heroes/{hero}', [MobileHomeContentController::class, 'destroy'])
        ->name('admin.mobile.home.heroes.destroy');
    Route::get('admin/mobile/promos', [MobilePromoBannerController::class, 'index'])
        ->name('admin.mobile.promos.index');
    Route::get('admin/mobile/promos/create', [MobilePromoBannerController::class, 'create'])
        ->name('admin.mobile.promos.create');
    Route::post('admin/mobile/promos', [MobilePromoBannerController::class, 'store'])
        ->name('admin.mobile.promos.store');
    Route::get('admin/mobile/promos/{promo}/edit', [MobilePromoBannerController::class, 'edit'])
        ->name('admin.mobile.promos.edit');
    Route::put('admin/mobile/promos/{promo}', [MobilePromoBannerController::class, 'update'])
        ->name('admin.mobile.promos.update');
    Route::delete('admin/mobile/promos/{promo}', [MobilePromoBannerController::class, 'destroy'])
        ->name('admin.mobile.promos.destroy');
    Route::get('admin/public/entry-qr', [WisataEntryQrTemplateController::class, 'edit'])
        ->name('admin.public.entry-qr.edit');
    Route::put('admin/public/entry-qr', [WisataEntryQrTemplateController::class, 'update'])
        ->name('admin.public.entry-qr.update');

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
    Route::get('admin/public/contact-us', [PublicContactItemController::class, 'index'])
        ->name('admin.public.contact-us.index');
    Route::post('admin/public/contact-us', [PublicContactItemController::class, 'store'])
        ->name('admin.public.contact-us.store');
    Route::put('admin/public/contact-us/{contact}', [PublicContactItemController::class, 'update'])
        ->name('admin.public.contact-us.update');
    Route::delete('admin/public/contact-us/{contact}', [PublicContactItemController::class, 'destroy'])
        ->name('admin.public.contact-us.destroy');

    Route::get('admin/public/partners', [PublicPartnerController::class, 'index'])
        ->name('admin.public.partners.index');
    Route::get('admin/public/partners/create', [PublicPartnerController::class, 'create'])
        ->name('admin.public.partners.create');
    Route::post('admin/public/partners', [PublicPartnerController::class, 'store'])
        ->name('admin.public.partners.store');
    Route::get('admin/public/partners/{partner}/edit', [PublicPartnerController::class, 'edit'])
        ->name('admin.public.partners.edit');
    Route::put('admin/public/partners/{partner}', [PublicPartnerController::class, 'update'])
        ->name('admin.public.partners.update');
    Route::delete('admin/public/partners/{partner}', [PublicPartnerController::class, 'destroy'])
        ->name('admin.public.partners.destroy');

    Route::post('admin/public/home/part-of-logos', [PublicPartOfLogoController::class, 'store'])
        ->name('admin.public.home.part-of-logos.store');
    Route::put('admin/public/home/part-of-logos/{logo}', [PublicPartOfLogoController::class, 'update'])
        ->name('admin.public.home.part-of-logos.update');
    Route::delete('admin/public/home/part-of-logos/{logo}', [PublicPartOfLogoController::class, 'destroy'])
        ->name('admin.public.home.part-of-logos.destroy');
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

    Route::post('mitra/terms/sign', [PartnerTermsSignatureController::class, 'store'])
        ->name('mitra.terms.sign');
});

Route::prefix('mitra/wisata')
    ->name('mitra.wisata.')
    ->middleware(['auth', 'verified', 'mitra', 'mitra.wisata', 'user.activity'])
    ->group(function () {
        Route::get('destination', [DestinationController::class, 'edit'])
            ->name('destination.edit');
        Route::put('destination', [DestinationController::class, 'update'])
            ->name('destination.update');
        Route::get('documents/{type}', [MitraWisataSensitiveDocumentController::class, 'showOwn'])
            ->where('type', 'ktp|selfie|legal')
            ->name('documents.show');

        Route::get('tickets', [TicketController::class, 'index'])
            ->name('tickets.index');
        Route::get('tickets/create', [TicketController::class, 'create'])
            ->name('tickets.create');
        Route::post('tickets', [TicketController::class, 'store'])
            ->name('tickets.store');
        Route::put('tickets/{ticket}', [TicketController::class, 'update'])
            ->name('tickets.update');
        Route::delete('tickets/{ticket}', [TicketController::class, 'destroy'])
            ->name('tickets.destroy');

        Route::get('bookings', [BookingController::class, 'index'])
            ->name('bookings.index');
        Route::get('bookings/{booking}', [BookingController::class, 'show'])
            ->name('bookings.show');

        Route::get('scans', [ScanController::class, 'index'])
            ->name('scans.index');
        Route::get('scans/qr.pdf', [ScanController::class, 'download'])
            ->name('scans.pdf');
        Route::post('scans', [ScanController::class, 'store'])
            ->name('scans.store');

        Route::get('finance/summary', [FinanceController::class, 'summary'])
            ->name('finance.summary');
        Route::get('finance/payouts', [FinanceController::class, 'payouts'])
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

Route::get('/faq', [PublicFaqController::class, 'index'])
    ->name('public.faq');
Route::get('/about', [PublicAboutController::class, 'show'])
    ->name('public.about');
Route::get('/privacy-policy', [PublicPrivacyPolicyController::class, 'show'])
    ->name('public.privacy-policy');
Route::get('/terms-and-conditions', [PublicPrivacyPolicyController::class, 'terms'])
    ->name('public.terms-and-conditions');
Route::get('/refund-policy', [PublicPrivacyPolicyController::class, 'refund'])
    ->name('public.refund-policy');
Route::get('/contact-us', [PublicContactUsController::class, 'show'])
    ->name('public.contact-us');
Route::get('/delete-account', [PublicDeleteAccountController::class, 'show'])
    ->name('public.delete-account');

Route::middleware(['auth', 'verified', 'user', 'user.activity'])->group(function () {
    Route::get('/transaction/finish', [PublicTransactionFinishController::class, 'show'])
        ->name('transaction.finish');
});
Route::get('/wisata', [PublicWisataController::class, 'index'])
    ->name('wisata.search');
Route::get('/wisata/{destination}', [PublicWisataController::class, 'show'])
    ->name('wisata.show');
Route::post('/wisata/booking/prepare', [WisataBookingController::class, 'prepare'])
    ->middleware('maintenance.transactions')
    ->name('wisata.booking.prepare');
Route::get('/wisata/cart', [WisataCartController::class, 'index'])->name('wisata.cart');
Route::post('/wisata/cart/add', [WisataCartController::class, 'add'])->name('wisata.cart.add');
Route::post('/wisata/cart/update', [WisataCartController::class, 'update'])->name('wisata.cart.update');
Route::post('/wisata/cart/remove', [WisataCartController::class, 'remove'])->name('wisata.cart.remove');
Route::post('/wisata/cart/clear', [WisataCartController::class, 'clear'])->name('wisata.cart.clear');
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
        ->middleware('throttle:5,1')
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
    Route::get('/tickets/scan', [PublicWisataTicketScanController::class, 'index'])
        ->name('tickets.scan.index');
    Route::post('/tickets/scan/use', [PublicWisataTicketScanController::class, 'use'])
        ->name('tickets.scan.use');
    Route::get('/tickets/scan/result/{status}', [PublicWisataTicketScanController::class, 'result'])
        ->name('tickets.scan.result');
    Route::get('/wisata/booking/review', [WisataBookingController::class, 'review'])
        ->middleware('maintenance.transactions')
        ->name('wisata.booking.review');
    Route::post('/wisata/booking/voucher', [WisataBookingController::class, 'applyVoucher'])
        ->middleware('maintenance.transactions')
        ->name('wisata.booking.voucher.apply');
    Route::post('/wisata/booking/voucher/remove', [WisataBookingController::class, 'removeVoucher'])
        ->middleware('maintenance.transactions')
        ->name('wisata.booking.voucher.remove');
    Route::post('/wisata/booking/confirm', [WisataBookingController::class, 'confirm'])
        ->middleware(['maintenance.transactions', 'throttle:10,1'])
        ->name('wisata.booking.confirm');
    Route::get('/wisata/booking/{booking}/payment', [WisataBookingController::class, 'payment'])
        ->middleware('maintenance.transactions')
        ->name('wisata.booking.payment');
    Route::post('/wisata/booking/{booking}/payment', [WisataBookingController::class, 'pay'])
        ->middleware(['maintenance.transactions', 'throttle:10,1'])
        ->name('wisata.booking.pay');
    Route::get('/wisata/booking/{booking}/ticket', [WisataBookingController::class, 'ticket'])
        ->name('wisata.booking.ticket');
    Route::get('/wisata/booking/{booking}', [WisataBookingController::class, 'show'])
        ->name('wisata.booking.show');
});
Route::post('/payments/midtrans/callback', MidtransCallbackController::class)
    ->name('payments.midtrans.callback');

require __DIR__.'/settings.php';
