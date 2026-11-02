<?php

namespace Tests\Feature\Panel;

use App\Models\WorkoutSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardInsightsTest extends TestCase
{
    use RefreshDatabase;

    public function test_mostra_ativos_treinos_da_semana_fichas_vencidas_e_sumidos(): void
    {
        $owner = $this->member();
        $academy = $owner->currentAcademy;
        $frequent = $this->student($academy, ['name' => 'Frequente']);
        $missing = $this->student($academy, ['name' => 'Sumido']);
        $missing->forceFill(['created_at' => now()->subMonth(), 'last_workout_at' => now()->subDays(20)])->saveQuietly();
        $this->student($academy, ['status' => 'inactive', 'name' => 'Inativo']);
        $this->program($academy, $frequent, ['expires_on' => today()->subDay()->toDateString()]);
        $this->program($academy, $missing, ['expires_on' => today()->addDays(3)->toDateString()]);

        $this->inAcademy($academy, function () use ($frequent) {
            $session = new WorkoutSession;
            $session->forceFill([
                'id' => (string) Str::uuid(), 'student_id' => $frequent->id, 'plan_name' => 'A',
                'started_at' => now()->subHour(), 'finished_at' => now(), 'duration_sec' => 3600,
            ])->save();
            $frequent->forceFill(['last_workout_at' => now()])->save();
        });

        $this->actingAs($owner)->get('/dashboard?sumidos=14')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('stats.activeStudents', 2)
                ->where('stats.workoutsThisWeek', 1)
                ->where('stats.expiredPrograms', 1)
                ->has('expiring', 2)
                ->where('expiring.0.expired', true)
                ->where('missingDays', 14)
                ->has('missing', 1)
                ->where('missing.0.name', 'Sumido')
                ->has('daily', 14));
    }
}
