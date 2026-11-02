<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/** Busca sem acento e sem diferenciar maiúsculas ("joao" encontra "João"). */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS unaccent');
        // Wrapper IMMUTABLE para poder ser usado em índice no futuro.
        DB::statement(<<<'SQL'
            CREATE OR REPLACE FUNCTION unaccent_lower(text) RETURNS text
            LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
            AS $$ SELECT lower(public.unaccent('public.unaccent'::regdictionary, $1)) $$
        SQL);
    }

    public function down(): void
    {
        DB::statement('DROP FUNCTION IF EXISTS unaccent_lower(text)');
    }
};
