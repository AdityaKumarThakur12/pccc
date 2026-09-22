import { Activity as ActivityIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useActivityStore } from '@/stores';
import type { ActivityEntry } from '@/types';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function isToday(ts: number): boolean {
  const d = new Date(ts);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex items-start gap-2 py-2 border-l-2 border-[var(--border)] pl-3 ml-1 hover:border-[var(--accent)] transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] font-mono">{formatTime(entry.timestamp)}</span>
          <span className={`text-xs font-medium ${entry.success ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
            {entry.success ? '✓' : '✗'}
          </span>
          <span className="text-xs text-[var(--text-primary)] font-medium">{entry.toolName}</span>
          <span className="text-xs text-[var(--text-muted)]">{entry.description}</span>
        </div>
        {entry.args != null && (
          <div className="mt-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Details
            </button>
            {expanded && (
              <pre className="mt-1 p-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-xs font-mono text-[var(--text-secondary)] overflow-x-auto max-h-32">
                {JSON.stringify({ args: entry.args, result: entry.result }, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivityView() {
  const { activities } = useActivityStore();

  const todayActivities = activities.filter((a) => isToday(a.timestamp));
  const olderActivities = activities.filter((a) => !isToday(a.timestamp));

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <ActivityIcon size={20} className="text-[var(--accent)]" />
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Activity</h2>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ActivityIcon size={32} className="text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-muted)]">
            No activity yet. Tool executions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {todayActivities.length > 0 && (
            <div>
              <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Today</h3>
              <div className="space-y-0">
                {todayActivities.map((entry: ActivityEntry) => (
                  <ActivityItem key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          )}
          {olderActivities.length > 0 && (
            <div>
              <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Earlier</h3>
              <div className="space-y-0">
                {olderActivities.map((entry: ActivityEntry) => (
                  <ActivityItem key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
