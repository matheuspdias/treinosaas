<?php

namespace Tests\Feature\Api;

use App\Models\Academy;
use App\Models\Student;
use App\Services\AcademyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StudentAuthTest extends TestCase
{
    use RefreshDatabase;

    private Academy $academy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->academy = Academy::factory()->create(['name' => 'Academia Demo']);
    }

    private function pending(string $phone = '11987654321'): Student
    {
        $student = $this->student($this->academy, ['phone' => $phone]);
        $student->forceFill(['first_access_until' => now()->addHours(48)])->saveQuietly();

        return $student;
    }

    private function withPin(string $pin = '2580', string $phone = '11987654321'): Student
    {
        $student = $this->student($this->academy, ['phone' => $phone]);
        $student->forceFill(['pin_hash' => Hash::make($pin), 'pin_set_at' => now()])->saveQuietly();

        return $student;
    }

    public function test_lookup_indica_o_proximo_passo(): void
    {
        $this->pending();
        $this->postJson('/api/student/auth/lookup', ['phone' => '(11) 98765-4321'])
            ->assertOk()->assertExactJson(['next' => 'first_access', 'academies' => []]);

        $this->postJson('/api/student/auth/lookup', ['phone' => '11900000000'])->assertJson(['next' => 'not_found']);
        $this->postJson('/api/student/auth/lookup', ['phone' => 'abc'])->assertJson(['next' => 'not_found']);
    }

    public function test_primeiro_acesso_cria_o_pin_e_devolve_token(): void
    {
        $student = $this->pending();

        $response = $this->postJson('/api/student/auth/first-access', [
            'phone' => '11987654321', 'pin' => '2580', 'acceptPrivacy' => true, 'device' => 'iPhone',
        ])->assertCreated()
            ->assertJsonPath('student.id', $student->id)
            ->assertJsonPath('student.phoneMasked', '(11) 9••••-4321')
            ->assertJsonPath('academy.name', 'Academia Demo')
            ->assertJsonMissingPath('student.phone');

        $this->assertNotEmpty($response->json('token'));
        $student->refresh();
        $this->assertTrue(Hash::check('2580', $student->pin_hash));
        $this->assertNotNull($student->privacy_accepted_at);
        $this->assertNull($student->first_access_until);

        // Não dá para "criar o PIN" de novo por cima.
        $this->postJson('/api/student/auth/first-access', ['phone' => '11987654321', 'pin' => '1357', 'acceptPrivacy' => true])
            ->assertUnprocessable()->assertJsonValidationErrors(['pin' => 'Você já criou seu PIN. Entre com ele.']);
    }

    public function test_primeiro_acesso_exige_aviso_de_privacidade_e_pin_forte(): void
    {
        $this->pending();

        $this->postJson('/api/student/auth/first-access', ['phone' => '11987654321', 'pin' => '1234', 'acceptPrivacy' => false])
            ->assertUnprocessable()->assertJsonValidationErrors(['pin', 'acceptPrivacy']);
        $this->postJson('/api/student/auth/first-access', ['phone' => '11987654321', 'pin' => '0000', 'acceptPrivacy' => true])
            ->assertJsonValidationErrors('pin');
    }

    public function test_primeiro_acesso_fecha_depois_do_prazo(): void
    {
        $this->pending()->forceFill(['first_access_until' => now()->subMinute()])->saveQuietly();

        $this->postJson('/api/student/auth/lookup', ['phone' => '11987654321'])->assertJson(['next' => 'blocked']);
        $this->postJson('/api/student/auth/first-access', ['phone' => '11987654321', 'pin' => '2580', 'acceptPrivacy' => true])
            ->assertJsonValidationErrors(['pin' => 'O prazo do primeiro acesso acabou. Peça para a academia liberar seu acesso.']);
    }

    public function test_login_com_pin(): void
    {
        $this->withPin();

        $this->postJson('/api/student/auth/login', ['phone' => '11987654321', 'pin' => '2580'])->assertOk()->assertJsonStructure(['token', 'expiresAt']);
        $this->postJson('/api/student/auth/login', ['phone' => '11987654321', 'pin' => '9999'])
            ->assertJsonValidationErrors(['pin' => 'PIN incorreto.']);
    }

    public function test_bloqueia_depois_de_cinco_erros(): void
    {
        $student = $this->withPin();

        foreach (range(1, 5) as $_) {
            $this->postJson('/api/student/auth/login', ['phone' => '11987654321', 'pin' => '9999']);
        }

        $this->assertTrue($student->fresh()->isLocked());
        $this->postJson('/api/student/auth/login', ['phone' => '11987654321', 'pin' => '2580'])
            ->assertJsonValidationErrors('pin')
            ->assertJsonPath('errors.pin.0', fn (string $message) => str_starts_with($message, 'Muitas tentativas'));
    }

    public function test_inativo_e_academia_desativada_nao_entram(): void
    {
        $student = $this->withPin();
        $student->forceFill(['status' => 'inactive'])->saveQuietly();
        $this->postJson('/api/student/auth/login', ['phone' => '11987654321', 'pin' => '2580'])->assertJsonValidationErrors('phone');

        $student->forceFill(['status' => 'active'])->saveQuietly();
        $this->academy->forceFill(['deactivated_at' => now()])->save();
        $this->postJson('/api/student/auth/lookup', ['phone' => '11987654321'])->assertJson(['next' => 'not_found']);
    }

    public function test_aluno_inativo_ve_o_motivo_em_vez_de_nao_encontrado(): void
    {
        $student = $this->withPin();
        $student->forceFill(['status' => 'inactive'])->saveQuietly();

        $this->postJson('/api/student/auth/lookup', ['phone' => '11987654321'])->assertJson(['next' => 'inactive']);
        $this->postJson('/api/student/auth/login', ['phone' => '11987654321', 'pin' => '2580'])
            ->assertJsonValidationErrors(['phone' => 'Seu cadastro está inativo. Fale com a academia.']);
    }

    public function test_academia_suspensa_bloqueia_o_aluno_e_libera_ao_reativar(): void
    {
        $student = $this->withPin();
        $token = $student->createToken('celular', ['student'])->plainTextToken;
        app(AcademyService::class)->suspend($this->academy, 'boleto de outubro');

        $this->postJson('/api/student/auth/lookup', ['phone' => '11987654321'])->assertJson(['next' => 'suspended']);
        $this->postJson('/api/student/auth/login', ['phone' => '11987654321', 'pin' => '2580'])
            ->assertJsonValidationErrors('phone')
            ->assertJsonPath('errors.phone.0', fn (string $m) => str_contains($m, 'suspenso'));

        $this->withToken($token)->getJson('/api/student/programs')
            ->assertForbidden()
            ->assertJson(['code' => 'academy_suspended'])
            ->assertJsonMissing(['boleto de outubro']);
        $this->withToken($token)->postJson('/api/student/workouts', ['sessions' => []])->assertForbidden();
        $this->assertSame(1, $student->tokens()->count(), 'a sessão fica guardada para a reativação');

        $other = $student->createToken('outro', ['student'])->plainTextToken;
        $this->app['auth']->forgetGuards();
        $this->withToken($other)->postJson('/api/student/auth/logout')->assertNoContent();
        $this->app['auth']->forgetGuards();

        app(AcademyService::class)->reactivate($this->academy->fresh());
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->getJson('/api/student/me')->assertOk();
    }

    public function test_academia_suspensa_nao_afeta_alunos_de_outra_academia(): void
    {
        $other = Academy::factory()->create();
        $student = $this->student($other, ['phone' => '21987654321']);
        $token = $student->createToken('celular', ['student'])->plainTextToken;
        app(AcademyService::class)->suspend($this->academy);

        $this->withToken($token)->getJson('/api/student/me')->assertOk();
    }

    public function test_mesmo_celular_em_duas_academias_pede_para_escolher(): void
    {
        $this->withPin('2580');
        $other = Academy::factory()->create(['name' => 'Outra']);
        $second = $this->student($other, ['phone' => '11987654321']);
        $second->forceFill(['pin_hash' => Hash::make('1357')])->saveQuietly();

        $this->postJson('/api/student/auth/lookup', ['phone' => '11987654321'])
            ->assertJson(['next' => 'choose_academy'])
            ->assertJsonCount(2, 'academies');

        $this->postJson('/api/student/auth/login', ['phone' => '11987654321', 'pin' => '1357'])->assertJsonValidationErrors(['phone' => 'Escolha a academia.']);
        $this->postJson('/api/student/auth/login', ['phone' => '11987654321', 'pin' => '1357', 'academyId' => $other->id])
            ->assertOk()->assertJsonPath('academy.name', 'Outra');
    }

    public function test_sessao_persistente_renova_o_token_a_cada_uso(): void
    {
        $student = $this->withPin();
        $token = $student->createToken('celular', ['student'], now()->addDays(10));

        $this->withToken($token->plainTextToken)->getJson('/api/student/me')->assertOk();

        $this->assertTrue($token->accessToken->fresh()->expires_at->gt(now()->addDays(170)));
        $this->assertNotNull($student->fresh()->last_seen_at);
    }

    public function test_aluno_inativado_perde_o_acesso_com_codigo_proprio(): void
    {
        $student = $this->withPin();
        $token = $student->createToken('celular', ['student'])->plainTextToken;
        $student->forceFill(['status' => 'inactive'])->saveQuietly();

        $this->withToken($token)->getJson('/api/student/me')->assertUnauthorized()->assertJson(['code' => 'inactive']);
    }

    public function test_token_invalido_e_usuario_do_painel_nao_acessam_a_api(): void
    {
        $this->withToken('nada')->getJson('/api/student/me')->assertUnauthorized()->assertJson(['code' => 'unauthenticated']);
        $this->actingAs($this->member())->getJson('/api/student/me')->assertUnauthorized();
    }

    public function test_troca_e_saida(): void
    {
        $student = $this->withPin();
        $token = $student->createToken('celular', ['student'])->plainTextToken;

        $this->withToken($token)->putJson('/api/student/pin', ['currentPin' => '0000', 'pin' => '1357'])->assertJsonValidationErrors('current_pin');
        $this->withToken($token)->putJson('/api/student/pin', ['currentPin' => '2580', 'pin' => '1357'])->assertOk();
        $this->assertTrue(Hash::check('1357', $student->fresh()->pin_hash));

        $this->withToken($token)->postJson('/api/student/auth/logout')->assertNoContent();
        $this->assertSame(0, $student->tokens()->count());
    }

    public function test_cors_libera_so_a_pwa(): void
    {
        $this->withHeaders(['Origin' => 'http://localhost:5174'])->postJson('/api/student/auth/lookup', ['phone' => '1'])
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5174');
        // Origem única configurada: o header vem fixo com a PWA e o navegador barra qualquer outra.
        $header = $this->withHeaders(['Origin' => 'https://malicioso.test'])
            ->postJson('/api/student/auth/lookup', ['phone' => '1'])
            ->headers->get('Access-Control-Allow-Origin');
        $this->assertNotSame('https://malicioso.test', $header);
        $this->assertNotSame('*', $header);
    }
}
