<?php

namespace App\Http\Requests\Panel;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

class AppBrandingRequest extends FormRequest
{
    public function rules(): array
    {
        // O painel envia os dois ícones já recortados (512×512 PNG); aqui só confere.
        $icon = ['nullable', 'file', 'mimes:png', 'max:1024', 'dimensions:width=512,height=512'];

        return [
            'app_name' => ['nullable', 'string', 'max:30'],
            'brand_color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'icon' => [...$icon, 'required_with:maskable_icon'],
            'maskable_icon' => [...$icon, 'required_with:icon'],
            'remove_icon' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'brand_color.regex' => 'Escolha uma cor válida.',
            'icon.dimensions' => 'O ícone precisa ter 512×512 pixels.',
            'maskable_icon.dimensions' => 'O ícone precisa ter 512×512 pixels.',
        ];
    }

    /** @return array{appName: ?string, brandColor: ?string, icon: ?UploadedFile, maskableIcon: ?UploadedFile, removeIcon: bool} */
    public function payload(): array
    {
        return [
            'appName' => $this->validated('app_name'),
            'brandColor' => $this->validated('brand_color'),
            'icon' => $this->file('icon'),
            'maskableIcon' => $this->file('maskable_icon'),
            'removeIcon' => $this->boolean('remove_icon'),
        ];
    }
}
