import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  addTodo,
  setTodoStatus,
  removeTodo,
  clearDoneTodos,
  filterTodos,
  getActiveCount,
  getDoneCount,
  updateTodoText,
  statusLabel,
  statusColor,
  isOverdue,
  formatDueDate,
  urgencyLabel,
  importanceLabel,
  urgencyColor,
  importanceColor,
  categorizeTodos,
  type Todo,
  type TodoStatus,
} from "./todo-utils";

// 테스트용 픽스처
function makeTodo(overrides: Partial<Todo> & { id: number; text: string }): Todo {
  return {
    status: "waiting",
    due_date: null,
    urgency: null,
    importance: null,
    ...overrides,
  };
}

const TODO_A = makeTodo({ id: 1, text: "운동하기", status: "waiting" });
const TODO_B = makeTodo({ id: 2, text: "독서하기", status: "done" });
const TODO_C = makeTodo({ id: 3, text: "코딩하기", status: "active" });

const SAMPLE: Todo[] = [TODO_A, TODO_B, TODO_C];

// ──────────────────────────────────────────────
// addTodo
// ──────────────────────────────────────────────
describe("addTodo", () => {
  it("새로운 할 일을 배열 끝에 추가한다", () => {
    const result = addTodo(SAMPLE, "새 항목");
    expect(result).toHaveLength(4);
    expect(result[3].text).toBe("새 항목");
    expect(result[3].status).toBe("waiting");
  });

  it("새로 추가된 항목은 숫자 id를 가진다", () => {
    const result = addTodo([], "할 일");
    expect(typeof result[0].id).toBe("number");
  });

  it("새로 추가된 항목의 초기 상태는 'waiting'이다", () => {
    const result = addTodo([], "할 일");
    expect(result[0].status).toBe("waiting");
  });

  it("빈 문자열은 추가하지 않는다", () => {
    const result = addTodo(SAMPLE, "");
    expect(result).toHaveLength(SAMPLE.length);
  });

  it("공백만 있는 문자열은 추가하지 않는다", () => {
    const result = addTodo(SAMPLE, "   ");
    expect(result).toHaveLength(SAMPLE.length);
  });

  it("앞뒤 공백을 제거하여 저장한다", () => {
    const result = addTodo([], "  할 일  ");
    expect(result[0].text).toBe("할 일");
  });

  it("원본 배열을 변경하지 않는다 (불변성)", () => {
    const original = [...SAMPLE];
    addTodo(SAMPLE, "변경 테스트");
    expect(SAMPLE).toEqual(original);
  });

  it("연속으로 추가한 항목들은 서로 다른 id를 가진다", () => {
    const first = addTodo([], "첫 번째");
    const second = addTodo(first, "두 번째");
    expect(second[0].id).not.toBe(second[1].id);
  });
});

// ──────────────────────────────────────────────
// setTodoStatus
// ──────────────────────────────────────────────
describe("setTodoStatus", () => {
  const STATUSES: TodoStatus[] = ["waiting", "active", "paused", "done"];

  it("각 상태 전이 4×4 케이스 모두 성공한다", () => {
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        const initial: Todo[] = [makeTodo({ id: 1, text: "t", status: from })];
        const result = setTodoStatus(initial, 1, to);
        expect(result[0].status).toBe(to);
      }
    }
  });

  it("대상 id 외의 항목은 변경하지 않는다", () => {
    const result = setTodoStatus(SAMPLE, TODO_A.id, "done");
    expect(result.find((t) => t.id === TODO_B.id)?.status).toBe(TODO_B.status);
    expect(result.find((t) => t.id === TODO_C.id)?.status).toBe(TODO_C.status);
  });

  it("존재하지 않는 id에 대해 배열을 그대로 반환한다", () => {
    const result = setTodoStatus(SAMPLE, 999, "done");
    expect(result).toEqual(SAMPLE);
  });

  it("원본 배열을 변경하지 않는다 (불변성)", () => {
    const original = structuredClone(SAMPLE);
    setTodoStatus(SAMPLE, TODO_A.id, "done");
    expect(SAMPLE).toEqual(original);
  });
});

// ──────────────────────────────────────────────
// removeTodo
// ──────────────────────────────────────────────
describe("removeTodo", () => {
  it("해당 id의 항목을 제거한다", () => {
    const result = removeTodo(SAMPLE, TODO_A.id);
    expect(result).toHaveLength(2);
    expect(result.find((t) => t.id === TODO_A.id)).toBeUndefined();
  });

  it("나머지 항목은 유지한다", () => {
    const result = removeTodo(SAMPLE, TODO_A.id);
    expect(result.find((t) => t.id === TODO_B.id)).toBeDefined();
    expect(result.find((t) => t.id === TODO_C.id)).toBeDefined();
  });

  it("존재하지 않는 id는 배열을 그대로 반환한다", () => {
    const result = removeTodo(SAMPLE, 999);
    expect(result).toHaveLength(SAMPLE.length);
  });

  it("빈 배열에서 제거를 시도해도 오류가 없다", () => {
    const result = removeTodo([], 1);
    expect(result).toEqual([]);
  });

  it("원본 배열을 변경하지 않는다 (불변성)", () => {
    const original = structuredClone(SAMPLE);
    removeTodo(SAMPLE, TODO_A.id);
    expect(SAMPLE).toEqual(original);
  });
});

// ──────────────────────────────────────────────
// clearDoneTodos
// ──────────────────────────────────────────────
describe("clearDoneTodos", () => {
  it("'done' 상태 항목을 모두 제거한다", () => {
    const result = clearDoneTodos(SAMPLE);
    expect(result.every((t) => t.status !== "done")).toBe(true);
  });

  it("'done'이 아닌 항목은 유지한다 (waiting/active/paused 모두)", () => {
    const mixed: Todo[] = [
      makeTodo({ id: 1, text: "a", status: "waiting" }),
      makeTodo({ id: 2, text: "b", status: "active" }),
      makeTodo({ id: 3, text: "c", status: "paused" }),
      makeTodo({ id: 4, text: "d", status: "done" }),
    ];
    const result = clearDoneTodos(mixed);
    expect(result).toHaveLength(3);
    expect(result.map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it("모두 done일 경우 빈 배열을 반환한다", () => {
    const allDone = SAMPLE.map((t) => ({ ...t, status: "done" as TodoStatus }));
    expect(clearDoneTodos(allDone)).toEqual([]);
  });

  it("done이 없으면 배열을 그대로 반환한다", () => {
    const noDone = SAMPLE.map((t) => ({ ...t, status: "active" as TodoStatus }));
    expect(clearDoneTodos(noDone)).toHaveLength(noDone.length);
  });

  it("원본 배열을 변경하지 않는다 (불변성)", () => {
    const original = structuredClone(SAMPLE);
    clearDoneTodos(SAMPLE);
    expect(SAMPLE).toEqual(original);
  });
});

// ──────────────────────────────────────────────
// filterTodos
// ──────────────────────────────────────────────
describe("filterTodos", () => {
  const MIXED: Todo[] = [
    makeTodo({ id: 1, text: "w", status: "waiting" }),
    makeTodo({ id: 2, text: "a", status: "active" }),
    makeTodo({ id: 3, text: "p", status: "paused" }),
    makeTodo({ id: 4, text: "d", status: "done" }),
    makeTodo({ id: 5, text: "w2", status: "waiting" }),
  ];

  it('"all" 필터는 전체 항목을 반환한다', () => {
    expect(filterTodos(MIXED, "all")).toHaveLength(MIXED.length);
  });

  it('"waiting" 필터는 대기 항목만 반환한다', () => {
    const result = filterTodos(MIXED, "waiting");
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.status === "waiting")).toBe(true);
  });

  it('"active" 필터는 진행 항목만 반환한다', () => {
    const result = filterTodos(MIXED, "active");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("active");
  });

  it('"paused" 필터는 일시중지 항목만 반환한다', () => {
    const result = filterTodos(MIXED, "paused");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("paused");
  });

  it('"done" 필터는 완료 항목만 반환한다', () => {
    const result = filterTodos(MIXED, "done");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("done");
  });

  it("빈 배열에서 필터링하면 빈 배열을 반환한다", () => {
    expect(filterTodos([], "active")).toEqual([]);
    expect(filterTodos([], "done")).toEqual([]);
    expect(filterTodos([], "all")).toEqual([]);
    expect(filterTodos([], "waiting")).toEqual([]);
    expect(filterTodos([], "paused")).toEqual([]);
  });

  it("결과 항목의 순서는 원본 배열 순서를 유지한다", () => {
    const result = filterTodos(MIXED, "all");
    expect(result.map((t) => t.id)).toEqual(MIXED.map((t) => t.id));
  });
});

// ──────────────────────────────────────────────
// getActiveCount / getDoneCount
// ──────────────────────────────────────────────
describe("getActiveCount", () => {
  it("'done'이 아닌 항목 수를 반환한다", () => {
    // SAMPLE: waiting, done, active → active(카운트) = 2
    expect(getActiveCount(SAMPLE)).toBe(2);
  });

  it("모두 done이면 0을 반환한다", () => {
    const allDone = SAMPLE.map((t) => ({ ...t, status: "done" as TodoStatus }));
    expect(getActiveCount(allDone)).toBe(0);
  });

  it("빈 배열이면 0을 반환한다", () => {
    expect(getActiveCount([])).toBe(0);
  });
});

describe("getDoneCount", () => {
  it("'done' 상태 항목 수를 반환한다", () => {
    expect(getDoneCount(SAMPLE)).toBe(1);
  });

  it("모두 done이 아니면 0을 반환한다", () => {
    const noDone = SAMPLE.map((t) => ({ ...t, status: "active" as TodoStatus }));
    expect(getDoneCount(noDone)).toBe(0);
  });

  it("빈 배열이면 0을 반환한다", () => {
    expect(getDoneCount([])).toBe(0);
  });
});

// ──────────────────────────────────────────────
// updateTodoText
// ──────────────────────────────────────────────
describe("updateTodoText", () => {
  it("해당 id의 텍스트를 새 텍스트로 변경한다", () => {
    const result = updateTodoText(SAMPLE, TODO_A.id, "수정된 텍스트");
    expect(result.find((t) => t.id === TODO_A.id)?.text).toBe("수정된 텍스트");
  });

  it("앞뒤 공백을 제거하여 저장한다", () => {
    const result = updateTodoText(SAMPLE, TODO_A.id, "  공백 제거  ");
    expect(result.find((t) => t.id === TODO_A.id)?.text).toBe("공백 제거");
  });

  it("빈 문자열이면 배열을 그대로 반환한다", () => {
    const result = updateTodoText(SAMPLE, TODO_A.id, "");
    expect(result).toEqual(SAMPLE);
  });

  it("공백만 있는 문자열이면 배열을 그대로 반환한다", () => {
    const result = updateTodoText(SAMPLE, TODO_A.id, "   ");
    expect(result).toEqual(SAMPLE);
  });

  it("대상 id 외의 항목은 변경하지 않는다", () => {
    const result = updateTodoText(SAMPLE, TODO_A.id, "변경");
    expect(result.find((t) => t.id === TODO_B.id)?.text).toBe(TODO_B.text);
    expect(result.find((t) => t.id === TODO_C.id)?.text).toBe(TODO_C.text);
  });

  it("존재하지 않는 id는 배열을 그대로 반환한다", () => {
    const result = updateTodoText(SAMPLE, 999, "변경");
    expect(result).toEqual(SAMPLE);
  });

  it("status는 변경하지 않는다", () => {
    const result = updateTodoText(SAMPLE, TODO_B.id, "수정");
    expect(result.find((t) => t.id === TODO_B.id)?.status).toBe("done");
  });

  it("원본 배열을 변경하지 않는다 (불변성)", () => {
    const original = structuredClone(SAMPLE);
    updateTodoText(SAMPLE, TODO_A.id, "변경");
    expect(SAMPLE).toEqual(original);
  });
});

// ──────────────────────────────────────────────
// statusLabel / statusColor
// ──────────────────────────────────────────────
describe("statusLabel", () => {
  it("waiting → '대기'", () => {
    expect(statusLabel("waiting")).toBe("대기");
  });
  it("active → '진행'", () => {
    expect(statusLabel("active")).toBe("진행");
  });
  it("paused → '중지'", () => {
    expect(statusLabel("paused")).toBe("중지");
  });
  it("done → '종료'", () => {
    expect(statusLabel("done")).toBe("종료");
  });
});

describe("statusColor", () => {
  it("waiting은 zinc 클래스를 반환한다", () => {
    expect(statusColor("waiting")).toBe("bg-zinc-100 text-zinc-600");
  });
  it("active는 blue 클래스를 반환한다", () => {
    expect(statusColor("active")).toBe("bg-blue-100 text-blue-700");
  });
  it("paused는 amber 클래스를 반환한다", () => {
    expect(statusColor("paused")).toBe("bg-amber-100 text-amber-700");
  });
  it("done은 green 클래스를 반환한다", () => {
    expect(statusColor("done")).toBe("bg-green-100 text-green-700");
  });
});

// ──────────────────────────────────────────────
// isOverdue
// ──────────────────────────────────────────────
describe("isOverdue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("null이면 false를 반환한다", () => {
    expect(isOverdue(null)).toBe(false);
  });

  it("오늘 날짜이면 false를 반환한다", () => {
    expect(isOverdue("2026-04-08")).toBe(false);
  });

  it("어제 날짜이면 true를 반환한다", () => {
    expect(isOverdue("2026-04-07")).toBe(true);
  });

  it("내일 날짜이면 false를 반환한다", () => {
    expect(isOverdue("2026-04-09")).toBe(false);
  });

  it("훨씬 이전 날짜이면 true를 반환한다", () => {
    expect(isOverdue("2025-01-01")).toBe(true);
  });
});

// ──────────────────────────────────────────────
// formatDueDate
// ──────────────────────────────────────────────
describe("formatDueDate", () => {
  it("null이면 빈 문자열을 반환한다", () => {
    expect(formatDueDate(null)).toBe("");
  });

  it("'YYYY-MM-DD' 형식을 'M월 D일'로 변환한다", () => {
    expect(formatDueDate("2026-04-08")).toBe("4월 8일");
  });

  it("앞자리 0을 제거한다 (01월 → 1월)", () => {
    expect(formatDueDate("2026-01-05")).toBe("1월 5일");
  });

  it("12월 31일을 올바르게 변환한다", () => {
    expect(formatDueDate("2026-12-31")).toBe("12월 31일");
  });
});

// ──────────────────────────────────────────────
// urgencyLabel / importanceLabel
// ──────────────────────────────────────────────
describe("urgencyLabel", () => {
  it("null이면 빈 문자열을 반환한다", () => {
    expect(urgencyLabel(null)).toBe("");
  });

  it("1은 '낮음'을 반환한다", () => {
    expect(urgencyLabel(1)).toBe("낮음");
  });

  it("2는 '보통'을 반환한다", () => {
    expect(urgencyLabel(2)).toBe("보통");
  });

  it("3은 '높음'을 반환한다", () => {
    expect(urgencyLabel(3)).toBe("높음");
  });
});

describe("importanceLabel", () => {
  it("null이면 빈 문자열을 반환한다", () => {
    expect(importanceLabel(null)).toBe("");
  });

  it("1은 '낮음'을 반환한다", () => {
    expect(importanceLabel(1)).toBe("낮음");
  });

  it("2는 '보통'을 반환한다", () => {
    expect(importanceLabel(2)).toBe("보통");
  });

  it("3은 '높음'을 반환한다", () => {
    expect(importanceLabel(3)).toBe("높음");
  });
});

// ──────────────────────────────────────────────
// urgencyColor / importanceColor
// ──────────────────────────────────────────────
describe("urgencyColor", () => {
  it("null이면 빈 문자열을 반환한다", () => {
    expect(urgencyColor(null)).toBe("");
  });

  it("1(낮음)은 green 클래스를 반환한다", () => {
    expect(urgencyColor(1)).toContain("green");
  });

  it("2(보통)은 yellow 클래스를 반환한다", () => {
    expect(urgencyColor(2)).toContain("yellow");
  });

  it("3(높음)은 red 클래스를 반환한다", () => {
    expect(urgencyColor(3)).toContain("red");
  });
});

describe("importanceColor", () => {
  it("null이면 빈 문자열을 반환한다", () => {
    expect(importanceColor(null)).toBe("");
  });

  it("1(낮음)은 gray 클래스를 반환한다", () => {
    expect(importanceColor(1)).toContain("gray");
  });

  it("2(보통)은 blue 클래스를 반환한다", () => {
    expect(importanceColor(2)).toContain("blue");
  });

  it("3(높음)은 purple 클래스를 반환한다", () => {
    expect(importanceColor(3)).toContain("purple");
  });
});

// ──────────────────────────────────────────────
// getActiveCount + getDoneCount 관계
// ──────────────────────────────────────────────
describe("getActiveCount + getDoneCount", () => {
  it("active + done 합계는 항상 전체 개수와 같다", () => {
    expect(getActiveCount(SAMPLE) + getDoneCount(SAMPLE)).toBe(SAMPLE.length);
  });

  it("빈 배열에서 합계는 0이다", () => {
    expect(getActiveCount([]) + getDoneCount([])).toBe(0);
  });

  it("모두 done이면 active=0, done=전체", () => {
    const allDone = SAMPLE.map((t) => ({ ...t, status: "done" as TodoStatus }));
    expect(getActiveCount(allDone)).toBe(0);
    expect(getDoneCount(allDone)).toBe(allDone.length);
  });
});

describe("categorizeTodos — 아이젠하워 매트릭스 분류", () => {
  const make = (id: number, urgency: 1 | 2 | 3 | null, importance: 1 | 2 | 3 | null): Todo => ({
    id,
    text: `t${id}`,
    status: "waiting",
    due_date: null,
    urgency,
    importance,
  });

  it("빈 배열이면 모든 버킷이 비어 있다", () => {
    const r = categorizeTodos([]);
    expect(r).toEqual({ q1: [], q2: [], q3: [], q4: [], unclassified: [] });
  });

  it("urgency·importance가 모두 null이면 unclassified", () => {
    const t = make(1, null, null);
    const r = categorizeTodos([t]);
    expect(r.unclassified).toEqual([t]);
    expect(r.q1).toEqual([]);
  });

  it("q1: 긴급(>=2) + 중요(>=2)", () => {
    const high = make(1, 3, 3);
    const mid = make(2, 2, 2);
    const r = categorizeTodos([high, mid]);
    expect(r.q1).toEqual([high, mid]);
  });

  it("q2: 비긴급 + 중요 (urgency null 포함)", () => {
    const low = make(1, 1, 3);
    const nullU = make(2, null, 2);
    const r = categorizeTodos([low, nullU]);
    expect(r.q2).toEqual([low, nullU]);
  });

  it("q3: 긴급 + 비중요 (importance null 포함)", () => {
    const a = make(1, 3, 1);
    const b = make(2, 2, null);
    const r = categorizeTodos([a, b]);
    expect(r.q3).toEqual([a, b]);
  });

  it("q4: 비긴급 + 비중요 (단, 최소 하나는 non-null)", () => {
    const a = make(1, 1, 1);
    const b = make(2, 1, null);
    const c = make(3, null, 1);
    const r = categorizeTodos([a, b, c]);
    expect(r.q4).toEqual([a, b, c]);
  });

  it("여러 투두가 섞여도 각 버킷에 올바르게 분배된다", () => {
    const todos = [
      make(1, 3, 3),    // q1
      make(2, 1, 3),    // q2
      make(3, 3, 1),    // q3
      make(4, 1, 1),    // q4
      make(5, null, null), // unclassified
      make(6, 2, 2),    // q1
    ];
    const r = categorizeTodos(todos);
    expect(r.q1.map((t) => t.id)).toEqual([1, 6]);
    expect(r.q2.map((t) => t.id)).toEqual([2]);
    expect(r.q3.map((t) => t.id)).toEqual([3]);
    expect(r.q4.map((t) => t.id)).toEqual([4]);
    expect(r.unclassified.map((t) => t.id)).toEqual([5]);
  });

  it("입력 배열을 변형하지 않는다 (불변성)", () => {
    const todos = [make(1, 3, 3), make(2, null, null)];
    const snapshot = [...todos];
    categorizeTodos(todos);
    expect(todos).toEqual(snapshot);
  });
});
