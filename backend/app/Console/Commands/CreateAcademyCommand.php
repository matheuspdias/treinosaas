<?php

namespace App\Console\Commands;

use App\Enums\BillingCycle;
use App\Enums\PlanTier;
use App\Models\User;
use App\Services\AcademyBillingService;
use Illuminate\Console\Command;

/** Não há cadastro público: academias novas entram por aqui. */
class CreateAcademyCommand extends Command
{
    protected $signature = 'academy:create
        {name : Nome da academia}
        {--owner-email= : E-mail do dono}
        {--owner-name= : Nome do dono (se o usuário ainda não existir)}';

    protected $description = 'Cria uma academia e o usuário dono dela';

    public function handle(AcademyBillingService $service): int
    {
        $email = $this->option('owner-email') ?? $this->ask('E-mail do dono');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('E-mail inválido.');

            return self::FAILURE;
        }

        $name = User::query()->where('email', $email)->exists()
            ? null
            : ($this->option('owner-name') ?? $this->ask('Nome do dono'));

        // Plano e fundador se ajustam depois no /admin; começa no Essencial com o teste grátis.
        ['academy' => $academy, 'owner' => $owner, 'password' => $password] = $service->create(
            $this->argument('name'),
            $email,
            $name,
            [
                'plan_tier' => PlanTier::Essencial->value,
                'billing_cycle' => BillingCycle::Monthly->value,
                'is_founder' => false,
                'trial_ends_at' => today()->addDays((int) config('pricing.trial_days'))->toDateString(),
            ],
        );

        $this->info("Academia \"{$academy->name}\" criada ({$academy->slug}).");
        $this->line("Dono: {$owner->email}");

        if ($password !== null) {
            $this->warn("Senha provisória: {$password}");
            $this->line('Peça para o dono trocar em Configurações → Senha no primeiro acesso.');
        }

        return self::SUCCESS;
    }
}
