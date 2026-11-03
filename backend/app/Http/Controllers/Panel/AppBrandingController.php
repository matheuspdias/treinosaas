<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\AppBrandingRequest;
use App\Services\AcademyBrandingService;
use App\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/** Ajustes → App do aluno: nome, cor e ícone do app que o aluno instala. */
class AppBrandingController extends Controller
{
    public function __construct(
        private readonly TenantContext $tenant,
        private readonly AcademyBrandingService $branding,
    ) {}

    public function edit(): Response
    {
        $academy = $this->tenant->academy();

        return Inertia::render('settings/app', [
            'branding' => [
                'name' => $academy->name,
                'appName' => $academy->app_name,
                'brandColor' => $academy->brand_color,
                'iconUrl' => $academy->iconUrl(),
                'appUrl' => $academy->appUrl(),
            ],
        ]);
    }

    public function update(AppBrandingRequest $request): RedirectResponse
    {
        $this->branding->update($this->tenant->academy(), $request->payload());

        return back()->with('success', 'App do aluno atualizado. Quem já instalou vê o ícone novo quando o celular atualizar o app.');
    }
}
