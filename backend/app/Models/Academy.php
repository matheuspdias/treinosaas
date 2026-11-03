<?php

namespace App\Models;

use Database\Factories\AcademyFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;

class Academy extends Model
{
    /** @use HasFactory<AcademyFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['name', 'slug', 'timezone'];

    protected function casts(): array
    {
        return [
            'deactivated_at' => 'datetime',
            'suspended_at' => 'datetime',
            'branding_updated_at' => 'datetime',
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

    /** Nome que aparece embaixo do ícone na tela inicial do celular. */
    public function appName(): string
    {
        return $this->app_name ?: $this->name;
    }

    /** Endereço do app do aluno desta academia. */
    public function appUrl(): string
    {
        return config('treino.pwa_url').'/'.$this->slug.'/';
    }

    public function iconUrl(): ?string
    {
        return $this->publicUrl($this->icon_path);
    }

    public function maskableIconUrl(): ?string
    {
        return $this->publicUrl($this->maskable_icon_path);
    }

    private function publicUrl(?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        // ?v= troca a URL quando o ícone muda (o celular guarda ícones em cache).
        return Storage::disk('public')->url($path).'?v='.$this->branding_updated_at?->getTimestamp();
    }

    /** Suspensa (ex.: pagamento em atraso): alunos bloqueados, equipe ainda entra no painel. */
    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }
}
