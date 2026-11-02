<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Database\Factories\ProgramFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Program extends Model
{
    /** @use HasFactory<ProgramFactory> */
    use BelongsToAcademy, HasFactory, HasUuids;

    protected $fillable = ['name', 'notes', 'starts_on', 'expires_on'];

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'expires_on' => 'date',
            'seen_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    /** @return HasMany<ProgramPlan, $this> */
    public function plans(): HasMany
    {
        return $this->hasMany(ProgramPlan::class)->orderBy('position');
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @param Builder<Program> $query */
    public function scopeTemplates(Builder $query): void
    {
        $query->whereNull('student_id');
    }

    /** @param Builder<Program> $query */
    public function scopeActive(Builder $query): void
    {
        $query->whereNull('archived_at');
    }

    public function isTemplate(): bool
    {
        return $this->student_id === null;
    }

    public function isExpired(): bool
    {
        return $this->expires_on !== null && $this->expires_on->endOfDay()->isPast();
    }
}
