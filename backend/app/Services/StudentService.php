<?php

namespace App\Services;

use App\Enums\StudentStatus;
use App\Models\Student;
use App\Repositories\Contracts\StudentRepository;
use App\Support\PhoneNumber;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StudentService
{
    public function __construct(private readonly StudentRepository $students) {}

    /** @param array{name: string, phone: string} $data */
    public function create(array $data): Student
    {
        $phone = PhoneNumber::parse($data['phone']);
        $this->ensurePhoneIsFree($phone);

        $student = new Student([
            'name' => trim($data['name']),
            'phone' => $phone,
            'status' => StudentStatus::Active,
        ]);
        $this->openFirstAccessWindow($student);

        return $this->students->save($student);
    }

    /** @param array{name: string, phone: string} $data */
    public function update(Student $student, array $data): Student
    {
        $phone = PhoneNumber::parse($data['phone']);
        $this->ensurePhoneIsFree($phone, $student);

        $phoneChanged = ! $student->phone?->equals($phone);
        $student->fill(['name' => trim($data['name']), 'phone' => $phone]);

        return DB::transaction(function () use ($student, $phoneChanged) {
            // Telefone novo = outra pessoa pode estar com o número antigo: derruba as sessões.
            if ($phoneChanged) {
                $student->tokens()->delete();
            }

            return $this->students->save($student);
        });
    }

    public function setActive(Student $student, bool $active): Student
    {
        $student->status = $active ? StudentStatus::Active : StudentStatus::Inactive;

        return DB::transaction(function () use ($student, $active) {
            if (! $active) {
                $student->tokens()->delete();
            }

            return $this->students->save($student);
        });
    }

    /** Apaga o PIN e as sessões; o aluno cria um PIN novo dentro da janela de primeiro acesso. */
    public function releaseFirstAccess(Student $student): Student
    {
        $student->forceFill(['pin_hash' => null, 'pin_set_at' => null]);
        $this->openFirstAccessWindow($student);

        return DB::transaction(function () use ($student) {
            $student->tokens()->delete();

            return $this->students->save($student);
        });
    }

    /** LGPD: remove dados pessoais e mantém o histórico de treinos sem identificação. */
    public function anonymize(Student $student): Student
    {
        $student->forceFill([
            'name' => 'Aluno removido',
            'phone' => null,
            'status' => StudentStatus::Inactive,
            'pin_hash' => null,
            'pin_set_at' => null,
            'first_access_until' => null,
            'anonymized_at' => now(),
        ]);

        return DB::transaction(function () use ($student) {
            $student->tokens()->delete();
            $student->assessments()->delete();

            return $this->students->save($student);
        });
    }

    private function openFirstAccessWindow(Student $student): void
    {
        $student->forceFill([
            'first_access_until' => now()->addHours(config('treino.student.first_access_hours')),
            'failed_pin_attempts' => 0,
            'locked_until' => null,
        ]);
    }

    private function ensurePhoneIsFree(PhoneNumber $phone, ?Student $except = null): void
    {
        $existing = $this->students->findByPhone($phone);

        if ($existing !== null && $existing->id !== $except?->id) {
            throw ValidationException::withMessages([
                'phone' => "Esse celular já está cadastrado para {$existing->name}.",
            ]);
        }
    }
}
