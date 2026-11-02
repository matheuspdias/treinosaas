<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProgramExercise extends Model
{
    use BelongsToAcademy, HasUuids;

    protected $fillable = [
        'position', 'exercise_source', 'exercise_id', 'exercise_name',
        'sets', 'rep_min', 'rep_max', 'load_kg', 'rest_sec', 'increment_kg', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'load_kg' => 'float',
            'increment_kg' => 'float',
        ];
    }
}
