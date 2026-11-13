<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Preço de fundador: perde quem cancelou ou está inadimplente há mais de 30 dias.
Schedule::command('academy:review-founders')->dailyAt('04:00');
