<?php

namespace Tests\Feature;

use App\Enums\Role;
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

    public function test_planos_ficam_ocultos_por_padrao_sem_links_para_eles(): void
    {
        $html = $this->get('/')->assertOk()->getContent();

        $this->assertStringNotContainsString('id="planos"', $html);
        $this->assertStringNotContainsString('#planos', $html);
        $this->assertStringNotContainsString('R$ XX', $html);
    }

    public function test_planos_aparecem_quando_ligados(): void
    {
        config(['landing.show_pricing' => true]);

        $this->get('/')
            ->assertOk()
            ->assertSee('id="planos"', false)
            ->assertSee('href="#planos"', false)
            ->assertSee('R$ XX');
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

    public function test_faq_responde_quanto_custa_com_texto_da_config(): void
    {
        config([
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
