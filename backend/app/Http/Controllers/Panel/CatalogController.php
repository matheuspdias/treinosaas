<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Support\Catalog\ExerciseCatalog;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class CatalogController extends Controller
{
    /** Catálogo para o seletor de exercícios do editor (cache no navegador, revalida pela data). */
    public function __invoke(): BinaryFileResponse
    {
        return response()->file(ExerciseCatalog::file(), [
            'Content-Type' => 'application/json',
            'Cache-Control' => 'private, max-age=86400',
        ])->setAutoLastModified();
    }
}
