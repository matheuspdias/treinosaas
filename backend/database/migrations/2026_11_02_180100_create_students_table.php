<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('academy_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            // E.164 (+5511912345678), normalizado por App\Support\PhoneNumber.
            $table->string('phone', 20)->nullable(); // null depois de anonimizado (LGPD)
            $table->string('status', 10)->default('active');
            $table->string('pin_hash')->nullable();
            $table->timestamp('pin_set_at')->nullable();
            // Até quando o aluno pode criar o PIN sem nova liberação do painel.
            $table->timestamp('first_access_until')->nullable();
            $table->unsignedSmallInteger('failed_pin_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('privacy_accepted_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('anonymized_at')->nullable();
            $table->timestamps();

            $table->unique(['academy_id', 'phone']);
            $table->index(['academy_id', 'status']);
            // Login procura o telefone em todas as academias.
            $table->index('phone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
