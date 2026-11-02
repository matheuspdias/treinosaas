<?php

namespace App\Models;

use App\Casts\AsPhoneNumber;
use App\Enums\StudentStatus;
use App\Models\Concerns\BelongsToAcademy;
use Database\Factories\StudentFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Student extends Model
{
    /** @use HasFactory<StudentFactory> */
    use BelongsToAcademy, HasApiTokens, HasFactory, HasUuids;

    protected $fillable = ['name', 'phone', 'status'];

    protected $hidden = ['pin_hash'];

    protected function casts(): array
    {
        return [
            'phone' => AsPhoneNumber::class,
            'status' => StudentStatus::class,
            'pin_set_at' => 'datetime',
            'first_access_until' => 'datetime',
            'locked_until' => 'datetime',
            'privacy_accepted_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'anonymized_at' => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === StudentStatus::Active;
    }

    public function hasPin(): bool
    {
        return $this->pin_hash !== null;
    }

    public function canCreatePin(): bool
    {
        return ! $this->hasPin()
            && $this->first_access_until !== null
            && $this->first_access_until->isFuture();
    }

    public function isLocked(): bool
    {
        return $this->locked_until !== null && $this->locked_until->isFuture();
    }
}
