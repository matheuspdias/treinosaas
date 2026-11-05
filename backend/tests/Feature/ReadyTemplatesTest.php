<?php

namespace Tests\Feature;

use App\Models\Academy;
use App\Models\Program;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReadyTemplatesTest extends TestCase
{
    use RefreshDatabase;

    private const NAMES = ['ABC', 'ABCD', 'Full Body', 'Upper / Lower'];

    public function test_academia_nova_ja_vem_com_os_modelos_prontos(): void
    {
        $this->artisan('academy:create', [
            'name' => 'Academia Nova',
            '--owner-email' => 'dono@nova.test',
            '--owner-name' => 'Dono',
        ])->assertSuccessful();

        $this->inAcademy(Academy::query()->sole(), function () {
            $templates = Program::query()->templates()->with('plans.exercises')->orderBy('name')->get();

            $this->assertSame(self::NAMES, $templates->pluck('name')->all());

            $abc = $templates->firstWhere('name', 'ABC');
            $this->assertSame(['Treino A', 'Treino B', 'Treino C'], $abc->plans->pluck('name')->all());
            $this->assertSame('Supino reto com barra', $abc->plans[0]->exercises[0]->exercise_name);
            $this->assertEquals(0, $abc->plans[0]->exercises[0]->load_kg);
            $this->assertNotNull($abc->created_by);
        });
    }

    public function test_comando_adiciona_em_academia_antiga_sem_duplicar(): void
    {
        $academy = Academy::factory()->create();

        $this->artisan('academy:ready-templates', ['slug' => $academy->slug])
            ->expectsOutputToContain('4 modelos criados')
            ->assertSuccessful();
        $this->artisan('academy:ready-templates', ['--all' => true])
            ->expectsOutputToContain('0 modelos criados')
            ->assertSuccessful();

        $this->inAcademy($academy, function () {
            $this->assertSame(4, Program::query()->templates()->count());
        });
    }

    public function test_comando_exige_academia(): void
    {
        $this->artisan('academy:ready-templates', ['slug' => 'nao-existe'])->assertFailed();
    }
}
