<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StudentLoginRequest;
use App\Models\Student;
use App\Rules\Pin;
use App\Services\StudentAuth\StudentAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\NewAccessToken;

class AuthController extends Controller
{
    public function __construct(private readonly StudentAuthService $auth) {}

    public function lookup(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:30'],
            'academy' => ['nullable', 'string', 'max:80'],
        ]);

        return response()->json($this->auth->lookup($data['phone'], $data['academy'] ?? null));
    }

    public function firstAccess(StudentLoginRequest $request): JsonResponse
    {
        $token = $this->auth->firstAccess(
            $request->validated('phone'),
            $request->validated('academyId'),
            $request->validated('pin'),
            $request->device(),
            $request->validated('academy'),
        );

        return $this->tokenResponse($token, 201);
    }

    public function login(StudentLoginRequest $request): JsonResponse
    {
        $token = $this->auth->login(
            $request->validated('phone'),
            $request->validated('academyId'),
            $request->validated('pin'),
            $request->device(),
            $request->validated('academy'),
        );

        return $this->tokenResponse($token);
    }

    public function changePin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'currentPin' => ['required', 'string'],
            'pin' => ['required', 'string', new Pin, 'different:currentPin'],
        ]);
        $this->auth->changePin($request->user(), $data['currentPin'], $data['pin']);

        return response()->json(['message' => 'PIN alterado.']);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(status: 204);
    }

    private function tokenResponse(NewAccessToken $token, int $status = 200): JsonResponse
    {
        /** @var Student $student */
        $student = $token->accessToken->tokenable;

        return response()->json([
            'token' => $token->plainTextToken,
            'expiresAt' => $token->accessToken->expires_at?->toIso8601String(),
            ...MeController::present($student),
        ], $status);
    }
}
