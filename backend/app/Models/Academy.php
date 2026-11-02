<?php

namespace App\Models;

use Database\Factories\AcademyFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Academy extends Model
{
    /** @use HasFactory<AcademyFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['name', 'slug', 'timezone'];

    protected function casts(): array
    {
        return [
            'deactivated_at' => 'datetime',
        ];
    }

    /** @return BelongsToMany<User, $this, Membership> */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->using(Membership::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function isActive(): bool
    {
        return $this->deactivated_at === null;
    }
}
