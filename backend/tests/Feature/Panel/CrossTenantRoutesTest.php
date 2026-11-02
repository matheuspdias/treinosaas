<?php

namespace Tests\Feature\Panel;

use App\Models\Academy;
use App\Models\Assessment;
use App\Models\Notice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Todas as rotas do painel que recebem um id: um dono da academia B nunca alcança dados da A. */
class CrossTenantRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_nenhuma_rota_alcanca_dados_de_outra_academia(): void
    {
        $a = Academy::factory()->create();
        $ownerA = $this->member(academy: $a);
        $student = $this->student($a, ['name' => 'Aluno da A']);
        $program = $this->program($a, $student);
        $template = $this->program($a);
        [$assessment, $notice] = $this->inAcademy($a, fn () => [
            Assessment::query()->create(['student_id' => $student->id, 'assessed_on' => today(), 'weight_kg' => 80]),
            Notice::query()->create(['title' => 'Feriado', 'body' => 'Fechado', 'published_at' => now()]),
        ]);

        $ownerB = $this->member();
        $this->actingAs($ownerB);

        $requests = [
            ['get', "/alunos/{$student->id}"],
            ['get', "/alunos/{$student->id}/editar"],
            ['put', "/alunos/{$student->id}", ['name' => 'Hack', 'phone' => '11912345678']],
            ['patch', "/alunos/{$student->id}/situacao", ['active' => false]],
            ['post', "/alunos/{$student->id}/liberar-acesso"],
            ['post', "/alunos/{$student->id}/anonimizar", ['confirm' => 'ANONIMIZAR']],
            ['get', "/alunos/{$student->id}/treinos/novo"],
            ['post', "/alunos/{$student->id}/treinos", ['name' => 'X', 'plans' => [$this->planPayload()]]],
            ['get', "/treinos/{$program->id}/editar"],
            ['put', "/treinos/{$program->id}", ['name' => 'X', 'plans' => [$this->planPayload()]]],
            ['post', "/treinos/{$template->id}/aplicar", ['student_ids' => [$student->id]]],
            ['post', "/treinos/{$program->id}/salvar-como-modelo"],
            ['post', "/treinos/{$program->id}/arquivar"],
            ['post', "/alunos/{$student->id}/avaliacoes", ['assessed_on' => today()->toDateString()]],
            ['put', "/alunos/{$student->id}/avaliacoes/{$assessment->id}", ['assessed_on' => today()->toDateString()]],
            ['delete', "/alunos/{$student->id}/avaliacoes/{$assessment->id}"],
            ['put', "/avisos/{$notice->id}", ['title' => 'X', 'body' => 'Y']],
            ['delete', "/avisos/{$notice->id}"],
        ];

        foreach ($requests as $request) {
            [$method, $uri, $data] = $request + [2 => []];
            $this->{$method}($uri, $data)->assertNotFound();
        }

        // Nada mudou na academia A.
        $this->actingAs($ownerA);
        $this->inAcademy($a, function () use ($student, $program, $notice) {
            $this->assertSame('Aluno da A', $student->fresh()->name);
            $this->assertNull($program->fresh()->archived_at);
            $this->assertNotNull($notice->fresh());
            $this->assertSame(1, $student->assessments()->count());
        });
    }

    public function test_aplicar_modelo_ignora_alunos_de_outra_academia(): void
    {
        $owner = $this->member();
        $template = $this->program($owner->currentAcademy);
        $foreign = $this->student(Academy::factory()->create());

        $this->actingAs($owner)
            ->post("/treinos/{$template->id}/aplicar", ['student_ids' => [$foreign->id]])
            ->assertSessionHas('success', 'Treino enviado para 0 alunos.');
    }
}
