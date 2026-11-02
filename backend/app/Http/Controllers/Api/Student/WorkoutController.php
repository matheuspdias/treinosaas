<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SyncWorkoutsRequest;
use App\Services\WorkoutSyncService;
use Illuminate\Http\JsonResponse;

class WorkoutController extends Controller
{
    public function store(SyncWorkoutsRequest $request, WorkoutSyncService $sync): JsonResponse
    {
        return response()->json($sync->ingest($request->user(), $request->validated('sessions')));
    }
}
