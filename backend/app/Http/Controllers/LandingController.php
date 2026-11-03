<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/** Landing de venda para donos de academia. Quem já está logado vai direto para o painel. */
class LandingController extends Controller
{
    public function __invoke(Request $request): View|RedirectResponse
    {
        if ($request->user() !== null) {
            return redirect()->route('dashboard');
        }

        $app = config('landing.app_name');
        $whatsapp = fn (string $message, array $replace = []) => $this->whatsappUrl(
            __(config("landing.whatsapp.messages.{$message}"), ['app' => $app, ...$replace]),
        );

        return view('landing', [
            'app' => $app,
            'whatsapp' => $whatsapp,
            'showPricing' => config('landing.show_pricing'),
            'plans' => config('landing.plans'),
        ]);
    }

    private function whatsappUrl(string $text): string
    {
        $number = config('landing.whatsapp.number');

        return 'https://wa.me/'.($number !== '' ? $number : '').'?text='.rawurlencode($text);
    }
}
