<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Avaliação física registrada pela academia. */
class Assessment extends Model
{
    use BelongsToAcademy, HasUuids;

    public const MEASURES = ['waist', 'chest', 'hips', 'arm', 'thigh', 'calf'];

    protected $fillable = [
        'student_id', 'assessed_on', 'weight_kg', 'height_cm', 'body_fat_pct', 'measurements_cm', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'assessed_on' => 'date',
            'weight_kg' => 'float',
            'height_cm' => 'float',
            'body_fat_pct' => 'float',
            'measurements_cm' => 'array',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
