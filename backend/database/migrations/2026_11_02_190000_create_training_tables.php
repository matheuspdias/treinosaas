<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Programa = "treino" da academia (conjunto de fichas A, B, C...).
        // Sem aluno = modelo reutilizável; com aluno = treino dedicado (cópia ajustável).
        Schema::create('programs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('academy_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('student_id')->nullable()->constrained()->cascadeOnDelete();
            $table->uuid('template_id')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->text('notes')->nullable();
            $table->date('starts_on')->nullable();
            $table->date('expires_on')->nullable();
            // Aluno abriu o treino novo no app (alimenta o aviso "seu instrutor tem um treino novo").
            $table->timestamp('seen_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['academy_id', 'student_id', 'archived_at']);
            $table->index(['academy_id', 'expires_on']);
        });

        // Auto-referência: a chave primária precisa existir antes.
        Schema::table('programs', function (Blueprint $table) {
            $table->foreign('template_id')->references('id')->on('programs')->nullOnDelete();
        });

        Schema::create('program_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('academy_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('program_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('color', 10)->default('lime');
            $table->unsignedSmallInteger('position');
            $table->timestamps();

            $table->index(['program_id', 'position']);
        });

        Schema::create('program_exercises', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('academy_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('program_plan_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('exercise_source', 20)->default('catalog');
            $table->string('exercise_id');
            // Nome no momento da prescrição: o treino não muda se o catálogo mudar.
            $table->string('exercise_name');
            $table->unsignedSmallInteger('sets');
            $table->unsignedSmallInteger('rep_min');
            $table->unsignedSmallInteger('rep_max');
            $table->decimal('load_kg', 6, 2)->default(0);
            $table->unsignedSmallInteger('rest_sec');
            $table->decimal('increment_kg', 5, 2)->default(2.5);
            // Observação do professor (postura, cadência...).
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['program_plan_id', 'position']);
        });

        // Treino realizado, enviado pelo app. O id vem do aparelho (idempotente).
        Schema::create('workout_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('academy_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('program_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('program_plan_id')->nullable()->constrained()->nullOnDelete();
            $table->string('plan_name');
            $table->timestamp('started_at');
            $table->timestamp('finished_at');
            $table->unsignedInteger('duration_sec');
            $table->decimal('volume_kg', 10, 2)->default(0);
            $table->unsignedSmallInteger('sets_count')->default(0);
            $table->timestamps();

            $table->index(['academy_id', 'finished_at']);
            $table->index(['student_id', 'finished_at']);
        });

        Schema::create('workout_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('academy_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('workout_session_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained()->cascadeOnDelete();
            $table->uuid('program_exercise_id')->nullable();
            $table->string('exercise_source', 20);
            $table->string('exercise_id');
            $table->string('exercise_name');
            $table->unsignedSmallInteger('exercise_position');
            $table->unsignedSmallInteger('set_number');
            $table->decimal('weight_kg', 6, 2)->nullable();
            $table->unsignedSmallInteger('reps')->nullable();
            $table->boolean('is_warmup')->default(false);
            $table->timestamp('completed_at');

            $table->index(['student_id', 'exercise_source', 'exercise_id', 'completed_at']);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->timestamp('last_workout_at')->nullable()->after('last_seen_at');
            $table->index(['academy_id', 'last_workout_at']);
        });

        Schema::create('assessments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('academy_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('assessed_on');
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->decimal('height_cm', 5, 1)->nullable();
            $table->decimal('body_fat_pct', 4, 1)->nullable();
            // Mesmas chaves do app: waist, chest, hips, arm, thigh, calf (cm).
            $table->jsonb('measurements_cm')->default('{}');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'assessed_on']);
        });

        Schema::create('notices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('academy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 120);
            $table->text('body');
            $table->boolean('pinned')->default(false);
            $table->timestamp('published_at');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['academy_id', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notices');
        Schema::dropIfExists('assessments');
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['academy_id', 'last_workout_at']);
            $table->dropColumn('last_workout_at');
        });
        Schema::dropIfExists('workout_sets');
        Schema::dropIfExists('workout_sessions');
        Schema::dropIfExists('program_exercises');
        Schema::dropIfExists('program_plans');
        Schema::dropIfExists('programs');
    }
};
