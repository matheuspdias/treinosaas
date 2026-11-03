<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Academy;
use App\Repositories\Contracts\AcademyRepository;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Dados públicos do app de cada academia (nome, cor, ícone). Só o que aparece na tela inicial
 * do celular: nada de alunos, equipe ou situação da assinatura.
 */
class AcademyController extends Controller
{
    public function __construct(private readonly AcademyRepository $academies) {}

    public function show(string $slug): JsonResponse
    {
        $academy = $this->find($slug);

        return response()->json([
            'slug' => $academy->slug,
            'name' => $academy->name,
            'appName' => $academy->appName(),
            'brandColor' => $academy->brand_color,
            'iconUrl' => $academy->iconUrl(),
        ]);
    }

    /** Manifest do app instalável. As URLs apontam para o endereço da PWA (start_url precisa ser do mesmo site). */
    public function manifest(string $slug): JsonResponse
    {
        $academy = $this->find($slug);
        $pwa = config('treino.pwa_url');
        $base = $academy->appUrl();

        $icons = $academy->iconUrl() !== null
            ? [
                ['src' => $academy->iconUrl(), 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any'],
                ['src' => $academy->maskableIconUrl(), 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'maskable'],
            ]
            : [
                ['src' => "{$pwa}/pwa-192x192.png", 'sizes' => '192x192', 'type' => 'image/png'],
                ['src' => "{$pwa}/pwa-512x512.png", 'sizes' => '512x512', 'type' => 'image/png'],
                ['src' => "{$pwa}/maskable-icon-512x512.png", 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'maskable'],
            ];

        return response()->json([
            'id' => $base,
            'name' => $academy->appName(),
            'short_name' => mb_substr($academy->appName(), 0, 12),
            'description' => "Seus treinos da {$academy->name}.",
            'lang' => 'pt-BR',
            'dir' => 'ltr',
            'start_url' => $base,
            'scope' => $base,
            'display' => 'standalone',
            'orientation' => 'portrait',
            'background_color' => '#0b0d10',
            'theme_color' => $academy->brand_color ?? '#0b0d10',
            'categories' => ['health', 'fitness', 'sports'],
            'prefer_related_applications' => false,
            'icons' => $icons,
        ], options: JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            ->header('Content-Type', 'application/manifest+json')
            ->header('Cache-Control', 'public, max-age=300');
    }

    private function find(string $slug): Academy
    {
        $academy = $this->academies->findBySlug($slug);
        abort_if($academy === null || ! $academy->isActive(), Response::HTTP_NOT_FOUND, 'Academia não encontrada.');

        return $academy;
    }
}
