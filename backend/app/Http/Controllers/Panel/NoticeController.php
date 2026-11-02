<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\NoticeRequest;
use App\Http\Resources\NoticeResource;
use App\Models\Notice;
use App\Repositories\Contracts\NoticeRepository;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class NoticeController extends Controller
{
    public function __construct(private readonly NoticeRepository $notices) {}

    public function index(): Response
    {
        return Inertia::render('notices/index', [
            'notices' => NoticeResource::collection($this->notices->all())->resolve(),
        ]);
    }

    public function store(NoticeRequest $request): RedirectResponse
    {
        $this->notices->create($request->payload(), $request->user()->id);

        return back()->with('success', 'Aviso publicado no app.');
    }

    public function update(NoticeRequest $request, Notice $notice): RedirectResponse
    {
        $this->notices->update($notice, $request->payload());

        return back()->with('success', 'Aviso atualizado.');
    }

    public function destroy(Notice $notice): RedirectResponse
    {
        $this->notices->delete($notice);

        return back()->with('success', 'Aviso removido.');
    }
}
