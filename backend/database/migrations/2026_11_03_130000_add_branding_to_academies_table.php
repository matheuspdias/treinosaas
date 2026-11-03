<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Marca do app do aluno de cada academia: nome na tela inicial, cor e ícone. */
    public function up(): void
    {
        Schema::table('academies', function (Blueprint $table) {
            $table->string('app_name', 30)->nullable()->after('name');
            $table->string('brand_color', 7)->nullable()->after('app_name');
            $table->string('icon_path')->nullable()->after('brand_color');
            $table->string('maskable_icon_path')->nullable()->after('icon_path');
            $table->timestamp('branding_updated_at')->nullable()->after('maskable_icon_path');
        });
    }

    public function down(): void
    {
        Schema::table('academies', function (Blueprint $table) {
            $table->dropColumn(['app_name', 'brand_color', 'icon_path', 'maskable_icon_path', 'branding_updated_at']);
        });
    }
};
