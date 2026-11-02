<?php

use App\Http\Middleware\AuthenticateStudent;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ResolveTenantFromUser;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Routing\Middleware\SubstituteBindings;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'tenant' => ResolveTenantFromUser::class,
            'student' => AuthenticateStudent::class,
        ]);

        // A academia precisa estar definida antes do route model binding ({student}, {program}...),
        // que consulta com o filtro de academia.
        $middleware->prependToPriorityList(SubstituteBindings::class, ResolveTenantFromUser::class);
        $middleware->prependToPriorityList(SubstituteBindings::class, AuthenticateStudent::class);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
