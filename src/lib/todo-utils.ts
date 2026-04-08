export type TodoStatus = "waiting" | "active" | "paused" | "done";

export type Todo = {
  id: number;
  text: string;
  status: TodoStatus;
  due_date: string | null;       // YYYY-MM-DD
  urgency: 1 | 2 | 3 | null;    // 1=낮음 2=보통 3=높음
  importance: 1 | 2 | 3 | null; // 1=낮음 2=보통 3=높음
};

export type Filter = "all" | "waiting" | "active" | "paused" | "done";

export function addTodo(todos: Todo[], text: string): Todo[] {
  const trimmed = text.trim();
  if (!trimmed) return todos;
  const id = todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : Date.now();
  return [
    ...todos,
    { id, text: trimmed, status: "waiting", due_date: null, urgency: null, importance: null },
  ];
}

export function setTodoStatus(todos: Todo[], id: number, status: TodoStatus): Todo[] {
  return todos.map((t) => (t.id === id ? { ...t, status } : t));
}

export function removeTodo(todos: Todo[], id: number): Todo[] {
  return todos.filter((t) => t.id !== id);
}

export function clearDoneTodos(todos: Todo[]): Todo[] {
  return todos.filter((t) => t.status !== "done");
}

export function filterTodos(todos: Todo[], filter: Filter): Todo[] {
  if (filter === "all") return todos;
  return todos.filter((t) => t.status === filter);
}

export function getActiveCount(todos: Todo[]): number {
  return todos.filter((t) => t.status !== "done").length;
}

export function getDoneCount(todos: Todo[]): number {
  return todos.filter((t) => t.status === "done").length;
}

export function updateTodoText(todos: Todo[], id: number, newText: string): Todo[] {
  const trimmed = newText.trim();
  if (!trimmed) return todos;
  return todos.map((t) => (t.id === id ? { ...t, text: trimmed } : t));
}

// ── 상태 유틸 ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<TodoStatus, string> = {
  waiting: "대기",
  active: "진행",
  paused: "중지",
  done: "종료",
};

const STATUS_COLOR: Record<TodoStatus, string> = {
  waiting: "bg-zinc-100 text-zinc-600",
  active: "bg-blue-100 text-blue-700",
  paused: "bg-amber-100 text-amber-700",
  done: "bg-green-100 text-green-700",
};

export function statusLabel(status: TodoStatus): string {
  return STATUS_LABEL[status];
}

export function statusColor(status: TodoStatus): string {
  return STATUS_COLOR[status];
}

// ── 마감일 유틸 ──────────────────────────────────────────────────────────────

/** 마감일이 오늘보다 이전이면 true. null이면 false. */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

/** 'YYYY-MM-DD' → 'M월 D일'. null이면 빈 문자열. */
export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "";
  const [, month, day] = dueDate.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

// ── 긴급도·중요도 유틸 ───────────────────────────────────────────────────────

const LEVEL_LABEL: Record<number, string> = { 1: "낮음", 2: "보통", 3: "높음" };

export function urgencyLabel(urgency: 1 | 2 | 3 | null): string {
  return urgency !== null ? LEVEL_LABEL[urgency] : "";
}

export function importanceLabel(importance: 1 | 2 | 3 | null): string {
  return importance !== null ? LEVEL_LABEL[importance] : "";
}

const URGENCY_COLOR: Record<number, string> = {
  1: "bg-green-100 text-green-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-red-100 text-red-700",
};

const IMPORTANCE_COLOR: Record<number, string> = {
  1: "bg-gray-100 text-gray-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-purple-100 text-purple-700",
};

/** 긴급도 Badge Tailwind 클래스. null이면 빈 문자열. */
export function urgencyColor(urgency: 1 | 2 | 3 | null): string {
  return urgency !== null ? URGENCY_COLOR[urgency] : "";
}

/** 중요도 Badge Tailwind 클래스. null이면 빈 문자열. */
export function importanceColor(importance: 1 | 2 | 3 | null): string {
  return importance !== null ? IMPORTANCE_COLOR[importance] : "";
}
