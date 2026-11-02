<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('timezone')->default('America/Sao_Paulo');
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();
        });

        // Vínculo da equipe (dono, admin, instrutor) com a academia.
        Schema::create('academy_user', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('academy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20);
            $table->timestamps();

            $table->unique(['academy_id', 'user_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignUuid('current_academy_id')->nullable()->after('email')
                ->constrained('academies')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('current_academy_id');
        });
        Schema::dropIfExists('academy_user');
        Schema::dropIfExists('academies');
    }
};
