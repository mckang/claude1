# ES-T2 — `todo-utils.ts` 타입·함수 업데이트 및 테스트

| 항목 | 내용 |
|---|---|
| ID | ES-T2 |
| 유형 | Task |
| 에픽 | [Epic S — 투두 상태 관리 & 칸반 보드](../epic-todo-status.md) |
| 상태 | ✅ 완료 |
| 선행 조건 | ES-T1 완료 |
| 후행 태스크 | ES-S1, ES-S4, ES-S5, ES-S6 |

---

## 목적

`done: boolean` 기반의 타입과 순수 함수를 `status: TodoStatus` 기반으로 전면 교체하고,  
상태 관련 유틸 함수(`statusLabel`, `statusColor`)를 추가한다.

---

## 타입 변경

```ts
// 신규 타입
export type TodoStatus = 'waiting' | 'active' | 'paused' | 'done';

// Todo 타입 — done 제거, status 추가
export type Todo = {
  id: number;
  text: string;
  status: TodoStatus;
  due_date: string | null;
  urgency: 1 | 2 | 3 | null;
  importance: 1 | 2 | 3 | null;
};

// Filter 타입 — 5개로 확장
export type Filter = 'all' | 'waiting' | 'active' | 'paused' | 'done';
```

---

## 함수 변경·추가

| 함수 | 변경 내용 |
|---|---|
| `addTodo` | 초기값 `status: 'waiting'` (기존 `done: false` 제거) |
| `toggleTodo` 제거 | `setTodoStatus(todos, id, status: TodoStatus): Todo[]` 로 교체 |
| `filterTodos` | `filter === 'waiting' \| 'active' \| 'paused' \| 'done'` 분기 추가 |
| `getActiveCount` | `status !== 'done'` 인 투두 수 반환 |
| `getDoneCount` | `status === 'done'` 인 투두 수 반환 |
| `clearDoneTodos` | `status !== 'done'` 필터 (로직 동일, 참조 필드만 변경) |
| `statusLabel` (추가) | `TodoStatus → '대기' \| '진행' \| '중지' \| '종료'` |
| `statusColor` (추가) | `TodoStatus → Tailwind Badge 클래스 문자열` |

### `statusColor` 반환값

| 상태 | 클래스 |
|---|---|
| `waiting` | `bg-zinc-100 text-zinc-600` |
| `active` | `bg-blue-100 text-blue-700` |
| `paused` | `bg-amber-100 text-amber-700` |
| `done` | `bg-green-100 text-green-700` |

---

## 테스트 체크리스트

- [x] `addTodo` — 초기 상태 `'waiting'` 확인
- [x] `setTodoStatus` — 각 상태 전이 (4×4 케이스)
- [x] `filterTodos` — 5개 필터 값 전체 케이스
- [x] `getActiveCount` — `done` 제외한 나머지 카운트
- [x] `getDoneCount` — `done` 상태만 카운트
- [x] `clearDoneTodos` — `done` 상태 제거, 나머지 유지
- [x] `statusLabel` — 4개 상태 전체 케이스
- [x] `statusColor` — 4개 상태 전체 케이스
- [x] `npm test` 전체 통과
