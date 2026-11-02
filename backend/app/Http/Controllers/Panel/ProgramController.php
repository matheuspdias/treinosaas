<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\AssignProgramRequest;
use App\Http\Requests\Panel\ProgramRequest;
use App\Http\Resources\ProgramResource;
use App\Models\Program;
use App\Models\Student;
use App\Repositories\Contracts\ProgramRepository;
use App\Repositories\Contracts\StudentRepository;
use App\Services\ProgramService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
    public function __construct(
        private readonly ProgramService $service,
        private readonly ProgramRepository $programs,
    ) {}

    /** Modelos da academia. */
    public function index(Request $request, StudentRepository $students): Response
    {
        $search = trim((string) $request->query('busca')) ?: null;

        return Inertia::render('programs/index', [
            'templates' => $this->programs->templates($search)->map(fn (Program $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'notes' => $p->notes,
                'plansCount' => $p->plans_count,
                'updatedAt' => $p->updated_at->toIso8601String(),
            ])->values(),
            'students' => $students->allActive()->map->only(['id', 'name'])->values(),
            'filters' => ['busca' => $search],
        ]);
    }

    public function create(Request $request): Response
    {
        return $this->editor(null, null, $this->templateToCopy($request));
    }

    public function createForStudent(Request $request, Student $student): Response
    {
        return $this->editor(null, $student, $this->templateToCopy($request));
    }

    public function store(ProgramRequest $request): RedirectResponse
    {
        $this->service->createTemplate($request->validated(), $request->user());

        return to_route('programs.index')->with('success', 'Modelo criado.');
    }

    public function storeForStudent(ProgramRequest $request, Student $student): RedirectResponse
    {
        $this->service->createForStudent(
            $student,
            $request->validated(),
            $request->user(),
            $request->boolean('replace_current', true),
        );

        return to_route('students.show', $student)->with('success', 'Treino criado. O aluno vê no app na próxima vez que abrir.');
    }

    public function edit(Program $program): Response
    {
        return $this->editor($program, $program->student, null);
    }

    public function update(ProgramRequest $request, Program $program): RedirectResponse
    {
        $this->service->update($program, $request->validated());

        return $program->isTemplate()
            ? to_route('programs.index')->with('success', 'Modelo atualizado.')
            : to_route('students.show', $program->student_id)->with('success', 'Treino atualizado. O aluno vai ver o aviso no app.');
    }

    public function assign(AssignProgramRequest $request, Program $program): RedirectResponse
    {
        $count = $this->service->assignTemplate($program, $request->validated('student_ids'), $request->user(), [
            'starts_on' => $request->validated('starts_on'),
            'expires_on' => $request->validated('expires_on'),
            'replace_current' => $request->boolean('replace_current', true),
        ]);

        return back()->with('success', $count === 1 ? 'Treino enviado para 1 aluno.' : "Treino enviado para {$count} alunos.");
    }

    public function saveAsTemplate(Request $request, Program $program): RedirectResponse
    {
        $this->service->saveAsTemplate($program, $request->user());

        return back()->with('success', 'Salvo como modelo da academia.');
    }

    public function archive(Program $program): RedirectResponse
    {
        $this->service->archive($program);

        return back()->with('success', $program->isTemplate() ? 'Modelo arquivado.' : 'Treino encerrado. Ele sai do app do aluno.');
    }

    private function editor(?Program $program, ?Student $student, ?Program $copyFrom): Response
    {
        $source = $program ?? $copyFrom;
        $data = $source ? ProgramResource::make($source->load('plans.exercises', 'student'))->resolve() : null;

        if ($program === null && $data !== null) {
            // Cópia de modelo: tudo vira novo (sem ids), e o aluno é o do destino.
            $data['id'] = null;
            $data['isTemplate'] = $student === null;
            $data['plans'] = array_map(fn ($plan) => [
                ...$plan,
                'id' => null,
                'exercises' => array_map(fn ($e) => [...$e, 'id' => null], $plan['exercises']),
            ], $data['plans']);
        }

        return Inertia::render('programs/editor', [
            'program' => $data,
            'student' => $student ? ['id' => $student->id, 'name' => $student->name] : null,
            'copiedFrom' => $program === null ? $copyFrom?->name : null,
            'catalogUrl' => route('catalog.exercises'),
        ]);
    }

    private function templateToCopy(Request $request): ?Program
    {
        $id = $request->query('modelo');
        $template = is_string($id) ? $this->programs->find($id) : null;

        return $template?->isTemplate() ? $template : null;
    }
}
