# ES-S3 — 드래그&드롭 상태 전이

| 항목 | 내용 |
|---|---|
| ID | ES-S3 |
| 유형 | Story |
| 에픽 | [Epic S — 투두 상태 관리 & 칸반 보드](../epic-todo-status.md) |
| 상태 | ✅ 완료 |
| 선행 조건 | ES-S2 완료 |
| 후행 스토리 | 없음 |

---

## 사용자 스토리

> 칸반 보드에서 투두 카드를 다른 컬럼으로 드래그하면 해당 상태로 전이되며,  
> 변경 내용이 즉시 UI에 반영되고 Supabase에 저장된다.

---

## 구현 세부사항

**패키지 설치**
```bash
npm install @dnd-kit/core @dnd-kit/utilities
```

**dnd-kit 구성 요소 사용처**

| 훅 / 컴포넌트 | 사용처 |
|---|---|
| `DndContext` | `KanbanBoard` 루트 래퍼 |
| `useDroppable` | `KanbanColumn` (드롭 대상) |
| `useDraggable` | `KanbanCard` (드래그 소스) |
| `DragOverlay` | 드래그 중 카드 미리보기 |

**드래그&드롭 흐름**
```
사용자: 카드 드래그 시작
  └─ DragOverlay로 카드 미리보기 렌더링
       │
사용자: 컬럼에 드롭
  └─ onDragEnd({ active, over })
       ├─ over.id → newStatus (컬럼의 status 값)
       ├─ setTodoStatus(todos, active.id, newStatus)  // 낙관적 업데이트
       └─ supabase.from('todos').update({ status: newStatus }).eq('id', active.id)
```

**시각적 피드백**
- 드래그 중 원본 카드: `opacity-40`
- 드롭 가능한 컬럼 (드래그 오버 시): `ring-2 ring-indigo-500 bg-zinc-800/80`
- `DragOverlay`: 원본 카드 동일 스타일 + `shadow-xl rotate-1`

**예외 처리**
- 같은 컬럼에 드롭 시: 상태 변경 없음 (no-op)
- `over`가 null인 경우 (컬럼 밖 드롭): 상태 변경 없음

---

## 완료 기준

- 카드를 다른 컬럼으로 드래그&드롭하면 상태가 변경된다
- 낙관적 업데이트로 UI가 즉시 반영된다
- Supabase DB의 `status` 값이 업데이트된다
- 드래그 중 시각적 피드백(오버레이, 컬럼 하이라이트)이 표시된다
- 같은 컬럼 드롭 및 컬럼 밖 드롭 시 상태가 변경되지 않는다

---

## 체크리스트

- [x] `@dnd-kit/core`, `@dnd-kit/utilities` 패키지 설치
- [x] `DndContext` + `onDragEnd` 핸들러 구현
- [x] `KanbanColumn`에 `useDroppable` 적용
- [x] `KanbanCard`에 `useDraggable` 적용
- [x] `DragOverlay` 구현 (드래그 중 미리보기)
- [x] 드래그 오버 컬럼 하이라이트 처리
- [x] 낙관적 업데이트 + Supabase 저장 연동
- [x] 같은 컬럼 드롭 no-op 처리
- [x] 컬럼 밖 드롭 no-op 처리
