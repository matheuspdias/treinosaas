<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** Aviso do mural da academia. */
class Notice extends Model
{
    use BelongsToAcademy, HasUuids;

    protected $fillable = ['title', 'body', 'pinned', 'published_at', 'expires_at'];

    protected function casts(): array
    {
        return [
            'pinned' => 'boolean',
            'published_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /** Publicados e não expirados. @param Builder<Notice> $query */
    public function scopeVisible(Builder $query): void
    {
        $query->where('published_at', '<=', now())
            ->where(fn (Builder $q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }
}
