<?php

namespace App\Providers;

use App\Models\AcademyClass;
use App\Models\AcademyTicket;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Models\CommissionRule;
use App\Models\Event;
use App\Models\EventCommission;
use App\Models\EventOrganizer;
use App\Models\EventTicket;
use App\Models\Faq;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\NotificationTemplate;
use App\Models\PublicBanner;
use App\Models\PublicContact;
use App\Models\PublicPartner;
use App\Models\RoomInventory;
use App\Models\RoomType;
use App\Models\SouvenirCategory;
use App\Models\SouvenirProduct;
use App\Models\SouvenirPromotion;
use App\Models\SouvenirVariant;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramVariant;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\Voucher;
use App\Models\WisataCommissionRule;
use App\Models\WisataTicket;
use App\Observers\AdminRecordAuditObserver;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerAdminRecordAuditing();
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }

    protected function registerAdminRecordAuditing(): void
    {
        $models = [
            AcademyClass::class,
            AcademyTicket::class,
            BlogCategory::class,
            BlogPost::class,
            BlogTag::class,
            CommissionRule::class,
            Event::class,
            EventCommission::class,
            EventOrganizer::class,
            EventTicket::class,
            Faq::class,
            Hotel::class,
            MitraWisataOnboarding::class,
            NotificationTemplate::class,
            PublicBanner::class,
            PublicContact::class,
            PublicPartner::class,
            RoomInventory::class,
            RoomType::class,
            SouvenirCategory::class,
            SouvenirProduct::class,
            SouvenirPromotion::class,
            SouvenirVariant::class,
            SpecialProgram::class,
            SpecialProgramVariant::class,
            SystemSetting::class,
            User::class,
            Voucher::class,
            WisataCommissionRule::class,
            WisataTicket::class,
        ];

        foreach ($models as $model) {
            $model::observe(AdminRecordAuditObserver::class);
        }
    }
}
