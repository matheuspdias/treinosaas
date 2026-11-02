<?php

namespace App\Repositories\Eloquent;

use App\Enums\StudentStatus;
use App\Models\Program;
use App\Models\ProgramExercise;
use App\Models\ProgramPlan;
use App\Models\Student;
use App\Repositories\Contracts\ProgramRepository;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class EloquentProgramRepository implements ProgramRepository
{
    public function find(string $id): ?Program
    {
        return Program::query()->find($id);
    }

    public function templates(?string $search = null): Collection
    {
        return Program::query()
            ->templates()
            ->active()
            ->when($search, fn (Builder $q, string $s) => $q->whereRaw('unaccent_lower(name) like unaccent_lower(?)', ['%'.$s.'%']))
            ->withCount('plans')
            ->orderBy('name')
            ->get();
    }

    public function forStudent(Student $student): Collection
    {
        return $student->programs()
            ->withCount('plans')
            ->orderByRaw('archived_at is not null')
            ->orderByDesc('created_at')
            ->get();
    }

    public function activeWithStructureForStudent(Student $student): Collection
    {
        return $student->programs()
            ->active()
            ->with('plans.exercises')
            ->orderBy('created_at')
            ->get();
    }

    public function create(array $attributes, ?Student $student, ?int $createdBy, ?Program $template = null): Program
    {
        $program = new Program($attributes);
        $program->student_id = $student?->id;
        $program->template_id = $template?->id;
        $program->created_by = $createdBy;
        $program->save();

        return $program;
    }

    public function update(Program $program, array $attributes): Program
    {
        $program->fill($attributes)->save();

        return $program;
    }

    public function replaceStructure(Program $program, array $plans): void
    {
        $existingPlans = $program->plans()->with('exercises')->get()->keyBy('id');
        $keptPlanIds = [];

        foreach (array_values($plans) as $planIndex => $planData) {
            /** @var ProgramPlan $plan */
            $plan = $existingPlans->get($planData['id'] ?? '') ?? new ProgramPlan; // id novo sempre gerado aqui
            $plan->program_id = $program->id;
            $plan->fill([
                'name' => $planData['name'],
                'color' => $planData['color'],
                'position' => $planIndex,
            ])->save();
            $keptPlanIds[] = $plan->id;

            $existingExercises = $plan->relationLoaded('exercises') ? $plan->exercises->keyBy('id') : collect();
            $keptExerciseIds = [];

            foreach (array_values($planData['exercises']) as $exerciseIndex => $exerciseData) {
                /** @var ProgramExercise $exercise */
                $exercise = $existingExercises->get($exerciseData['id'] ?? '') ?? new ProgramExercise;
                $exercise->program_plan_id = $plan->id;
                $exercise->fill([
                    ...collect($exerciseData)->only([
                        'exercise_source', 'exercise_id', 'exercise_name', 'sets', 'rep_min', 'rep_max',
                        'load_kg', 'rest_sec', 'increment_kg', 'notes',
                    ])->all(),
                    'position' => $exerciseIndex,
                ])->save();
                $keptExerciseIds[] = $exercise->id;
            }

            ProgramExercise::query()
                ->where('program_plan_id', $plan->id)
                ->whereNotIn('id', $keptExerciseIds)
                ->delete();
        }

        $program->plans()->whereNotIn('id', $keptPlanIds)->delete();
        $program->touch();
    }

    public function archiveActiveForStudent(Student $student, ?Program $except = null): void
    {
        $student->programs()
            ->active()
            ->when($except, fn (Builder $q) => $q->whereKeyNot($except->id))
            ->update(['archived_at' => now()]);
    }

    public function archive(Program $program): void
    {
        $program->forceFill(['archived_at' => now()])->save();
    }

    public function delete(Program $program): void
    {
        $program->delete();
    }

    public function markSeen(Program $program): void
    {
        if ($program->seen_at === null) {
            $program->forceFill(['seen_at' => now()])->save();
        }
    }

    public function expiringUntil(CarbonInterface $until, int $limit = 50): Collection
    {
        return Program::query()
            ->active()
            ->whereNotNull('student_id')
            ->whereNotNull('expires_on')
            ->whereDate('expires_on', '<=', $until)
            ->whereHas('student', fn (Builder $q) => $q->where('status', StudentStatus::Active))
            ->with('student:id,name')
            ->orderBy('expires_on')
            ->limit($limit)
            ->get();
    }

    public function countExpired(): int
    {
        return Program::query()
            ->active()
            ->whereNotNull('student_id')
            ->whereDate('expires_on', '<', today())
            ->whereHas('student', fn (Builder $q) => $q->where('status', StudentStatus::Active))
            ->count();
    }
}
