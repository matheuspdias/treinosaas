<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Academy;
use App\Services\FounderProgramService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LandingTest extends TestCase
{
    use RefreshDatabase;

    public function test_visitante_ve_a_landing_com_seo_e_whatsapp(): void
    {
        config(['landing.app_name' => 'Ferro', 'landing.whatsapp.number' => '5511912345678']);

        $this->get('/')
            ->assertOk()
            ->assertSee('<title>Ferro: ficha de treino no celular para a sua academia</title>', false)
            ->assertSee('<meta name="description"', false)
            ->assertSee('property="og:image" content="'.asset('landing/og.jpg').'"', false)
            ->assertSee('https://wa.me/5511912345678?text='.rawurlencode('Olá! Tenho uma academia e quero conhecer o Ferro.'), false)
            ->assertSee('Chega de')
            // Risco decorativo escondido de leitor de tela.
            ->assertSee('<span class="risco" aria-hidden="true"></span>', false);
    }

    public function test_planos_aparecem_com_preco_de_fundador_e_vagas_reais(): void
    {
        config(['landing.app_name' => 'Ferro', 'landing.whatsapp.number' => '5511912345678']);
        Academy::factory()->count(3)->create(['is_founder' => true]);

        $this->get('/')
            ->assertOk()
            ->assertSee('id="planos"', false)
            ->assertSee('href="#planos"', false)
            ->assertSee('Planos simples, sem taxa de implantação.')
            ->assertSee('Programa Fundadores: restam 7 de 10 vagas')
            ->assertSee('aria-valuenow="3"', false)
            ->assertSee('<s>R$ 149/mês</s>', false)
            ->assertSee('R$ 79')
            ->assertSee('R$ 74,17')
            ->assertSee('Preço de fundador')
            ->assertSee('Recomendado')
            ->assertSee('Teste grátis de 14 dias')
            ->assertSee('Como funciona o preço de fundador')
            ->assertSee('https://wa.me/5511912345678?text='.rawurlencode('Oi! Vim pelo site do Ferro e quero agendar uma demonstração do plano Academia (preço de fundador).'), false);
    }

    public function test_vagas_esgotadas_mostram_so_o_preco_cheio(): void
    {
        config(['pricing.founder.spots_total' => 2]);
        Academy::factory()->count(2)->create(['is_founder' => true]);

        $html = $this->get('/')
            ->assertOk()
            ->assertSee('Vagas de fundador esgotadas')
            ->assertSee('R$ 149')
            ->getContent();

        $this->assertStringNotContainsString('Preço de fundador', $html);
        $this->assertStringNotContainsString('<s>', $html);
        $this->assertStringNotContainsString(rawurlencode('(preço de fundador)'), $html);
    }

    public function test_sem_a_contagem_de_vagas_o_contador_some_e_os_precos_ficam(): void
    {
        $this->mock(FounderProgramService::class)->shouldReceive('spots')->andThrow(new \RuntimeException('banco fora'));

        $html = $this->get('/')
            ->assertOk()
            ->assertSee('id="planos"', false)
            ->assertSee('R$ 89')
            ->getContent();

        $this->assertStringNotContainsString('Programa Fundadores', $html);
        $this->assertStringNotContainsString('Preço de fundador', $html);
    }

    public function test_planos_desligados_somem_junto_com_os_links(): void
    {
        config(['landing.show_pricing' => false]);

        $html = $this->get('/')->assertOk()->getContent();

        $this->assertStringNotContainsString('id="planos"', $html);
        $this->assertStringNotContainsString('#planos', $html);
    }

    public function test_sem_numero_configurado_o_whatsapp_abre_para_escolher_o_contato(): void
    {
        config(['landing.whatsapp.number' => '']);

        $this->get('/')->assertSee('https://wa.me/?text=', false);
    }

    public function test_quem_esta_logado_vai_para_o_painel(): void
    {
        $this->actingAs($this->member(Role::Owner))->get('/')->assertRedirect(route('dashboard'));
    }

    public function test_faq_responde_quanto_custa_pelos_planos(): void
    {
        $this->get('/')->assertSee('De R$ 89 a R$ 229 por mês');
    }

    public function test_faq_responde_quanto_custa_com_texto_da_config_sem_os_planos(): void
    {
        config([
            'landing.show_pricing' => false,
            'landing.app_name' => 'Ferro',
            'landing.whatsapp.number' => '5511912345678',
            'landing.pricing_answer' => 'Depende do número de alunos.',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertSee('Quanto custa?')
            ->assertSee('Depende do número de alunos.')
            ->assertSee('https://wa.me/5511912345678?text='.rawurlencode('Olá! Quero saber quanto custa o Ferro para a minha academia.'), false);
    }

    public function test_rodape_tem_email_de_contato_e_politica_de_privacidade(): void
    {
        config(['landing.contact_email' => 'oi@ferro.test']);

        $this->get('/')
            ->assertOk()
            ->assertSee('href="mailto:oi@ferro.test"', false)
            ->assertSee('href="'.route('privacy').'"', false);
    }

    public function test_secao_da_marca_mostra_a_tela_inicial_do_celular(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('aria-label="Tela inicial do celular do aluno com o app Academia Demo entre os outros apps"', false)
            ->assertSee(asset('landing/img/academia-demo.svg'), false);
    }

    public function test_politica_de_privacidade_aberta_para_todos(): void
    {
        config([
            'landing.app_name' => 'Ferro',
            'landing.contact_email' => 'oi@ferro.test',
            'landing.privacy.responsible' => 'Fulano de Tal',
        ]);

        $this->get('/privacidade')
            ->assertOk()
            ->assertSee('<title>Política de privacidade | Ferro</title>', false)
            ->assertSee('Fulano de Tal')
            ->assertSee('href="mailto:oi@ferro.test"', false)
            ->assertSee('Cada academia só vê os próprios alunos')
            ->assertSee('pedir a exclusão');

        // Logado também abre (o rodapé e o app do aluno apontam para ela).
        $this->actingAs($this->member())->get('/privacidade')->assertOk();
    }
}
