<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Academy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/** App próprio de cada academia: marca pública, manifest instalável e login restrito à academia do link. */
class AcademyAppTest extends TestCase
{
    use RefreshDatabase;

    /** PNG de verdade (o container não tem GD para UploadedFile::fake()->image()). */
    private function png(int $width = 512, int $height = 512): UploadedFile
    {
        $chunk = fn (string $type, string $data) => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
        $rows = str_repeat("\0".str_repeat("\x22\x88\xee", $width), $height);
        $bytes = "\x89PNG\r\n\x1a\n"
            .$chunk('IHDR', pack('NNCCCCC', $width, $height, 8, 2, 0, 0, 0))
            .$chunk('IDAT', gzcompress($rows))
            .$chunk('IEND', '');

        return UploadedFile::fake()->createWithContent('icon.png', $bytes);
    }

    public function test_marca_publica_so_com_o_necessario(): void
    {
        $academy = Academy::factory()->create(['name' => 'Academia Força Total', 'slug' => 'forca-total']);
        $academy->forceFill(['app_name' => 'Força', 'brand_color' => '#2563eb', 'suspended_at' => now(), 'suspension_reason' => 'atraso'])->save();

        $this->getJson('/api/academies/forca-total')
            ->assertOk()
            ->assertExactJson([
                'slug' => 'forca-total',
                'name' => 'Academia Força Total',
                'appName' => 'Força',
                'brandColor' => '#2563eb',
                'iconUrl' => null,
            ]);

        $this->getJson('/api/academies/nao-existe')->assertNotFound();
        $academy->forceFill(['deactivated_at' => now()])->save();
        $this->getJson('/api/academies/forca-total')->assertNotFound();
    }

    public function test_manifest_instalavel_no_endereco_da_academia(): void
    {
        config(['treino.pwa_url' => 'https://app.exemplo.com']);
        Academy::factory()->create(['name' => 'Academia Força Total', 'slug' => 'forca-total']);

        $response = $this->get('/api/academies/forca-total/manifest.webmanifest')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/manifest+json');

        $manifest = $response->json();
        $this->assertSame('https://app.exemplo.com/forca-total/', $manifest['id']);
        $this->assertSame('https://app.exemplo.com/forca-total/', $manifest['start_url']);
        $this->assertSame('https://app.exemplo.com/forca-total/', $manifest['scope']);
        $this->assertSame('Academia Força Total', $manifest['name']);
        $this->assertSame('Academia For', $manifest['short_name']);
        $this->assertSame('https://app.exemplo.com/pwa-512x512.png', $manifest['icons'][1]['src']);
    }

    public function test_dono_define_nome_cor_e_icone(): void
    {
        Storage::fake('public');
        $owner = $this->member(Role::Owner);
        $academy = $owner->currentAcademy;

        $this->actingAs($owner)->get('/settings/app')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('settings/app')
                ->where('branding.appUrl', config('treino.pwa_url').'/'.$academy->slug.'/'));

        $this->actingAs($owner)->post('/settings/app', [
            'app_name' => 'Força',
            'brand_color' => '#2563EB',
            'icon' => $this->png(),
            'maskable_icon' => $this->png(),
        ])->assertRedirect()->assertSessionHasNoErrors();

        $academy->refresh();
        $this->assertSame('Força', $academy->app_name);
        $this->assertSame('#2563eb', $academy->brand_color);
        Storage::disk('public')->assertExists([$academy->icon_path, $academy->maskable_icon_path]);
        $this->assertStringContainsString('?v=', $academy->iconUrl());

        $manifest = $this->get("/api/academies/{$academy->slug}/manifest.webmanifest")->json();
        $this->assertSame('#2563eb', $manifest['theme_color']);
        $this->assertSame(['any', 'maskable'], array_column($manifest['icons'], 'purpose'));

        // Remover apaga os arquivos e volta ao ícone padrão.
        $old = [$academy->icon_path, $academy->maskable_icon_path];
        $this->actingAs($owner)->post('/settings/app', ['app_name' => '', 'remove_icon' => true])->assertSessionHasNoErrors();
        Storage::disk('public')->assertMissing($old);
        $this->assertNull($academy->fresh()->icon_path);
        $this->assertNull($academy->fresh()->app_name);
    }

    public function test_valida_o_icone_e_a_cor(): void
    {
        Storage::fake('public');
        $owner = $this->member(Role::Owner);

        $this->actingAs($owner)->post('/settings/app', [
            'brand_color' => 'azul',
            'icon' => $this->png(100, 100),
            'maskable_icon' => $this->png(),
        ])->assertSessionHasErrors(['brand_color', 'icon']);

        $this->actingAs($owner)->post('/settings/app', ['icon' => $this->png()])
            ->assertSessionHasErrors('maskable_icon');
    }

    public function test_so_o_dono_mexe_no_app(): void
    {
        foreach ([Role::Admin, Role::Instructor] as $role) {
            $user = $this->member($role);
            $this->actingAs($user)->get('/settings/app')->assertForbidden();
            $this->actingAs($user)->post('/settings/app', ['app_name' => 'X'])->assertForbidden();
        }
    }

    public function test_app_de_uma_academia_nao_aceita_aluno_de_outra(): void
    {
        $a = Academy::factory()->create(['slug' => 'academia-a']);
        Academy::factory()->create(['slug' => 'academia-b']);
        $student = $this->student($a, ['phone' => '11987654321']);
        $student->forceFill(['pin_hash' => Hash::make('2580'), 'pin_set_at' => now()])->saveQuietly();

        $this->postJson('/api/student/auth/lookup', ['phone' => '11987654321', 'academy' => 'academia-b'])
            ->assertJson(['next' => 'not_found']);
        $this->postJson('/api/student/auth/login', ['phone' => '11987654321', 'pin' => '2580', 'academy' => 'academia-b'])
            ->assertJsonValidationErrors('phone');

        $this->postJson('/api/student/auth/lookup', ['phone' => '11987654321', 'academy' => 'academia-a'])
            ->assertJson(['next' => 'login']);
        $this->postJson('/api/student/auth/login', ['phone' => '11987654321', 'pin' => '2580', 'academy' => 'academia-a'])
            ->assertOk();
    }

    public function test_slug_nao_colide_com_arquivos_do_app(): void
    {
        $this->artisan('academy:create', ['name' => 'Assets', '--owner-email' => 'dono@assets.test', '--owner-name' => 'X'])
            ->assertSuccessful();

        $this->assertSame('assets-2', Academy::query()->sole()->slug);
    }
}
