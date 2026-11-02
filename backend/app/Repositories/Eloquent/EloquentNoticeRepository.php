<?php

namespace App\Repositories\Eloquent;

use App\Models\Notice;
use App\Repositories\Contracts\NoticeRepository;
use Illuminate\Support\Collection;

class EloquentNoticeRepository implements NoticeRepository
{
    public function all(): Collection
    {
        return Notice::query()->orderByDesc('pinned')->latest('published_at')->get();
    }

    public function visible(): Collection
    {
        return Notice::query()->visible()->orderByDesc('pinned')->latest('published_at')->limit(30)->get();
    }

    public function create(array $attributes, ?int $createdBy): Notice
    {
        $notice = new Notice($attributes);
        $notice->created_by = $createdBy;
        $notice->save();

        return $notice;
    }

    public function update(Notice $notice, array $attributes): Notice
    {
        $notice->fill($attributes)->save();

        return $notice;
    }

    public function delete(Notice $notice): void
    {
        $notice->delete();
    }
}
