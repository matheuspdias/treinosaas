<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\DemoAcademyService;
use Illuminate\Console\Command;

/** Academia de demonstração para gravar vídeos, sem nenhum dado de pessoa real. */
class DemoAcademyCommand extends Command
{
    protected $signature = 'academy:demo
        {--email=demo@treinobox.com.br : Login do dono da demo no painel}';

    protected $description = 'Cria a academia de demonstração (ou gera senha nova, se ela já existir)';

    public function handle(DemoAcademyService $demo): int
    {
        $email = (string) $this->option('email');
        $owner = User::query()->where('email', $email)->first();

        if ($owner !== null) {
            $this->warn("{$email} já existe: a demo não foi recriada, só a senha e o PIN do aluno foram trocados.");
            $result = $demo->resetAccess($owner);
        } else {
            $result = $demo->create($email);
            $this->info("\"{$result['academy']->name}\" criada com 10 alunos fictícios, fichas e histórico de treinos.");
        }

        $phone = preg_replace('/^(\d{2})(\d{5})(\d{4})$/', '($1) $2-$3', $result['phone']);

        $this->newLine();
        $this->line('Painel: '.url('/login'));
        $this->line("  E-mail: {$email}");
        $this->line("  Senha:  {$result['password']}");
        $this->newLine();
        $this->line('App do aluno (Ana Souza): '.config('treino.pwa_url')."/{$result['academy']->slug}/");
        $this->line("  Celular: {$phone}");
        $this->line('  PIN:     '.DemoAcademyService::STUDENT_PIN);

        return self::SUCCESS;
    }
}
