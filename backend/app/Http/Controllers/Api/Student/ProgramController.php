<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Repositories\Contracts\ProgramRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    public function __construct(private readonly ProgramRepository $programs) {}

    /** Treinos ativos do aluno. O app substitui as fichas da academia pelo que vier aqui. */
    public function index(Request $request): JsonResponse
    {
        $programs = $this->programs->activeWithStructureForStudent($request->user())->load('author:id,name');

        return response()->json([
            'programs' => $programs->map(fn (Program $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'notes' => $p->notes,
                'author' => $p->author?->name,
                'startsOn' => $p->starts_on?->toDateString(),
                'expiresOn' => $p->expires_on?->toDateString(),
                'expired' => $p->isExpired(),
                'isNew' => $p->seen_at === null,
                'updatedAt' => $p->updated_at->toIso8601String(),
                'plans' => $p->plans->map(fn ($plan) => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'color' => $plan->color,
                    'position' => $plan->position,
                    'exercises' => $plan->exercises->map(fn ($e) => [
                        'id' => $e->id,
                        'exercise' => ['source' => $e->exercise_source, 'id' => $e->exercise_id],
                        'exerciseName' => $e->exercise_name,
                        'sets' => $e->sets,
                        'repMin' => $e->rep_min,
                        'repMax' => $e->rep_max,
                        'loadKg' => $e->load_kg,
                        'restSec' => $e->rest_sec,
                        'incrementKg' => $e->increment_kg,
                        'notes' => $e->notes ?? '',
                    ])->all(),
                ])->all(),
            ])->all(),
            'syncedAt' => now()->toIso8601String(),
        ]);
    }

    public function seen(Request $request, Program $program): JsonResponse
    {
        abort_unless($program->student_id === $request->user()->id, 404);
        $this->programs->markSeen($program);

        return response()->json(status: 204);
    }
}
