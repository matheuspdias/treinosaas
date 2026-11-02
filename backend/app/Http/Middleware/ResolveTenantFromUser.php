<?php

namespace App\Http\Middleware;

use App\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Define a academia do painel a partir do usuário autenticado (academia atual dele,
 * ou a primeira academia ativa em que ele tem vínculo). Sem vínculo ativo: 403.
 */
class ResolveTenantFromUser
{
    public function __construct(private readonly TenantContext $context) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $academies = $user->academies()->whereNull('deactivated_at')->get();
        $academy = $academies->firstWhere('id', $user->current_academy_id) ?? $academies->first();

        abort_if($academy === null, Response::HTTP_FORBIDDEN, 'Você não tem acesso a nenhuma academia ativa.');

        if ($user->current_academy_id !== $academy->id) {
            $user->forceFill(['current_academy_id' => $academy->id])->save();
        }

        $this->context->set($academy, $academy->pivot->role);

        return $next($request);
    }
}
