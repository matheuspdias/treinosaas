<?php

namespace Tests\Feature\Panel;

use App\Enums\Role;
use App\Models\Academy;
use App\Models\Program;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProgramManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_cria_modelo_guardando_o_nome_do_exercicio_em_portugues(): void
    {
        $owner = $this->member();

        $this->actingAs($owner)->post('/treinos', [
            'name' => 'Hipertrofia AB',
            'plans' => [$this->planPayload('Treino A'), $this->planPayload('Treino B', [self::SQUAT])],
        ])->assertRedirect('/treinos');

        $this->inAcademy($owner->currentAcademy, function () {
            $program = Program::query()->with('plans.exercises')->sole();
            $this->assertTrue($program->isTemplate());
            $this->assertSame(['Treino A', 'Treino B'], $program->plans->pluck('name')->all());
            $this->assertSame('Supino reto com barra', $program->plans[0]->exercises[0]->exercise_name);
            $this->assertSame('Desça controlando', $program->plans[0]->exercises[0]->notes);
        });
    }

    public function test_recusa_exercicio_fora_do_catalogo(): void
    {
        $this->actingAs($this->member())
            ->post('/treinos', ['name' => 'X', 'plans' => [$this->planPayload('A', ['Nao_Existe'])]])
            ->assertSessionHasErrors('plans');
    }

    public function test_aplica_modelo_a_varios_alunos_com_copia_individual_e_validade(): void
    {
        $owner = $this->member();
        $academy = $owner->currentAcademy;
        $template = $this->program($academy);
        $ana = $this->student($academy);
        $bruno = $this->student($academy);
        $old = $this->program($academy, $ana);

        $this->actingAs($owner)->post("/treinos/{$template->id}/aplicar", [
            'student_ids' => [$ana->id, $bruno->id],
            'expires_on' => today()->addWeeks(6)->toDateString(),
            'replace_current' => true,
        ])->assertSessionHas('success', 'Treino enviado para 2 alunos.');

        $this->inAcademy($academy, function () use ($ana, $bruno, $old, $template) {
            $anaProgram = $ana->programs()->active()->with('plans.exercises')->sole();
            $this->assertSame($template->id, $anaProgram->template_id);
            $this->assertSame(today()->addWeeks(6)->toDateString(), $anaProgram->expires_on->toDateString());
            $this->assertNull($anaProgram->seen_at);
            $this->assertNotNull($old->fresh()->archived_at, 'treino anterior arquivado');
            $this->assertSame(1, $bruno->programs()->count());
            // Cópias independentes: ids diferentes do modelo.
            $this->assertNotEquals($template->plans()->first()->id, $anaProgram->plans[0]->id);
            $this->assertCount(2, $anaProgram->plans);
        });
    }

    public function test_editar_mantem_os_ids_existentes_e_avisa_o_aluno(): void
    {
        $owner = $this->member();
        $student = $this->student($owner->currentAcademy);
        $program = $this->program($owner->currentAcademy, $student);
        $program->forceFill(['seen_at' => now()])->save();

        $props = null;
        $this->actingAs($owner)->get("/treinos/{$program->id}/editar")
            ->assertInertia(function (Assert $page) use (&$props) {
                $page->component('programs/editor');
                $props = $page->toArray()['props']['program'];
            });

        $planA = $props['plans'][0];
        $exerciseId = $planA['exercises'][0]['id'];
        $payload = [
            'name' => 'Hipertrofia ABC v2',
            'expires_on' => today()->addWeeks(4)->toDateString(),
            'plans' => [[
                'id' => $planA['id'],
                'name' => 'Treino A',
                'color' => 'cyan',
                'exercises' => [[...$this->planPayload()['exercises'][0], 'id' => $exerciseId, 'load_kg' => 45]],
            ]],
        ];

        $this->actingAs($owner)->put("/treinos/{$program->id}", $payload)->assertRedirect("/alunos/{$student->id}");

        $this->inAcademy($owner->currentAcademy, function () use ($program, $planA, $exerciseId) {
            $program->refresh()->load('plans.exercises');
            $this->assertCount(1, $program->plans, 'ficha B removida');
            $this->assertSame($planA['id'], $program->plans[0]->id);
            $this->assertSame($exerciseId, $program->plans[0]->exercises[0]->id);
            $this->assertSame(45.0, $program->plans[0]->exercises[0]->load_kg);
            $this->assertNull($program->seen_at);
        });
    }

    public function test_id_desconhecido_vira_registro_novo_em_vez_de_reaproveitar(): void
    {
        $owner = $this->member();
        $other = $this->program(Academy::factory()->create());
        $foreignPlanId = $this->inAcademy($other->academy, fn () => $other->plans()->first()->id);

        $this->actingAs($owner)->post('/treinos', [
            'name' => 'X',
            'plans' => [['id' => $foreignPlanId, ...$this->planPayload()]],
        ])->assertRedirect();

        $this->inAcademy($owner->currentAcademy, function () use ($foreignPlanId) {
            $this->assertNotSame($foreignPlanId, Program::query()->sole()->plans()->first()->id);
        });
    }

    public function test_salvar_treino_do_aluno_como_modelo(): void
    {
        $owner = $this->member();
        $program = $this->program($owner->currentAcademy, $this->student($owner->currentAcademy));

        $this->actingAs($owner)->post("/treinos/{$program->id}/salvar-como-modelo")->assertSessionHas('success');

        $this->inAcademy($owner->currentAcademy, function () {
            $this->assertSame(1, Program::query()->templates()->count());
        });
    }

    public function test_editor_pode_partir_de_um_modelo_para_um_aluno(): void
    {
        $owner = $this->member();
        $template = $this->program($owner->currentAcademy);
        $student = $this->student($owner->currentAcademy);

        $this->actingAs($owner)->get("/alunos/{$student->id}/treinos/novo?modelo={$template->id}")
            ->assertInertia(fn (Assert $page) => $page
                ->where('program.id', null)
                ->where('program.isTemplate', false)
                ->where('program.plans.0.id', null)
                ->where('student.id', $student->id)
                ->where('copiedFrom', $template->name));
    }

    public function test_instrutor_cria_treinos(): void
    {
        $academy = Academy::factory()->create();
        $instructor = $this->member(Role::Instructor, $academy);
        $student = $this->student($academy);

        $this->actingAs($instructor)
            ->post("/alunos/{$student->id}/treinos", ['name' => 'Força', 'plans' => [$this->planPayload()]])
            ->assertRedirect("/alunos/{$student->id}");
    }
}
