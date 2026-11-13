<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Painel /admin: só o dono do TreinoBox (users.is_super_admin). Não usa academia no contexto. */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->isSuperAdmin(), Response::HTTP_FORBIDDEN);

        return $next($request);
    }
}
