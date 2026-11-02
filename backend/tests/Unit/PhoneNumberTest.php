<?php

namespace Tests\Unit;

use App\Support\InvalidPhoneNumber;
use App\Support\PhoneNumber;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class PhoneNumberTest extends TestCase
{
    public static function validInputs(): array
    {
        return [
            ['11912345678'],
            ['(11) 91234-5678'],
            ['11 9 1234 5678'],
            ['+55 (11) 91234-5678'],
            ['5511912345678'],
            ['011912345678'],
        ];
    }

    public static function invalidInputs(): array
    {
        return [
            'vazio' => [''],
            'sem DDD' => ['912345678'],
            'fixo' => ['1132345678'],
            'sem o 9' => ['11812345678'],
            'DDD inexistente' => ['20912345678'],
            'DDD 10' => ['10912345678'],
            'dígitos a mais' => ['119123456789'],
        ];
    }

    #[DataProvider('validInputs')]
    public function test_normaliza_os_formatos_que_as_pessoas_digitam(string $input): void
    {
        $this->assertSame('+5511912345678', PhoneNumber::parse($input)->e164());
    }

    #[DataProvider('invalidInputs')]
    public function test_rejeita_numeros_invalidos(string $input): void
    {
        $this->expectException(InvalidPhoneNumber::class);

        PhoneNumber::parse($input);
    }

    public function test_formata_e_mascara(): void
    {
        $phone = PhoneNumber::parse('21987654321');

        $this->assertSame('(21) 98765-4321', $phone->formatted());
        $this->assertSame('(21) 9••••-4321', $phone->masked());
        $this->assertSame('21', $phone->ddd());
        $this->assertSame('+5521987654321', (string) $phone);
    }

    public function test_try_parse_devolve_null_em_vez_de_lancar(): void
    {
        $this->assertNull(PhoneNumber::tryParse('abc'));
        $this->assertNull(PhoneNumber::tryParse(null));
        $this->assertSame('+5511912345678', PhoneNumber::tryParse('11912345678')?->e164());
    }

    public function test_compara_numeros_iguais_em_formatos_diferentes(): void
    {
        $this->assertTrue(PhoneNumber::parse('(11) 91234-5678')->equals(PhoneNumber::parse('+5511912345678')));
    }
}
