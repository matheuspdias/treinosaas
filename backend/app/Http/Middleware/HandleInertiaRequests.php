<?php

namespace App\Http\Middleware;

use App\Enums\Ability;
use App\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                // Só o necessário para o layout; nunca o model inteiro.
                'user' => $user?->only(['id', 'name', 'email', 'email_verified_at']),
            ],
            // Resolvido sob demanda: o middleware `tenant` roda depois deste.
            'academy' => fn () => $this->academy(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }

    /** @return array<string, mixed>|null */
    private function academy(): ?array
    {
        $context = app(TenantContext::class);

        if (! $context->check()) {
            return null;
        }

        return [
            'id' => $context->id(),
            'name' => $context->academy()->name,
            'role' => $context->role()?->value,
            'roleLabel' => $context->role()?->label(),
            'abilities' => array_values(array_map(
                fn (Ability $ability) => $ability->value,
                array_filter(Ability::cases(), $context->allows(...)),
            )),
        ];
    }
}
