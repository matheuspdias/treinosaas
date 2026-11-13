<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/** Super admin = dono do TreinoBox (painel /admin). Não há tela para isso de propósito. */
class GrantSuperAdminCommand extends Command
{
    protected $signature = 'admin:grant
        {email : E-mail de um usuário que já existe}
        {--revoke : Tira o acesso}';

    protected $description = 'Dá (ou tira) acesso ao painel de super admin';

    public function handle(): int
    {
        $user = User::query()->where('email', $this->argument('email'))->first();

        if ($user === null) {
            $this->error('Usuário não encontrado. Crie antes (ex.: academy:create com o seu e-mail).');

            return self::FAILURE;
        }

        $user->forceFill(['is_super_admin' => ! $this->option('revoke')])->save();
        $this->info($this->option('revoke') ? "{$user->email} não é mais super admin." : "{$user->email} agora é super admin: /admin/academias");

        return self::SUCCESS;
    }
}
