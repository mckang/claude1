import { describe, it, expect } from "vitest";
import {
  addTodo,
  toggleTodo,
  removeTodo,
  clearDoneTodos,
  filterTodos,
  getActiveCount,
  getDoneCount,
  type Todo,
} from "./todo-utils";

// 테스트용 픽스처
function makeTodo(overrides: Partial<Todo> & { id: number; text: string }): Todo {
  return { done: false, ...overrides };
}

const TODO_A = makeTodo({ id: 1, text: "운동하기" });
const TODO_B = makeTodo({ id: 2, text: "독서하기", done: true });
const TODO_C = makeTodo({ id: 3, text: "코딩하기" });

const SAMPLE: Todo[] = [TODO_A, TODO_B, TODO_C];

// ──────────────────────────────────────────────
// addTodo
// ──────────────────────────────────────────────
describe("addTodo", () => {
  it("새로운 할 일을 배열 끝에 추가한다", () => {
    const result = addTodo(SAMPLE, "새 항목");
    expect(result).toHaveLength(4);
    expect(result[3].text).toBe("새 항목");
    expect(result[3].done).toBe(false);
  });

  it("새로 추가된 항목은 숫자 id를 가진다", () => {
    const result = addTodo([], "할 일");
    expect(typeof result[0].id).toBe("number");
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
// toggleTodo
// ──────────────────────────────────────────────
describe("toggleTodo", () => {
  it("미완료 항목을 완료로 전환한다", () => {
    const result = toggleTodo(SAMPLE, TODO_A.id);
    expect(result.find((t) => t.id === TODO_A.id)?.done).toBe(true);
  });

  it("완료 항목을 미완료로 전환한다", () => {
    const result = toggleTodo(SAMPLE, TODO_B.id);
    expect(result.find((t) => t.id === TODO_B.id)?.done).toBe(false);
  });

  it("대상 id 외의 항목은 변경하지 않는다", () => {
    const result = toggleTodo(SAMPLE, TODO_A.id);
    expect(result.find((t) => t.id === TODO_B.id)?.done).toBe(TODO_B.done);
    expect(result.find((t) => t.id === TODO_C.id)?.done).toBe(TODO_C.done);
  });

  it("존재하지 않는 id에 대해 배열을 그대로 반환한다", () => {
    const result = toggleTodo(SAMPLE, 999);
    expect(result).toEqual(SAMPLE);
  });

  it("원본 배열을 변경하지 않는다 (불변성)", () => {
    const original = structuredClone(SAMPLE);
    toggleTodo(SAMPLE, TODO_A.id);
    expect(SAMPLE).toEqual(original);
  });

  it("같은 id를 두 번 토글하면 원래 상태로 돌아온다", () => {
    const once = toggleTodo(SAMPLE, TODO_A.id);
    const twice = toggleTodo(once, TODO_A.id);
    expect(twice.find((t) => t.id === TODO_A.id)?.done).toBe(TODO_A.done);
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
  it("완료된 항목을 모두 제거한다", () => {
    const result = clearDoneTodos(SAMPLE);
    expect(result.every((t) => !t.done)).toBe(true);
  });

  it("미완료 항목은 유지한다", () => {
    const result = clearDoneTodos(SAMPLE);
    expect(result.find((t) => t.id === TODO_A.id)).toBeDefined();
    expect(result.find((t) => t.id === TODO_C.id)).toBeDefined();
  });

  it("완료 항목만 있을 경우 빈 배열을 반환한다", () => {
    const allDone = SAMPLE.map((t) => ({ ...t, done: true }));
    expect(clearDoneTodos(allDone)).toEqual([]);
  });

  it("완료 항목이 없으면 배열을 그대로 반환한다", () => {
    const noDone = SAMPLE.map((t) => ({ ...t, done: false }));
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
  it('"all" 필터는 전체 항목을 반환한다', () => {
    expect(filterTodos(SAMPLE, "all")).toHaveLength(SAMPLE.length);
  });

  it('"active" 필터는 미완료 항목만 반환한다', () => {
    const result = filterTodos(SAMPLE, "active");
    expect(result.every((t) => !t.done)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('"done" 필터는 완료 항목만 반환한다', () => {
    const result = filterTodos(SAMPLE, "done");
    expect(result.every((t) => t.done)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it("빈 배열에서 필터링하면 빈 배열을 반환한다", () => {
    expect(filterTodos([], "active")).toEqual([]);
    expect(filterTodos([], "done")).toEqual([]);
    expect(filterTodos([], "all")).toEqual([]);
  });

  it("모두 미완료일 때 active는 전체, done은 빈 배열을 반환한다", () => {
    const allActive = SAMPLE.map((t) => ({ ...t, done: false }));
    expect(filterTodos(allActive, "active")).toHaveLength(allActive.length);
    expect(filterTodos(allActive, "done")).toHaveLength(0);
  });

  it("모두 완료일 때 done은 전체, active는 빈 배열을 반환한다", () => {
    const allDone = SAMPLE.map((t) => ({ ...t, done: true }));
    expect(filterTodos(allDone, "done")).toHaveLength(allDone.length);
    expect(filterTodos(allDone, "active")).toHaveLength(0);
  });

  it("결과 항목의 순서는 원본 배열 순서를 유지한다", () => {
    const result = filterTodos(SAMPLE, "all");
    expect(result.map((t) => t.id)).toEqual(SAMPLE.map((t) => t.id));
  });
});

// ──────────────────────────────────────────────
// getActiveCount / getDoneCount
// ──────────────────────────────────────────────
describe("getActiveCount", () => {
  it("미완료 항목 수를 반환한다", () => {
    expect(getActiveCount(SAMPLE)).toBe(2);
  });

  it("모두 완료이면 0을 반환한다", () => {
    const allDone = SAMPLE.map((t) => ({ ...t, done: true }));
    expect(getActiveCount(allDone)).toBe(0);
  });

  it("빈 배열이면 0을 반환한다", () => {
    expect(getActiveCount([])).toBe(0);
  });
});

describe("getDoneCount", () => {
  it("완료 항목 수를 반환한다", () => {
    expect(getDoneCount(SAMPLE)).toBe(1);
  });

  it("모두 미완료이면 0을 반환한다", () => {
    const noDone = SAMPLE.map((t) => ({ ...t, done: false }));
    expect(getDoneCount(noDone)).toBe(0);
  });

  it("빈 배열이면 0을 반환한다", () => {
    expect(getDoneCount([])).toBe(0);
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

  it("모두 완료이면 active=0, done=전체", () => {
    const allDone = SAMPLE.map((t) => ({ ...t, done: true }));
    expect(getActiveCount(allDone)).toBe(0);
    expect(getDoneCount(allDone)).toBe(allDone.length);
  });
});
