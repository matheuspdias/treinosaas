<?php

namespace Tests\Feature\Panel;

use App\Enums\Role;
use App\Enums\StudentStatus;
use App\Models\Academy;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_cadastra_aluno_normalizando_o_celular_e_abrindo_o_primeiro_acesso(): void
    {
        $owner = $this->member();

        $this->actingAs($owner)
            ->post('/alunos', ['name' => '  Ana Souza ', 'phone' => '(11) 98765-4321'])
            ->assertRedirect()
            ->assertSessionHas('success');

        $student = $this->inAcademy($owner->currentAcademy, fn () => Student::query()->sole());
        $this->assertSame('Ana Souza', $student->name);
        $this->assertSame('+5511987654321', $student->phone->e164());
        $this->assertSame('pending', $student->accessState());
        $this->assertTrue($student->first_access_until->between(now()->addHours(47), now()->addHours(49)));
    }

    public function test_recusa_celular_invalido_e_repetido_na_mesma_academia(): void
    {
        $owner = $this->member();
        $this->student($owner->currentAcademy, ['name' => 'Ana', 'phone' => '11987654321']);

        $this->actingAs($owner)->post('/alunos', ['name' => 'Xu', 'phone' => '1234'])->assertSessionHasErrors('phone');
        $this->actingAs($owner)->post('/alunos', ['name' => 'Xu', 'phone' => '+55 11 98765-4321'])
            ->assertSessionHasErrors(['phone' => 'Esse celular já está cadastrado para Ana.']);
    }

    public function test_permite_o_mesmo_celular_em_outra_academia(): void
    {
        $this->student(Academy::factory()->create(), ['phone' => '11987654321']);

        $this->actingAs($this->member())->post('/alunos', ['name' => 'Ana', 'phone' => '11987654321'])
            ->assertSessionHasNoErrors();
    }

    public function test_lista_busca_sem_acento_e_mostra_celular_mascarado(): void
    {
        $owner = $this->member();
        $this->student($owner->currentAcademy, ['name' => 'João Silva', 'phone' => '11987654321']);
        $this->student($owner->currentAcademy, ['name' => 'Maria']);
        $this->student(Academy::factory()->create(), ['name' => 'João de outra academia']);

        $this->actingAs($owner)->get('/alunos?busca=joao')
            ->assertInertia(fn (Assert $page) => $page
                ->component('students/index')
                ->has('students.data', 1)
                ->where('students.data.0.name', 'João Silva')
                ->where('students.data.0.phoneMasked', '(11) 9••••-4321')
                ->missing('students.data.0.phone'));
    }

    public function test_inativar_encerra_as_sessoes_do_app_e_some_da_lista_de_ativos(): void
    {
        $owner = $this->member();
        $student = $this->student($owner->currentAcademy);
        $student->createToken('celular', ['student']);

        $this->actingAs($owner)->patch("/alunos/{$student->id}/situacao", ['active' => false])->assertRedirect();

        $this->assertSame(StudentStatus::Inactive, $student->fresh()->status);
        $this->assertSame(0, $student->tokens()->count());
        $this->actingAs($owner)->get('/alunos')->assertInertia(fn (Assert $page) => $page->has('students.data', 0));
    }

    public function test_liberar_acesso_apaga_o_pin_e_derruba_as_sessoes(): void
    {
        $owner = $this->member();
        $student = $this->student($owner->currentAcademy);
        $student->forceFill(['pin_hash' => bcrypt('2580'), 'pin_set_at' => now(), 'first_access_until' => null])->saveQuietly();
        $student->createToken('celular', ['student']);

        $this->actingAs($owner)->post("/alunos/{$student->id}/liberar-acesso")->assertRedirect();

        $student->refresh();
        $this->assertNull($student->pin_hash);
        $this->assertSame('pending', $student->accessState());
        $this->assertSame(0, $student->tokens()->count());
    }

    public function test_anonimizar_exige_confirmacao_e_remove_dados_pessoais(): void
    {
        $owner = $this->member();
        $student = $this->student($owner->currentAcademy, ['name' => 'Ana', 'phone' => '11987654321']);

        $this->actingAs($owner)->post("/alunos/{$student->id}/anonimizar", ['confirm' => 'sim'])->assertSessionHasErrors('confirm');
        $this->actingAs($owner)->post("/alunos/{$student->id}/anonimizar", ['confirm' => 'ANONIMIZAR'])->assertRedirect('/alunos');

        $student->refresh();
        $this->assertSame('Aluno removido', $student->name);
        $this->assertNull($student->phone);
        $this->assertSame(StudentStatus::Inactive, $student->status);
    }

    public function test_instrutor_ve_alunos_com_celular_mascarado_mas_nao_gerencia(): void
    {
        $academy = Academy::factory()->create();
        $instructor = $this->member(Role::Instructor, $academy);
        $student = $this->student($academy, ['phone' => '11987654321']);

        $this->actingAs($instructor)->get("/alunos/{$student->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->missing('student.phone')->where('student.phoneMasked', '(11) 9••••-4321'));

        $this->actingAs($instructor)->get('/alunos/novo')->assertForbidden();
        $this->actingAs($instructor)->post('/alunos', ['name' => 'X', 'phone' => '11912345678'])->assertForbidden();
        $this->actingAs($instructor)->get("/alunos/{$student->id}/editar")->assertForbidden();
        $this->actingAs($instructor)->patch("/alunos/{$student->id}/situacao", ['active' => false])->assertForbidden();
        $this->actingAs($instructor)->post("/alunos/{$student->id}/liberar-acesso")->assertForbidden();
        $this->actingAs($instructor)->get('/avisos')->assertForbidden();
    }

    public function test_dono_ve_o_celular_completo_na_ficha_do_aluno(): void
    {
        $owner = $this->member();
        $student = $this->student($owner->currentAcademy, ['phone' => '11987654321']);

        $this->actingAs($owner)->get("/alunos/{$student->id}")
            ->assertInertia(fn (Assert $page) => $page->where('student.phone', '(11) 98765-4321'));
    }
}
