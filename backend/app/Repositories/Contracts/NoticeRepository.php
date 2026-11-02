<?php

namespace App\Repositories\Contracts;

use App\Models\Notice;
use Illuminate\Support\Collection;

interface NoticeRepository
{
    /** @return Collection<int, Notice> todos, fixados e mais recentes primeiro */
    public function all(): Collection;

    /** @return Collection<int, Notice> só os que o aluno vê agora */
    public function visible(): Collection;

    public function create(array $attributes, ?int $createdBy): Notice;

    public function update(Notice $notice, array $attributes): Notice;

    public function delete(Notice $notice): void;
}
