# ES-S4 — 체크박스 → 종료 토글 (해제 시 → 대기)

| 항목 | 내용 |
|---|---|
| ID | ES-S4 |
| 유형 | Story |
| 에픽 | [Epic S — 투두 상태 관리 & 칸반 보드](../epic-todo-status.md) |
| 상태 | ✅ 완료 |
| 선행 조건 | ES-T2 완료 |
| 후행 스토리 | 없음 |

---

## 사용자 스토리

> 리스트 뷰에서 체크박스를 클릭하면 투두가 종료 상태로 전환되고,  
> 다시 클릭하면 대기 상태로 되돌아간다.

---

## 구현 세부사항

**`handleToggle` 수정**
```ts
async function handleToggle(id: number) {
  const todo = todos.find((t) => t.id === id)
  if (!todo) return
  const newStatus: TodoStatus = todo.status === 'done' ? 'waiting' : 'done'
  setTodos((prev) => setTodoStatus(prev, id, newStatus))   // 낙관적 업데이트
  await supabase.from('todos').update({ status: newStatus }).eq('id', id)
}
```

**Checkbox `checked` prop 수정**
```tsx
// 기존
checked={todo.done}

// 변경
checked={todo.status === 'done'}
```

**전이 규칙**

| 현재 상태 | 체크박스 동작 | 전이 후 상태 |
|---|---|---|
| `waiting` (대기) | 체크 | `done` (종료) |
| `active` (진행) | 체크 | `done` (종료) |
| `paused` (중지) | 체크 | `done` (종료) |
| `done` (종료) | 체크 해제 | `waiting` (대기) |

---

## 완료 기준

- 체크박스 체크 시 `status='done'`으로 변경된다
- 체크박스 해제 시 `status='waiting'`으로 변경된다
- Supabase DB `status` 값이 올바르게 반영된다
- 낙관적 업데이트로 UI가 즉시 반영된다

---

## 체크리스트

- [x] `handleToggle` 로직 수정 (`done` ↔ `waiting` 전이)
- [x] Checkbox `checked` prop 수정 (`todo.status === 'done'`)
- [x] Supabase 업데이트 필드 변경 (`done` → `status`)
- [x] 리스트 뷰에서 전이 동작 확인 (4가지 케이스)
