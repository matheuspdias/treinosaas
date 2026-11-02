import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export type Role = 'owner' | 'admin' | 'instructor';

export type Ability =
    | 'academy.manage'
    | 'dashboard.view'
    | 'students.view'
    | 'students.manage'
    | 'programs.manage'
    | 'training.view'
    | 'assessments.manage'
    | 'notices.manage';

export interface CurrentAcademy {
    id: string;
    name: string;
    role: Role | null;
    roleLabel: string | null;
    abilities: Ability[];
}

export interface SharedData {
    name: string;
    auth: Auth;
    academy: CurrentAcademy | null;
    flash: { success: string | null; error: string | null };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
}
