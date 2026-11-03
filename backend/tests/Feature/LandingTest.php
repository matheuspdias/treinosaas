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
}
