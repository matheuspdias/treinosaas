<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /** @return BelongsToMany<Academy, $this, Membership> */
    public function academies(): BelongsToMany
    {
        return $this->belongsToMany(Academy::class)
            ->using(Membership::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /** @return BelongsTo<Academy, $this> */
    public function currentAcademy(): BelongsTo
    {
        return $this->belongsTo(Academy::class, 'current_academy_id');
    }

    public function roleIn(Academy $academy): ?Role
    {
        /** @var Academy|null $membership */
        $membership = $this->academies()->whereKey($academy->getKey())->first();

        return $membership?->pivot->role;
    }
}
