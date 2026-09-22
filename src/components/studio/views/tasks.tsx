import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { Check, Plus, Repeat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TaskSheet } from "@/components/studio/forms";
import { Badge, Empty, LoadState, PageHeader, Panel, useStudioData } from "@/components/studio/ui";
import { studio } from "@/lib/studio-api";
import { formatDate, formatDay, todayIso } from "@/lib/money";
import type { Task } from "@/lib/studio-types";
import { cn } from "@/lib/utils";

export function TaskRow({
  task,
  today,
  onChanged,
  onEdit,
  showClient = false,
}: {
  task: Task;
  today: string;
  onChanged: () => void;
  onEdit?: (task: Task) => void;
  showClient?: boolean;
}) {
  const [done, setDone] = useState(task.done);
  const overdue = !done && task.next_due !== null && task.next_due < today;

  async function toggle() {
    setDone((v) => !v);
    try {
      await studio("toggleTask", { id: task.id });
      onChanged();
    } catch (err) {
      setDone(task.done);
      toast.error(err instanceof Error ? err.message : "Could not update.");
    }
  }

  const meta = [
    showClient && (task.client_company || task.client_name),
    task.project_name,
    task.repeat === "monthly" && task.due_day ? `monthly on the ${formatDay(task.due_day)}` : null,
    task.repeat === "none" && task.due_on ? `due ${formatDate(task.due_on, false)}` : null,
  ].filter(Boolean);

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-pressed={done}
        aria-label={done ? `Mark “${task.title}” not done` : `Mark “${task.title}” done`}
        className={cn(
          "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none",
          done ? "border-accent bg-accent text-accent-fg" : "border-line-strong bg-surface hover:border-accent",
        )}
      >
        {done ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          disabled={!onEdit}
          onClick={() => onEdit?.(task)}
          className={cn(
            "block max-w-full truncate text-left text-sm font-medium",
            done && "text-subtle line-through",
            onEdit && "hover:text-accent",
          )}
        >
          {task.title}
        </button>
        {meta.length ? (
          <p className={cn("truncate text-xs", overdue ? "text-[#9b1c1c]" : "text-muted")}>
            {task.repeat === "monthly" ? <Repeat className="mr-1 inline size-3 align-[-1px]" /> : null}
            {meta.join(" · ")}
            {overdue ? " · overdue" : ""}
          </p>
        ) : null}
      </div>
      {task.priority === "high" && !done ? <Badge tone="high">High</Badge> : null}
    </li>
  );
}

const GROUPS: { key: string; title: string }[] = [
  { key: "overdue", title: "Overdue" },
  { key: "week", title: "Due in the next 7 days" },
  { key: "later", title: "Later" },
  { key: "someday", title: "No date" },
  { key: "done", title: "Done" },
];

function groupOf(task: Task, today: string, weekOut: string) {
  if (task.done) return "done";
  if (!task.next_due) return "someday";
  if (task.next_due < today) return "overdue";
  if (task.next_due <= weekOut) return "week";
  return "later";
}

export function TasksView() {
  const { value: tasks, error, reload } = useStudioData<Task[]>("listTasks");
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const today = todayIso();
  const weekOut = addDays(today, 7);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="One-off to-dos and the monthly care checklist. Monthly tasks reset on the 1st."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setShowDone((v) => !v)}>
              {showDone ? "Hide done" : "Show done"}
            </Button>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4" /> Task
            </Button>
          </>
        }
      />
      {!tasks ? (
        <LoadState error={error} />
      ) : tasks.length === 0 ? (
        <Panel>
          <Empty
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                Add the first task
              </Button>
            }
          >
            Add to-dos for projects, or monthly care jobs like “Swap seasonal photos” that come back every month.
          </Empty>
        </Panel>
      ) : (
        GROUPS.filter((g) => g.key !== "done" || showDone).map((group) => {
          const rows = tasks.filter((t) => groupOf(t, today, weekOut) === group.key);
          if (!rows.length) return null;
          return (
            <Panel key={group.key} title={`${group.title} (${rows.length})`}>
              <ul className="divide-y divide-line">
                {rows.map((task) => (
                  <TaskRow key={`${task.id}-${task.done}`} task={task} today={today} onChanged={reload} onEdit={setEditing} showClient />
                ))}
              </ul>
            </Panel>
          );
        })
      )}
      <TaskSheet open={creating} onClose={() => setCreating(false)} onSaved={reload} />
      <TaskSheet open={Boolean(editing)} record={editing} onClose={() => setEditing(null)} onSaved={reload} />
    </div>
  );
}

export function ClientLink({ id, children }: { id: number; children: ReactNode }) {
  return (
    <Link to="/studio" search={{ view: "clients", id }} className="hover:text-accent hover:underline">
      {children}
    </Link>
  );
}

/** YYYY-MM-DD plus n days, in local time. */
export function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + n);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
