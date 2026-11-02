<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Ficha (A, B, C...) dentro de um programa. */
class ProgramPlan extends Model
{
    use BelongsToAcademy, HasUuids;

    protected $fillable = ['name', 'color', 'position'];

    /** @return BelongsTo<Program, $this> */
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    /** @return HasMany<ProgramExercise, $this> */
    public function exercises(): HasMany
    {
        return $this->hasMany(ProgramExercise::class)->orderBy('position');
    }
}
