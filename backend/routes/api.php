<?php

use App\Http\Controllers\Api\Student\AuthController;
use App\Http\Controllers\Api\Student\FeedController;
use App\Http\Controllers\Api\Student\MeController;
use App\Http\Controllers\Api\Student\ProgramController;
use App\Http\Controllers\Api\Student\WorkoutController;
use Illuminate\Support\Facades\Route;

// API do app do aluno (PWA). Autenticação por token do aparelho (Sanctum); JSON em camelCase.
Route::prefix('student')->name('api.student.')->group(function () {
    Route::middleware('throttle:student-lookup')->post('auth/lookup', [AuthController::class, 'lookup'])->name('lookup');

    Route::middleware('throttle:student-login')->group(function () {
        Route::post('auth/first-access', [AuthController::class, 'firstAccess'])->name('first-access');
        Route::post('auth/login', [AuthController::class, 'login'])->name('login');
    });

    Route::middleware(['student', 'throttle:student-api'])->group(function () {
        Route::get('me', MeController::class)->name('me');
        Route::get('programs', [ProgramController::class, 'index'])->name('programs');
        Route::post('programs/{program}/seen', [ProgramController::class, 'seen'])->name('programs.seen');
        Route::post('workouts', [WorkoutController::class, 'store'])->name('workouts');
        Route::get('notices', [FeedController::class, 'notices'])->name('notices');
        Route::get('assessments', [FeedController::class, 'assessments'])->name('assessments');
        Route::put('pin', [AuthController::class, 'changePin'])->middleware('throttle:student-login')->name('pin');
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('logout');
    });
});
