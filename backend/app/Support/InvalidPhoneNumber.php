<?php

namespace App\Support;

use InvalidArgumentException;

class InvalidPhoneNumber extends InvalidArgumentException
{
    public function __construct()
    {
        parent::__construct('Informe um celular válido com DDD, por exemplo (11) 91234-5678.');
    }
}
