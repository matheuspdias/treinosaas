<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Treino realizado pelo aluno (enviado pelo app). */
class WorkoutSession extends Model
{
    use BelongsToAcademy, HasUuids;

    protected $fillable = [
        'id', 'student_id', 'program_id', 'program_plan_id', 'plan_name',
        'started_at', 'finished_at', 'duration_sec', 'volume_kg', 'sets_count',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'volume_kg' => 'float',
        ];
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return HasMany<WorkoutSet, $this> */
    public function sets(): HasMany
    {
        return $this->hasMany(WorkoutSet::class)->orderBy('exercise_position')->orderBy('set_number');
    }
}
