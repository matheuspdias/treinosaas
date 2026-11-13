<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BillingCycle;
use App\Enums\PlanTier;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AcademyBillingRequest;
use App\Models\Academy;
use App\Repositories\Contracts\AcademyRepository;
use App\Services\AcademyBillingService;
use App\Services\FounderProgramService;
use App\Support\Pricing\Pricing;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/** Painel do dono do TreinoBox: todas as academias e a assinatura de cada uma. */
class AcademyController extends Controller
{
    public function __construct(
        private readonly AcademyBillingService $billing,
        private readonly AcademyRepository $academies,
        private readonly FounderProgramService $founders,
        private readonly Pricing $pricing,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/academies/index', [
            'academies' => $this->academies->allWithActiveStudentCount()
                ->map(fn (Academy $a) => $this->summary($a, (int) $a->active_students_count))
                ->values(),
            'founders' => $this->founders->spots(),
        ]);
    }

    public function create(): Response
    {
        return $this->form(null);
    }

    public function store(AcademyBillingRequest $request): RedirectResponse
    {
        ['academy' => $academy, 'password' => $password] = $this->billing->create(
            $request->validated('name'),
            $request->validated('owner_email'),
            $request->validated('owner_name'),
            $request->billing(),
        );

        $message = "Academia criada ({$academy->slug}).";

        return to_route('admin.academies.index')->with('success', $password
            ? "{$message} Senha provisória do dono: {$password}"
            : "{$message} O dono já tinha conta e entra com a senha dele.");
    }

    public function edit(Academy $academy): Response
    {
        return $this->form($academy);
    }

    public function update(AcademyBillingRequest $request, Academy $academy): RedirectResponse
    {
        $this->billing->update($academy, $request->billing());

        return to_route('admin.academies.index')->with('success', "Assinatura da {$academy->name} atualizada.");
    }

    private function form(?Academy $academy): Response
    {
        return Inertia::render('admin/academies/form', [
            // Não pode se chamar `academy`: sobrescreveria a academia atual compartilhada com o layout.
            'target' => $academy ? $this->summary($academy, $this->academies->activeStudentCount($academy)) : null,
            'tiers' => array_map(fn (PlanTier $tier) => [
                'value' => $tier->value,
                'name' => $this->pricing->name($tier),
                'maxStudents' => $this->pricing->maxStudents($tier),
                'monthly' => $this->pricing->fullMonthly($tier),
                'founderMonthly' => $this->pricing->founderMonthly($tier),
            ], PlanTier::cases()),
            'annualMonthsPaid' => config('pricing.annual_months_paid'),
            'founders' => $this->founders->spots(),
            'suggestedTrialEndsAt' => today()->addDays((int) config('pricing.trial_days'))->toDateString(),
        ]);
    }

    /** @return array<string, mixed> */
    private function summary(Academy $academy, int $activeStudents): array
    {
        $subscription = $this->pricing->subscription($academy);
        $max = $this->pricing->maxStudents($academy->plan_tier);

        return [
            'id' => $academy->id,
            'name' => $academy->name,
            'slug' => $academy->slug,
            'planTier' => $academy->plan_tier->value,
            'planName' => $this->pricing->name($academy->plan_tier),
            'billingCycle' => $academy->billing_cycle->value,
            'isFounder' => $academy->is_founder,
            'founderSince' => $academy->founder_since?->toDateString(),
            'trialEndsAt' => $academy->trial_ends_at?->toDateString(),
            'inTrial' => $academy->inTrial(),
            'suspended' => $academy->isSuspended(),
            'activeStudents' => $activeStudents,
            'overLimit' => $max !== null && $activeStudents > $max,
            'suggestedTier' => $this->pricing->tierFor($activeStudents)->value,
            'amount' => $subscription['amount'],
            'amountLabel' => Pricing::brl($subscription['amount']).($academy->billing_cycle === BillingCycle::Yearly ? '/ano' : '/mês'),
        ];
    }
}
