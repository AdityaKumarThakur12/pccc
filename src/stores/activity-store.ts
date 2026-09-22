import { create } from 'zustand';
import type { ActivityEntry, Task, Project } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ActivityState {
  activities: ActivityEntry[];
  addActivity: (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  addActivity: (entry) =>
    set((s) => ({
      activities: [
        { ...entry, id: generateId(), timestamp: Date.now() },
        ...s.activities,
      ].slice(0, 500), // Keep last 500
    })),
  clearActivities: () => set({ activities: [] }),
}));

interface TaskState {
  tasks: Task[];
  activeTaskId: string | null;
  createTask: (title: string, steps: { label: string }[]) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateStep: (taskId: string, stepId: string, status: Task['steps'][0]['status']) => void;
  setActiveTask: (id: string | null) => void;
  deleteTask: (id: string) => void;
  clearTasks: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  activeTaskId: null,
  createTask: (title, steps) => {
    const id = generateId();
    const task: Task = {
      id,
      title,
      steps: steps.map((s) => ({ id: generateId(), label: s.label, status: 'pending' as const })),
      status: 'in_progress',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((s) => ({ tasks: [task, ...s.tasks], activeTaskId: id }));
    return id;
  },
  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
      ),
    })),
  updateStep: (taskId, stepId, status) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              steps: t.steps.map((step) =>
                step.id === stepId ? { ...step, status } : step
              ),
              updatedAt: Date.now(),
            }
          : t
      ),
    })),
  setActiveTask: (id) => set({ activeTaskId: id }),
  deleteTask: (id) =>
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
    })),
  clearTasks: () => set({ tasks: [], activeTaskId: null }),
}));

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  addProject: (project: Omit<Project, 'id'>) => void;
  setActiveProject: (project: Project | null) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,
  addProject: (project) =>
    set((s) => {
      const fullProject: Project = { ...project, id: generateId() };
      return {
        projects: [
          fullProject,
          ...s.projects.filter((p) => p.path !== project.path),
        ],
        activeProject: fullProject,
      };
    }),
  setActiveProject: (project) => set({ activeProject: project }),
  removeProject: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      activeProject: s.activeProject?.id === id ? null : s.activeProject,
    })),
  updateProject: (id, updates) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
}));
