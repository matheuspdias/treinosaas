<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Relations\Pivot;

/** Vínculo de uma pessoa da equipe com uma academia, com o papel dela ali. */
class Membership extends Pivot
{
    protected $table = 'academy_user';

    public $incrementing = true;

    protected function casts(): array
    {
        return [
            'role' => Role::class,
        ];
    }
}
