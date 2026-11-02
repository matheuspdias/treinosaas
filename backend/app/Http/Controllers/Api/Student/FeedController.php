<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\NoticeResource;
use App\Repositories\Contracts\AssessmentRepository;
use App\Repositories\Contracts\NoticeRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Conteúdo só de leitura que a academia publica para o aluno. */
class FeedController extends Controller
{
    public function notices(NoticeRepository $notices): JsonResponse
    {
        return response()->json(['notices' => NoticeResource::collection($notices->visible())->resolve()]);
    }

    public function assessments(Request $request, AssessmentRepository $assessments): JsonResponse
    {
        return response()->json([
            'assessments' => $assessments->forStudent($request->user())->map(fn ($a) => [
                'id' => $a->id,
                'assessedOn' => $a->assessed_on->toDateString(),
                'weightKg' => $a->weight_kg,
                'heightCm' => $a->height_cm,
                'bodyFatPct' => $a->body_fat_pct,
                'measurementsCm' => (object) $a->measurements_cm,
                'notes' => $a->notes,
            ])->all(),
        ]);
    }
}
