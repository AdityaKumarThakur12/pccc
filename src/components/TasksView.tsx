import { ListTodo, Pause, Play, X, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useTaskStore } from '@/stores';
import type { Task, TaskStep } from '@/types';

function StepIcon({ status }: { status: TaskStep['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={16} className="text-[var(--success)]" />;
    case 'in_progress':
      return <Loader2 size={16} className="text-[var(--accent)] animate-spin-slow" />;
    case 'cancelled':
      return <X size={16} className="text-[var(--error)]" />;
    default:
      return <Circle size={16} className="text-[var(--text-muted)]" />;
  }
}

function TaskCard({ task }: { task: Task }) {
  const { updateTask, updateStep, deleteTask } = useTaskStore();

  return (
    <div className="glass-panel rounded-xl p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{task.title}</h3>
        <div className="flex items-center gap-1">
          {task.status === 'in_progress' && (
            <button
              onClick={() => updateTask(task.id, { status: 'paused' })}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Pause"
            >
              <Pause size={14} />
            </button>
          )}
          {task.status === 'paused' && (
            <button
              onClick={() => updateTask(task.id, { status: 'in_progress' })}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Continue"
            >
              <Play size={14} />
            </button>
          )}
          <button
            onClick={() => updateTask(task.id, { status: 'cancelled' })}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {task.steps.map((step: TaskStep) => (
          <div key={step.id} className="flex items-center gap-2">
            <StepIcon status={step.status} />
            <span
              className={`text-sm ${
                step.status === 'completed'
                  ? 'text-[var(--text-muted)] line-through'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {task.steps.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] italic">No steps yet</p>
      )}
    </div>
  );
}

export function TasksView() {
  const { tasks } = useTaskStore();

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <ListTodo size={20} className="text-[var(--accent)]" />
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Tasks</h2>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ListTodo size={32} className="text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-muted)]">
            No active tasks. When the AI works on multi-step tasks, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
