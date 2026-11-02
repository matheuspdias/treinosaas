<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        return response()->json(self::present($request->user()));
    }

    /** @return array{student: array<string, mixed>, academy: array<string, mixed>} */
    public static function present(Student $student): array
    {
        return [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'phoneMasked' => $student->phone?->masked(),
            ],
            'academy' => [
                'id' => $student->academy->id,
                'name' => $student->academy->name,
            ],
        ];
    }
}
