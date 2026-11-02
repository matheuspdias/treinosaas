<?php

namespace App\Enums;

/**
 * Permissões do painel. Cada uma vira um Gate com o mesmo nome (ver AppServiceProvider),
 * resolvido pelo papel do usuário na academia atual.
 */
enum Ability: string
{
    /** Dados da academia e equipe. */
    case ManageAcademy = 'academy.manage';
    case ViewDashboard = 'dashboard.view';
    case ViewStudents = 'students.view';
    /** Cadastrar, editar, ativar/inativar e liberar acesso de alunos. */
    case ManageStudents = 'students.manage';
    /** Criar programas, modelos e atribuir a alunos. */
    case ManagePrograms = 'programs.manage';
    /** Histórico de cargas, frequência e avaliações. */
    case ViewTraining = 'training.view';
    case ManageAssessments = 'assessments.manage';
    case ManageNotices = 'notices.manage';
}
