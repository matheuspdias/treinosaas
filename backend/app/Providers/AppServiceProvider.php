<?php

namespace App\Providers;

use App\Enums\Ability;
use App\Models\PersonalAccessToken;
use App\Models\User;
use App\Repositories\Contracts\AcademyRepository;
use App\Repositories\Contracts\StudentRepository;
use App\Repositories\Eloquent\EloquentAcademyRepository;
use App\Repositories\Eloquent\EloquentStudentRepository;
use App\Tenancy\TenantContext;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /** @var array<class-string, class-string> */
    public array $bindings = [
        AcademyRepository::class => EloquentAcademyRepository::class,
        StudentRepository::class => EloquentStudentRepository::class,
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
    }
}
