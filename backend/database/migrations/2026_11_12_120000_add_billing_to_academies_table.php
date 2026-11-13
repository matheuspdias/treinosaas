<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Assinatura da academia (preços em config/pricing.php).
        Schema::table('academies', function (Blueprint $table) {
            $table->string('plan_tier', 20)->default('essencial')->after('timezone');
            $table->string('billing_cycle', 10)->default('monthly')->after('plan_tier');
            $table->boolean('is_founder')->default(false)->after('billing_cycle');
            $table->date('founder_since')->nullable()->after('is_founder');
            $table->date('trial_ends_at')->nullable()->after('founder_since');

            $table->index('is_founder');
        });

        // Dono do TreinoBox: vê e edita todas as academias em /admin.
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_super_admin')->default(false)->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_super_admin');
        });

        Schema::table('academies', function (Blueprint $table) {
            $table->dropIndex(['is_founder']);
            $table->dropColumn(['plan_tier', 'billing_cycle', 'is_founder', 'founder_since', 'trial_ends_at']);
        });
    }
};
