<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AcademyService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/** Não há cadastro público: academias novas entram por aqui. */
class CreateAcademyCommand extends Command
{
    protected $signature = 'academy:create
        {name : Nome da academia}
        {--owner-email= : E-mail do dono}
        {--owner-name= : Nome do dono (se o usuário ainda não existir)}';

    protected $description = 'Cria uma academia e o usuário dono dela';

    public function handle(AcademyService $service): int
    {
        $email = $this->option('owner-email') ?? $this->ask('E-mail do dono');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('E-mail inválido.');

            return self::FAILURE;
        }

        $password = null;
        $owner = User::query()->where('email', $email)->first();

        if ($owner === null) {
            $password = Str::password(14, symbols: false);
            $owner = User::query()->create([
                'name' => $this->option('owner-name') ?? $this->ask('Nome do dono'),
                'email' => $email,
                'password' => $password,
            ]);
            $owner->forceFill(['email_verified_at' => now()])->save();
        }

        $academy = $service->createWithOwner($this->argument('name'), $owner);

        $this->info("Academia \"{$academy->name}\" criada ({$academy->slug}).");
        $this->line("Dono: {$owner->email}");

        if ($password !== null) {
            $this->warn("Senha provisória: {$password}");
            $this->line('Peça para o dono trocar em Configurações → Senha no primeiro acesso.');
        }

        return self::SUCCESS;
    }
}
