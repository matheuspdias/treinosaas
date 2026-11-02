<?php

namespace Tests\Feature\Tenancy;

use App\Models\Academy;
use App\Models\Student;
use App\Repositories\Contracts\StudentRepository;
use App\Support\PhoneNumber;
use App\Tenancy\CrossTenantWriteException;
use App\Tenancy\MissingTenantException;
use App\Tenancy\TenantContext;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Academy $a;

    private Academy $b;

    private Student $studentA;

    private Student $studentB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->a = Academy::factory()->create();
        $this->b = Academy::factory()->create();
        $this->studentA = $this->inAcademy($this->a, fn () => Student::factory()->create(['phone' => '11911112222']));
        $this->studentB = $this->inAcademy($this->b, fn () => Student::factory()->create(['phone' => '11911112222']));
    }

    public function test_so_enxerga_os_alunos_da_academia_atual(): void
    {
        $ids = $this->inAcademy($this->a, fn () => Student::query()->pluck('id')->all());

        $this->assertSame([$this->studentA->id], $ids);
    }

    public function test_nao_encontra_aluno_de_outra_academia_nem_pelo_id(): void
    {
        $found = $this->inAcademy($this->a, fn () => app(StudentRepository::class)->find($this->studentB->id));

        $this->assertNull($found);
    }

    public function test_falha_fechado_quando_nao_ha_academia_no_contexto(): void
    {
        $this->expectException(MissingTenantException::class);

        Student::query()->count();
    }

    public function test_nao_cria_dado_sem_academia_no_contexto(): void
    {
        $this->expectException(MissingTenantException::class);

        Student::factory()->create();
    }

    public function test_preenche_a_academia_ao_criar(): void
    {
        $student = $this->inAcademy($this->a, fn () => Student::factory()->create());

        $this->assertSame($this->a->id, $student->academy_id);
    }

    public function test_impede_criar_em_outra_academia(): void
    {
        $this->expectException(CrossTenantWriteException::class);

        $this->inAcademy($this->a, fn () => Student::factory()->create(['academy_id' => $this->b->id]));
    }

    public function test_impede_mover_um_registro_de_academia(): void
    {
        $this->expectException(CrossTenantWriteException::class);

        $this->inAcademy($this->a, function () {
            $this->studentA->academy_id = $this->b->id;
            $this->studentA->save();
        });
    }

    public function test_telefone_nao_se_repete_na_mesma_academia(): void
    {
        $this->expectException(UniqueConstraintViolationException::class);

        $this->inAcademy($this->a, fn () => Student::factory()->create(['phone' => '(11) 91111-2222']));
    }

    public function test_busca_o_telefone_em_todas_as_academias_so_pelo_metodo_do_login(): void
    {
        $students = app(StudentRepository::class)->findInAnyAcademyByPhone(PhoneNumber::parse('(11) 91111-2222'));

        $this->assertEqualsCanonicalizing(
            [$this->studentA->id, $this->studentB->id],
            $students->pluck('id')->all(),
        );
    }

    public function test_restaura_o_contexto_anterior_depois_de_run(): void
    {
        $context = app(TenantContext::class);
        $context->set($this->a);

        $context->run($this->b, fn () => null);

        $this->assertSame($this->a->id, $context->id());
    }

    public function test_resolve_o_aluno_pelo_token_antes_de_existir_academia_no_contexto(): void
    {
        $token = $this->studentA->createToken('device')->plainTextToken;
        app(TenantContext::class)->clear();

        $found = Sanctum::$personalAccessTokenModel::findToken($token)->tokenable;

        $this->assertSame($this->studentA->id, $found->id);
    }
}
