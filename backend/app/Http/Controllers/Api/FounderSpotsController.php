<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FounderProgramService;
use Illuminate\Http\JsonResponse;

/** Vagas do Programa Fundadores, contadas no banco (cache de 60 s). Público. */
class FounderSpotsController extends Controller
{
    public function __invoke(FounderProgramService $founders): JsonResponse
    {
        return response()->json($founders->spots())->header('Cache-Control', 'public, max-age=60');
    }
}
