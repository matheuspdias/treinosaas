<?php

namespace App\Http\Controllers;

use App\Enums\PlanTier;
use App\Services\FounderProgramService;
use App\Support\Pricing\Pricing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/** Landing de venda para donos de academia e a política de privacidade. */
class LandingController extends Controller
{
    public function __construct(
        private readonly Pricing $pricing,
        private readonly FounderProgramService $founders,
    ) {}

    /** Quem já está logado vai direto para o painel. */
    public function home(Request $request): View|RedirectResponse
    {
        if ($request->user() !== null) {
            return redirect()->route('dashboard');
        }

        $shared = $this->shared();

        return view('landing', [
            ...$shared,
            'showPricing' => config('landing.show_pricing'),
            ...$this->pricingSection($shared['whatsapp']),
        ]);
    }

    /** Aberta para todos: o app do aluno e o rodapé apontam para ela. */
    public function privacy(): View
    {
        return view('privacidade', $this->shared());
    }

    /**
     * Cards de preço e vagas de fundador. Se a contagem de vagas falhar, o contador some e os
     * cards mostram só o preço cheio (nunca um número inventado).
     *
     * @return array{plans: list<array<string, mixed>>, founders: array{total: int, taken: int, remaining: int}|null, founderOpen: bool}
     */
    private function pricingSection(\Closure $whatsapp): array
    {
        try {
            $founders = $this->founders->spots();
        } catch (\Throwable $e) {
            report($e);
            $founders = null;
        }

        $founderOpen = $founders !== null && $founders['remaining'] > 0;

        $plans = array_map(function (PlanTier $tier) use ($whatsapp, $founderOpen) {
            $name = $this->pricing->name($tier);
            $max = $this->pricing->maxStudents($tier);

            return [
                'name' => $name,
                'limit' => $max === null ? 'Alunos ativos ilimitados' : "Até {$max} alunos ativos",
                'highlight' => $tier->value === config('pricing.highlight'),
                'monthly' => Pricing::brl($this->pricing->fullMonthly($tier)),
                'founderMonthly' => Pricing::brl($this->pricing->founderMonthly($tier)),
                'yearlyEquivalent' => Pricing::brl($this->pricing->yearlyMonthlyEquivalent($tier, false)),
                'founderYearlyEquivalent' => Pricing::brl($this->pricing->yearlyMonthlyEquivalent($tier, true)),
                'yearlyTotal' => Pricing::brl($this->pricing->yearlyTotal($tier, $founderOpen)),
                'whatsapp' => $whatsapp('plano', ['plan' => $founderOpen ? "{$name} (preço de fundador)" : $name]),
            ];
        }, PlanTier::cases());

        return ['plans' => $plans, 'founders' => $founders, 'founderOpen' => $founderOpen];
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
