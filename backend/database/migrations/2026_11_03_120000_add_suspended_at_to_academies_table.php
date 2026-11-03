<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Suspensão (ex.: mensalidade em atraso) é diferente de desativar: a academia continua
     * existindo, a equipe vê o aviso no painel e os alunos ficam bloqueados até reativar.
     */
    public function up(): void
    {
        Schema::table('academies', function (Blueprint $table) {
            $table->timestamp('suspended_at')->nullable()->after('deactivated_at');
            $table->string('suspension_reason', 200)->nullable()->after('suspended_at');
        });
    }

    public function down(): void
    {
        Schema::table('academies', function (Blueprint $table) {
            $table->dropColumn(['suspended_at', 'suspension_reason']);
        });
    }
};
