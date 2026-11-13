<?php

namespace App\Http\Requests\Admin;

use App\Enums\BillingCycle;
use App\Enums\PlanTier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Criar academia (com dono) ou editar a assinatura dela no painel de admin. */
class AcademyBillingRequest extends FormRequest
{
    public function rules(): array
    {
        // Na edição, nome e dono não mudam (o formulário manda vazios).
        $creating = $this->route('academy') === null ? 'required' : 'nullable';

        return [
            'name' => [$creating, 'string', 'max:120'],
            'owner_email' => [$creating, 'email', 'max:255'],
            'owner_name' => ['nullable', 'string', 'max:120'],
            'plan_tier' => ['required', Rule::enum(PlanTier::class)],
            'billing_cycle' => ['required', Rule::enum(BillingCycle::class)],
            'is_founder' => ['required', 'boolean'],
            'founder_since' => ['nullable', 'date'],
            'trial_ends_at' => ['nullable', 'date'],
        ];
    }

    /** @return array{plan_tier: string, billing_cycle: string, is_founder: bool, founder_since: string|null, trial_ends_at: string|null} */
    public function billing(): array
    {
        return [
            'plan_tier' => $this->validated('plan_tier'),
            'billing_cycle' => $this->validated('billing_cycle'),
            'is_founder' => $this->boolean('is_founder'),
            'founder_since' => $this->validated('founder_since'),
            'trial_ends_at' => $this->validated('trial_ends_at'),
        ];
    }
}
