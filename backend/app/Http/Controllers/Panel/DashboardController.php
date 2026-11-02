<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, DashboardService $dashboard): Response
    {
        $days = (int) $request->query('sumidos', 7);
        $days = in_array($days, DashboardService::MISSING_DAYS_OPTIONS, true) ? $days : 7;

        return Inertia::render('dashboard', $dashboard->summary($days));
    }
}
