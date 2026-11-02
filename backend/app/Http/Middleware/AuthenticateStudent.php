<?php

namespace App\Http\Middleware;

use App\Models\Student;
use App\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * API do aluno: autentica pelo token do aparelho, define a academia do aluno e renova a
 * validade do token a cada uso (sessão persistente enquanto o aluno continuar usando o app).
 */
class AuthenticateStudent
{
    public function __construct(private readonly TenantContext $context) {}

    public function handle(Request $request, Closure $next): Response
    {
        $student = Auth::guard('sanctum')->user();

        if (! $student instanceof Student || ! $student->tokenCan('student')) {
            return $this->reject('unauthenticated', 'Sua sessão expirou. Entre de novo.');
        }

        if (! $student->isActive() || ! $student->academy->isActive()) {
            $student->currentAccessToken()->delete();

            return $this->reject('inactive', 'Seu acesso pela academia foi encerrado. Seus treinos continuam no aparelho.');
        }

        $this->context->set($student->academy);
        Auth::shouldUse('sanctum');
        $this->keepAlive($student);

        return $next($request);
    }

    private function keepAlive(Student $student): void
    {
        $days = config('treino.student.token_days');
        $token = $student->currentAccessToken();

        if ($token->expires_at !== null && $token->expires_at->lt(now()->addDays($days - 7))) {
            $token->forceFill(['expires_at' => now()->addDays($days)])->save();
        }

        if ($student->last_seen_at === null || $student->last_seen_at->lt(now()->subMinutes(10))) {
            $student->forceFill(['last_seen_at' => now()])->saveQuietly();
        }
    }

    private function reject(string $code, string $message): Response
    {
        return response()->json(['code' => $code, 'message' => $message], Response::HTTP_UNAUTHORIZED);
    }
}
