<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Illuminate\Database\Eloquent\Model;

class WorkoutSet extends Model
{
    use BelongsToAcademy;

    public $timestamps = false;

    protected $fillable = [
        'student_id', 'program_exercise_id', 'exercise_source', 'exercise_id', 'exercise_name',
        'exercise_position', 'set_number', 'weight_kg', 'reps', 'is_warmup', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'weight_kg' => 'float',
            'is_warmup' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }
}
