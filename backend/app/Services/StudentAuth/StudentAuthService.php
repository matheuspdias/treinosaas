<?php

namespace App\Services\StudentAuth;

use App\Models\Student;
use App\Repositories\Contracts\StudentRepository;
use App\Support\PhoneNumber;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\NewAccessToken;

/**
 * Login do aluno: telefone + PIN. O PIN é criado no primeiro acesso, que só fica aberto
 * por algumas horas depois do cadastro (ou de "liberar primeiro acesso" no painel).
 */
class StudentAuthService
{
    public const NEXT_LOGIN = 'login';

    public const NEXT_FIRST_ACCESS = 'first_access';

    public const NEXT_BLOCKED = 'blocked';

    public const NEXT_NOT_FOUND = 'not_found';

    public function __construct(
        private readonly StudentRepository $students,
        private readonly SecondFactor $secondFactor,
    ) {}

    /**
     * Qual tela o app mostra a seguir. Com o mesmo telefone em mais de uma academia,
     * devolve a lista para o aluno escolher.
     *
     * @return array{next: string, academies: list<array{id: string, name: string, next: string}>}
     */
    public function lookup(string $phone): array
    {
        $candidates = $this->candidates($phone);
        $academies = $candidates->map(fn (Student $s) => [
            'id' => $s->academy_id,
            'name' => $s->academy->name,
            'next' => $this->nextStep($s),
        ])->values()->all();

        $next = match (true) {
            $candidates->isEmpty() => self::NEXT_NOT_FOUND,
            count($academies) === 1 => $academies[0]['next'],
            default => 'choose_academy',
        };

        return ['next' => $next, 'academies' => count($academies) > 1 ? $academies : []];
    }

    public function firstAccess(string $phone, ?string $academyId, string $pin, string $device): NewAccessToken
    {
        $student = $this->pick($phone, $academyId);

        if (! $student->canCreatePin()) {
            throw ValidationException::withMessages([
                'pin' => $student->hasPin()
                    ? 'Você já criou seu PIN. Entre com ele.'
                    : 'O prazo do primeiro acesso acabou. Peça para a academia liberar seu acesso.',
            ]);
        }

        $student->forceFill([
            'pin_hash' => Hash::make($pin),
            'pin_set_at' => now(),
            'first_access_until' => null,
            'privacy_accepted_at' => now(),
            'failed_pin_attempts' => 0,
            'locked_until' => null,
        ]);
        $this->students->save($student);

        return $this->issueToken($student, $device);
    }

    public function login(string $phone, ?string $academyId, string $pin, string $device): NewAccessToken
    {
        $student = $this->pick($phone, $academyId);

        if ($student->isLocked()) {
            throw ValidationException::withMessages([
                'pin' => 'Muitas tentativas. Tente de novo em '.$this->minutesLeft($student).' min ou peça ajuda na academia.',
            ]);
        }

        if (! $student->hasPin()) {
            throw ValidationException::withMessages(['pin' => 'Você ainda não criou seu PIN.']);
        }

        if (! $this->secondFactor->verify($student, $pin)) {
            $this->registerFailure($student);

            throw ValidationException::withMessages(['pin' => 'PIN incorreto.']);
        }

        $student->forceFill(['failed_pin_attempts' => 0, 'locked_until' => null]);
        $this->students->save($student);

        return $this->issueToken($student, $device);
    }

    public function changePin(Student $student, string $currentPin, string $newPin): void
    {
        if (! $this->secondFactor->verify($student, $currentPin)) {
            throw ValidationException::withMessages(['current_pin' => 'PIN atual incorreto.']);
        }

        $student->forceFill(['pin_hash' => Hash::make($newPin), 'pin_set_at' => now()]);
        $this->students->save($student);
    }

    private function issueToken(Student $student, string $device): NewAccessToken
    {
        return $student->createToken(
            mb_substr($device, 0, 100),
            ['student'],
            now()->addDays(config('treino.student.token_days')),
        );
    }

    private function registerFailure(Student $student): void
    {
        $attempts = $student->failed_pin_attempts + 1;

        if ($attempts >= config('treino.student.max_pin_attempts')) {
            $student->forceFill([
                'failed_pin_attempts' => 0,
                'locked_until' => now()->addMinutes(config('treino.student.lock_minutes')),
            ]);
        } else {
            $student->forceFill(['failed_pin_attempts' => $attempts]);
        }

        $this->students->save($student);
    }

    private function nextStep(Student $student): string
    {
        return match (true) {
            $student->hasPin() => self::NEXT_LOGIN,
            $student->canCreatePin() => self::NEXT_FIRST_ACCESS,
            default => self::NEXT_BLOCKED,
        };
    }

    /** @return Collection<int, Student> alunos ativos com esse telefone, em academias ativas */
    private function candidates(string $phone): Collection
    {
        $parsed = PhoneNumber::tryParse($phone);

        if ($parsed === null) {
            return collect();
        }

        return $this->students->findInAnyAcademyByPhone($parsed)
            ->filter(fn (Student $s) => $s->isActive() && $s->academy->isActive())
            ->values();
    }

    private function pick(string $phone, ?string $academyId): Student
    {
        $candidates = $this->candidates($phone);
        $student = $academyId !== null
            ? $candidates->firstWhere('academy_id', $academyId)
            : ($candidates->count() === 1 ? $candidates->first() : null);

        if ($student === null) {
            throw ValidationException::withMessages([
                'phone' => $candidates->count() > 1
                    ? 'Escolha a academia.'
                    : 'Não encontramos esse celular. Confira o número ou fale com a academia.',
            ]);
        }

        return $student;
    }

    private function minutesLeft(Student $student): int
    {
        return max(1, (int) ceil(now()->diffInSeconds($student->locked_until) / 60));
    }
}
