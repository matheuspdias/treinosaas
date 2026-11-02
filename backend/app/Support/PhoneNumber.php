<?php

namespace App\Support;

use JsonSerializable;
use Stringable;

/**
 * Celular brasileiro normalizado em E.164 (+55 DDD 9XXXX-XXXX).
 *
 * Aceita o que as pessoas costumam digitar: com ou sem máscara, +55/55, zero de operadora.
 * Só celulares (11 dígitos com o 9): é o que o aluno usa para entrar e, no futuro, receber código.
 */
final class PhoneNumber implements JsonSerializable, Stringable
{
    private const VALID_DDDS = [
        11, 12, 13, 14, 15, 16, 17, 18, 19,
        21, 22, 24, 27, 28,
        31, 32, 33, 34, 35, 37, 38,
        41, 42, 43, 44, 45, 46, 47, 48, 49,
        51, 53, 54, 55,
        61, 62, 63, 64, 65, 66, 67, 68, 69,
        71, 73, 74, 75, 77, 79,
        81, 82, 83, 84, 85, 86, 87, 88, 89,
        91, 92, 93, 94, 95, 96, 97, 98, 99,
    ];

    /** @param string $national 11 dígitos: DDD + número */
    private function __construct(private readonly string $national) {}

    /** @throws InvalidPhoneNumber */
    public static function parse(string $input): self
    {
        $digits = preg_replace('/\D+/', '', $input) ?? '';

        if (strlen($digits) === 13 && str_starts_with($digits, '55')) {
            $digits = substr($digits, 2);
        } elseif (strlen($digits) === 12 && str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        if (strlen($digits) !== 11
            || ! in_array((int) substr($digits, 0, 2), self::VALID_DDDS, true)
            || $digits[2] !== '9') {
            throw new InvalidPhoneNumber;
        }

        return new self($digits);
    }

    public static function tryParse(?string $input): ?self
    {
        if ($input === null) {
            return null;
        }

        try {
            return self::parse($input);
        } catch (InvalidPhoneNumber) {
            return null;
        }
    }

    public function e164(): string
    {
        return '+55'.$this->national;
    }

    /** (11) 91234-5678 */
    public function formatted(): string
    {
        return sprintf('(%s) %s-%s', $this->ddd(), substr($this->national, 2, 5), substr($this->national, 7));
    }

    /** (11) 9••••-5678: para listas, onde o número completo não é necessário (LGPD). */
    public function masked(): string
    {
        return sprintf('(%s) 9••••-%s', $this->ddd(), substr($this->national, 7));
    }

    public function ddd(): string
    {
        return substr($this->national, 0, 2);
    }

    public function equals(self $other): bool
    {
        return $this->national === $other->national;
    }

    public function __toString(): string
    {
        return $this->e164();
    }

    public function jsonSerialize(): string
    {
        return $this->e164();
    }
}
