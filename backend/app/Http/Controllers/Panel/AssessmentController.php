<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\AssessmentRequest;
use App\Models\Assessment;
use App\Models\Student;
use App\Repositories\Contracts\AssessmentRepository;
use Illuminate\Http\RedirectResponse;

class AssessmentController extends Controller
{
    public function __construct(private readonly AssessmentRepository $assessments) {}

    public function store(AssessmentRequest $request, Student $student): RedirectResponse
    {
        $this->assessments->create($student, $request->payload(), $request->user()->id);

        return back()->with('success', 'Avaliação registrada.');
    }

    public function update(AssessmentRequest $request, Student $student, Assessment $assessment): RedirectResponse
    {
        $this->assessments->update($assessment, $request->payload());

        return back()->with('success', 'Avaliação atualizada.');
    }

    public function destroy(Student $student, Assessment $assessment): RedirectResponse
    {
        $this->assessments->delete($assessment);

        return back()->with('success', 'Avaliação excluída.');
    }
}
