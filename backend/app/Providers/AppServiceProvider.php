<?php

namespace App\Providers;

use App\Enums\Ability;
use App\Models\PersonalAccessToken;
use App\Models\User;
use App\Repositories\Contracts\AcademyRepository;
use App\Repositories\Contracts\AssessmentRepository;
use App\Repositories\Contracts\NoticeRepository;
use App\Repositories\Contracts\ProgramRepository;
use App\Repositories\Contracts\StudentRepository;
use App\Repositories\Contracts\WorkoutRepository;
use App\Repositories\Eloquent\EloquentAcademyRepository;
use App\Repositories\Eloquent\EloquentAssessmentRepository;
use App\Repositories\Eloquent\EloquentNoticeRepository;
use App\Repositories\Eloquent\EloquentProgramRepository;
use App\Repositories\Eloquent\EloquentStudentRepository;
use App\Repositories\Eloquent\EloquentWorkoutRepository;
use App\Services\StudentAuth\LogOtpSender;
use App\Services\StudentAuth\OtpSender;
use App\Services\StudentAuth\PinSecondFactor;
use App\Services\StudentAuth\SecondFactor;
use App\Tenancy\TenantContext;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /** @var array<class-string, class-string> */
    public array $bindings = [
        AcademyRepository::class => EloquentAcademyRepository::class,
        StudentRepository::class => EloquentStudentRepository::class,
        ProgramRepository::class => EloquentProgramRepository::class,
        WorkoutRepository::class => EloquentWorkoutRepository::class,
        AssessmentRepository::class => EloquentAssessmentRepository::class,
        NoticeRepository::class => EloquentNoticeRepository::class,
        SecondFactor::class => PinSecondFactor::class,
        OtpSender::class => LogOtpSender::class,
    ];

    public function register(): void
    {
        $this->app->scoped(TenantContext::class);
    }

    public function boot(): void
    {
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        // Uma permissão = um Gate, resolvido pelo papel na academia atual.
        foreach (Ability::cases() as $ability) {
            Gate::define($ability->value, fn (User $user) => app(TenantContext::class)->allows($ability));
        }

        $this->configureRateLimits();
    }

    private function configureRateLimits(): void
    {
        $phoneKey = fn (Request $request) => preg_replace('/\D+/', '', (string) $request->input('phone'));

        RateLimiter::for('student-lookup', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));

        // PIN de 4 dígitos: além do bloqueio por aluno (5 erros = 15 min), limita por IP e por telefone.
        RateLimiter::for('student-login', fn (Request $request) => [
            Limit::perMinute(10)->by('ip:'.$request->ip()),
            Limit::perHour(20)->by('phone:'.$phoneKey($request)),
        ]);

        RateLimiter::for('student-api', fn (Request $request) => Limit::perMinute(120)->by($request->user()?->getKey() ?: $request->ip()));
    }
}
