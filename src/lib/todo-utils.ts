export type Todo = {
  id: number;
  text: string;
  done: boolean;
};

export type Filter = "all" | "active" | "done";

export function addTodo(todos: Todo[], text: string): Todo[] {
  const trimmed = text.trim();
  if (!trimmed) return todos;
  return [...todos, { id: Date.now(), text: trimmed, done: false }];
}

export function toggleTodo(todos: Todo[], id: number): Todo[] {
  return todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}

export function removeTodo(todos: Todo[], id: number): Todo[] {
  return todos.filter((t) => t.id !== id);
}

export function clearDoneTodos(todos: Todo[]): Todo[] {
  return todos.filter((t) => !t.done);
}

export function filterTodos(todos: Todo[], filter: Filter): Todo[] {
  if (filter === "active") return todos.filter((t) => !t.done);
  if (filter === "done") return todos.filter((t) => t.done);
  return todos;
}

export function getActiveCount(todos: Todo[]): number {
  return todos.filter((t) => !t.done).length;
}

export function getDoneCount(todos: Todo[]): number {
  return todos.filter((t) => t.done).length;
}
