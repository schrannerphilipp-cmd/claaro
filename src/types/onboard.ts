export type StepType = "checklist" | "video" | "quiz" | "document";
export type AssignmentStatus = "not_started" | "in_progress" | "completed";

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}
export interface ChecklistContent {
  items: ChecklistItem[];
}

export interface VideoContent {
  url: string;
  title: string;
  description: string;
  duration: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
export interface QuizContent {
  questions: QuizQuestion[];
}

export interface DocumentContent {
  fileUrl?: string;
  richText?: string;
  title: string;
}

export type StepContent = ChecklistContent | VideoContent | QuizContent | DocumentContent;

export interface OnboardStep {
  id: string;
  order: number;
  title: string;
  type: StepType;
  content: StepContent;
  isRequired: boolean;
  estimatedMinutes: number;
}

export interface OnboardTemplate {
  id: string;
  title: string;
  role: string;
  description: string;
  estimatedMinutes: number;
  steps: OnboardStep[];
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
}

export interface StepProgress {
  stepId: string;
  completedAt: string;
  quizScore?: number;
}

export interface OnboardAssignment {
  id: string;
  templateId: string;
  employeeId: string;
  employeeName: string;
  assignedAt: string;
  dueDate?: string;
  progress: StepProgress[];
  status: AssignmentStatus;
}
