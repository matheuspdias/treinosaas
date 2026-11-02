<?php

namespace App\Http\Resources;

use App\Models\Notice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Notice */
class NoticeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'pinned' => $this->pinned,
            'publishedAt' => $this->published_at->toIso8601String(),
            'expiresAt' => $this->expires_at?->toIso8601String(),
        ];
    }
}
