<?php

namespace App\Services;

use App\Models\Academy;
use App\Repositories\Contracts\AcademyRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Marca do app do aluno. Os ícones chegam prontos do painel (PNG 512×512 gerado no navegador),
 * então o servidor só valida e guarda.
 */
class AcademyBrandingService
{
    public function __construct(private readonly AcademyRepository $academies) {}

    /**
     * @param  array{appName: ?string, brandColor: ?string, icon: ?UploadedFile, maskableIcon: ?UploadedFile, removeIcon: bool}  $data
     */
    public function update(Academy $academy, array $data): Academy
    {
        $old = array_filter([$academy->icon_path, $academy->maskable_icon_path]);

        $academy->forceFill([
            'app_name' => $data['appName'] ?: null,
            'brand_color' => $data['brandColor'] ? Str::lower($data['brandColor']) : null,
        ]);

        $replace = $data['icon'] !== null && $data['maskableIcon'] !== null;

        if ($replace) {
            $academy->forceFill([
                'icon_path' => $this->store($academy, $data['icon'], 'icon'),
                'maskable_icon_path' => $this->store($academy, $data['maskableIcon'], 'maskable'),
            ]);
        } elseif ($data['removeIcon']) {
            $academy->forceFill(['icon_path' => null, 'maskable_icon_path' => null]);
        }

        $academy->forceFill(['branding_updated_at' => now()]);
        $this->academies->save($academy);

        if ($replace || $data['removeIcon']) {
            Storage::disk('public')->delete($old);
        }

        return $academy;
    }

    private function store(Academy $academy, UploadedFile $file, string $kind): string
    {
        return $file->storeAs("academies/{$academy->id}", $kind.'-'.Str::random(12).'.png', 'public');
    }
}
