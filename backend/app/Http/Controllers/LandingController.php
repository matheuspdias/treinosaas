<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/** Landing de venda para donos de academia e a política de privacidade. */
class LandingController extends Controller
{
    /** Quem já está logado vai direto para o painel. */
    public function home(Request $request): View|RedirectResponse
    {
        if ($request->user() !== null) {
            return redirect()->route('dashboard');
        }

        return view('landing', [
            ...$this->shared(),
            'showPricing' => config('landing.show_pricing'),
            'plans' => config('landing.plans'),
        ]);
    }

    /** Aberta para todos: o app do aluno e o rodapé apontam para ela. */
    public function privacy(): View
    {
        return view('privacidade', $this->shared());
    }

    /** @return array{app: string, whatsapp: \Closure(string, array<string, string>=): string} */
    private function shared(): array
    {
        $app = config('landing.app_name');

        return [
            'app' => $app,
            'whatsapp' => fn (string $message, array $replace = []) => $this->whatsappUrl(
                __(config("landing.whatsapp.messages.{$message}"), ['app' => $app, ...$replace]),
            ),
        ];
    }

    private function whatsappUrl(string $text): string
    {
        $number = config('landing.whatsapp.number');

        return 'https://wa.me/'.($number !== '' ? $number : '').'?text='.rawurlencode($text);
    }
}
