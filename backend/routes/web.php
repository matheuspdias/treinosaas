<?php

use App\Http\Controllers\Panel\AppBrandingController;
use App\Http\Controllers\Panel\AssessmentController;
use App\Http\Controllers\Panel\CatalogController;
use App\Http\Controllers\Panel\DashboardController;
use App\Http\Controllers\Panel\NoticeController;
use App\Http\Controllers\Panel\ProgramController;
use App\Http\Controllers\Panel\StudentController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

// Painel da academia. `tenant` define a academia a partir do usuário (antes do route model
// binding, ver bootstrap/app.php); cada rota exige a permissão do papel (App\Enums\Ability).
Route::middleware(['auth', 'tenant'])->group(function () {
    Route::get('dashboard', DashboardController::class)->middleware('can:dashboard.view')->name('dashboard');

    Route::get('catalogo/exercicios.json', CatalogController::class)->name('catalog.exercises');

    Route::middleware('can:academy.manage')->group(function () {
        Route::get('settings/app', [AppBrandingController::class, 'edit'])->name('app-branding.edit');
        Route::post('settings/app', [AppBrandingController::class, 'update'])->name('app-branding.update');
    });

    Route::middleware('can:students.view')->group(function () {
        Route::get('alunos', [StudentController::class, 'index'])->name('students.index');
        Route::get('alunos/novo', [StudentController::class, 'create'])->middleware('can:students.manage')->name('students.create');
        Route::get('alunos/{student}', [StudentController::class, 'show'])->name('students.show');
    });

    Route::middleware('can:students.manage')->group(function () {
        Route::post('alunos', [StudentController::class, 'store'])->name('students.store');
        Route::get('alunos/{student}/editar', [StudentController::class, 'edit'])->name('students.edit');
        Route::put('alunos/{student}', [StudentController::class, 'update'])->name('students.update');
        Route::patch('alunos/{student}/situacao', [StudentController::class, 'status'])->name('students.status');
        Route::post('alunos/{student}/liberar-acesso', [StudentController::class, 'releaseAccess'])->name('students.release-access');
        Route::post('alunos/{student}/anonimizar', [StudentController::class, 'anonymize'])->name('students.anonymize');
    });

    Route::middleware('can:programs.manage')->group(function () {
        Route::get('treinos', [ProgramController::class, 'index'])->name('programs.index');
        Route::get('treinos/novo', [ProgramController::class, 'create'])->name('programs.create');
        Route::post('treinos', [ProgramController::class, 'store'])->name('programs.store');
        Route::get('treinos/{program}/editar', [ProgramController::class, 'edit'])->name('programs.edit');
        Route::put('treinos/{program}', [ProgramController::class, 'update'])->name('programs.update');
        Route::post('treinos/{program}/aplicar', [ProgramController::class, 'assign'])->name('programs.assign');
        Route::post('treinos/{program}/salvar-como-modelo', [ProgramController::class, 'saveAsTemplate'])->name('programs.save-as-template');
        Route::post('treinos/{program}/arquivar', [ProgramController::class, 'archive'])->name('programs.archive');
        Route::get('alunos/{student}/treinos/novo', [ProgramController::class, 'createForStudent'])->name('students.programs.create');
        Route::post('alunos/{student}/treinos', [ProgramController::class, 'storeForStudent'])->name('students.programs.store');
    });

    Route::middleware('can:assessments.manage')->scopeBindings()->group(function () {
        Route::post('alunos/{student}/avaliacoes', [AssessmentController::class, 'store'])->name('students.assessments.store');
        Route::put('alunos/{student}/avaliacoes/{assessment}', [AssessmentController::class, 'update'])->name('students.assessments.update');
        Route::delete('alunos/{student}/avaliacoes/{assessment}', [AssessmentController::class, 'destroy'])->name('students.assessments.destroy');
    });

    Route::middleware('can:notices.manage')->group(function () {
        Route::get('avisos', [NoticeController::class, 'index'])->name('notices.index');
        Route::post('avisos', [NoticeController::class, 'store'])->name('notices.store');
        Route::put('avisos/{notice}', [NoticeController::class, 'update'])->name('notices.update');
        Route::delete('avisos/{notice}', [NoticeController::class, 'destroy'])->name('notices.destroy');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
