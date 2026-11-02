<?php

namespace App\Http\Controllers\Panel;

use App\Enums\Ability;
use App\Enums\StudentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\StudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Repositories\Contracts\ProgramRepository;
use App\Repositories\Contracts\StudentRepository;
use App\Services\StudentProfileService;
use App\Services\StudentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function __construct(
        private readonly StudentService $service,
        private readonly StudentRepository $students,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('busca')) ?: null;
        $status = StudentStatus::tryFrom((string) $request->query('situacao', 'active'));

        return Inertia::render('students/index', [
            'students' => StudentResource::collection($this->students->paginate($search, $status)),
            'filters' => ['busca' => $search, 'situacao' => $status?->value ?? 'all'],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('students/form', ['student' => null]);
    }

    public function store(StudentRequest $request): RedirectResponse
    {
        $student = $this->service->create($request->validated());

        return to_route('students.show', $student)
            ->with('success', 'Aluno cadastrado. O primeiro acesso fica liberado por '.config('treino.student.first_access_hours').'h.');
    }

    public function show(Student $student, StudentProfileService $profile, ProgramRepository $programs): Response
    {
        $canSeeTraining = Gate::allows(Ability::ViewTraining->value);

        return Inertia::render('students/show', [
            'student' => StudentResource::make($student)->resolve(),
            'profile' => $canSeeTraining ? $profile->profile($student) : null,
            'templates' => Gate::allows(Ability::ManagePrograms->value)
                ? $programs->templates()->map->only(['id', 'name'])->values()
                : [],
            'firstAccessHours' => config('treino.student.first_access_hours'),
        ]);
    }

    public function edit(Student $student): Response
    {
        return Inertia::render('students/form', ['student' => StudentResource::make($student)->resolve()]);
    }

    public function update(StudentRequest $request, Student $student): RedirectResponse
    {
        $this->service->update($student, $request->validated());

        return to_route('students.show', $student)->with('success', 'Dados atualizados.');
    }

    public function status(Request $request, Student $student): RedirectResponse
    {
        $active = $request->validate(['active' => ['required', 'boolean']])['active'];
        $this->service->setActive($student, $active);

        return back()->with('success', $active ? 'Aluno reativado.' : 'Aluno inativado. O acesso ao app foi encerrado.');
    }

    public function releaseAccess(Student $student): RedirectResponse
    {
        $this->service->releaseFirstAccess($student);

        return back()->with('success', 'Primeiro acesso liberado. O aluno cria um PIN novo no app.');
    }

    public function anonymize(Request $request, Student $student): RedirectResponse
    {
        $request->validate(['confirm' => ['required', 'in:ANONIMIZAR']], ['confirm.in' => 'Digite ANONIMIZAR para confirmar.']);
        $this->service->anonymize($student);

        return to_route('students.index')->with('success', 'Dados pessoais removidos. O histórico de treinos foi mantido sem identificação.');
    }
}
