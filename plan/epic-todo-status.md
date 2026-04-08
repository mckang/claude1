# Epic S — 투두 상태 관리 & 칸반 보드

| 항목 | 내용 |
|---|---|
| 브랜치 | `feature/todo-status-kanban` |
| 스프린트 | Sprint S (Epic 4 이전 선행 작업) |
| 상태 | ✅ 완료 |
| 최종 수정 | 2026-04-08 |

---

## 개요

현재 투두는 `done: boolean`으로 **진행중 / 완료** 두 가지 상태만 존재한다.  
이를 **대기 / 진행 / 중지 / 종료** 4단계로 확장하고,  
칸반 보드 뷰에서 드래그&드롭으로 상태를 전이할 수 있게 한다.

---

## 상태 정의

| 값 | 한국어 | 진입 조건 | 색상 |
|---|---|---|---|
| `waiting` | 대기 | 투두 등록 시 기본값 / 종료 해제 시 | `bg-zinc-100 text-zinc-600` |
| `active` | 진행 | 칸반 보드에서 이동 | `bg-blue-100 text-blue-700` |
| `paused` | 중지 | 칸반 보드에서 이동 | `bg-amber-100 text-amber-700` |
| `done` | 종료 | 칸반 보드 이동 / 체크박스 체크 | `bg-green-100 text-green-700` |

### 상태 전이 규칙

- **칸반 보드**: 4개 컬럼 간 자유롭게 드래그&드롭 (모든 전이 허용)
- **체크박스 (리스트 뷰)**:
  - 미완료(`waiting` / `active` / `paused`) → 체크 → `done`
  - `done` → 체크 해제 → `waiting`

---

## 태스크 목록

| # | ID | 제목 | 유형 | 상태 |
|---|---|---|---|---|
| 1 | [ES-T1](epic-s/ES-T1.md) | `todos` 테이블 `done` → `status` 마이그레이션 | Task | ✅ 완료 |
| 2 | [ES-T2](epic-s/ES-T2.md) | `todo-utils.ts` 타입·함수 업데이트 및 테스트 | Task | ✅ 완료 |
| 3 | [ES-S1](epic-s/ES-S1.md) | 칸반 보드 뷰 전환 버튼 (리스트 ↔ 칸반) | Story | ✅ 완료 |
| 4 | [ES-S2](epic-s/ES-S2.md) | 칸반 보드 4컬럼 렌더링 | Story | ✅ 완료 |
| 5 | [ES-S3](epic-s/ES-S3.md) | 드래그&드롭 상태 전이 | Story | ✅ 완료 |
| 6 | [ES-S4](epic-s/ES-S4.md) | 체크박스 → 종료 토글 (해제 시 → 대기) | Story | ✅ 완료 |
| 7 | [ES-S5](epic-s/ES-S5.md) | 사이드바 필터 5개로 확장 | Story | ✅ 완료 |
| 8 | [ES-S6](epic-s/ES-S6.md) | 리스트 뷰 상태 Badge 표시 | Story | ✅ 완료 |

> 상태 범례: 🔲 대기 · 🟡 진행 중 · ✅ 완료

---

## 태스크 상세

### ES-T1 — `todos` 테이블 `done` → `status` 마이그레이션
> 상태: ✅ 완료

**마이그레이션 SQL**
```sql
-- 1. status 컬럼 추가 (기존 행 기본값 'active')
ALTER TABLE todos
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('waiting', 'active', 'paused', 'done'));

-- 2. 기존 done=true 행을 'done'으로 전환
UPDATE todos SET status = 'done' WHERE done = true;
-- done=false 행은 DEFAULT 'active' 그대로 유지

-- 3. 신규 투두 기본값을 'waiting'으로 변경
ALTER TABLE todos ALTER COLUMN status SET DEFAULT 'waiting';

-- 4. done 컬럼 제거
ALTER TABLE todos DROP COLUMN done;
```

**체크리스트**
- [x] Supabase SQL Editor에서 마이그레이션 실행
- [x] 기존 투두 데이터 상태 확인 (`done=true` → `done`, `done=false` → `active`)
- [x] 신규 투두 삽입 시 `status='waiting'` 기본값 확인
- [x] CHECK 제약 조건 동작 확인

---

### ES-T2 — `todo-utils.ts` 타입·함수 업데이트 및 테스트
> 상태: ✅ 완료

**타입 변경**
```ts
// 신규 타입
export type TodoStatus = 'waiting' | 'active' | 'paused' | 'done';

// Todo 타입 변경
export type Todo = {
  id: number;
  text: string;
  status: TodoStatus;       // done: boolean → status: TodoStatus
  due_date: string | null;
  urgency: 1 | 2 | 3 | null;
  importance: 1 | 2 | 3 | null;
};

// Filter 타입 확장
export type Filter = 'all' | 'waiting' | 'active' | 'paused' | 'done';
```

**함수 변경·추가**

| 함수 | 변경 내용 |
|---|---|
| `addTodo` | 초기 `status: 'waiting'` (기존 `done: false` 제거) |
| `toggleTodo` 제거 → `setTodoStatus` 추가 | `(todos, id, status: TodoStatus) => Todo[]` |
| `filterTodos` | `filter === 'waiting'` 등 4개 상태 분기 처리 |
| `getActiveCount` | `status !== 'done'` 인 투두 수 반환 |
| `getDoneCount` | `status === 'done'` 인 투두 수 반환 |
| `clearDoneTodos` | `status !== 'done'` 필터 유지 (로직 동일) |
| `statusLabel` 추가 | `TodoStatus → '대기' | '진행' | '중지' | '종료'` |
| `statusColor` 추가 | `TodoStatus → Tailwind Badge 클래스` |

**테스트 체크리스트**
- [x] `addTodo` — 초기 상태 `waiting` 확인
- [x] `setTodoStatus` — 각 상태 전이 확인
- [x] `filterTodos` — 5개 필터 값 전체 케이스
- [x] `getActiveCount` / `getDoneCount` — 상태별 카운트
- [x] `statusLabel` / `statusColor` — 4개 상태 전체 케이스
- [x] `npm test` 전체 통과

---

### ES-S1 — 칸반 보드 뷰 전환 버튼 (리스트 ↔ 칸반)
> 상태: ✅ 완료

**사용자 스토리**  
헤더 우측에 뷰 전환 버튼이 있어 리스트 뷰와 칸반 보드 뷰를 전환할 수 있다.

**구현 세부사항**
- `view: 'list' | 'kanban'` 상태 추가 (`useState`)
- 헤더 우측 "새 할 일" 버튼 옆에 뷰 토글 버튼 배치
  - 리스트 아이콘(lucide `List`) / 칸반 아이콘(lucide `Columns`)
  - 현재 활성 뷰는 `bg-zinc-800` 하이라이트
- `view === 'list'`이면 기존 `<ul>` 목록, `'kanban'`이면 `<KanbanBoard>` 렌더링
- 사이드바 필터는 두 뷰 공통 적용 (칸반 뷰에서도 필터링 동작)

**완료 기준**
- 버튼 클릭 시 두 뷰 간 전환 확인
- 칸반 뷰에서도 사이드바 필터가 동작함을 확인

**체크리스트**
- [x] `view` 상태 추가
- [x] 뷰 토글 버튼 UI 구현
- [x] 조건부 렌더링 처리
- [x] 필터 연동 확인

---

### ES-S2 — 칸반 보드 4컬럼 렌더링
> 상태: ✅ 완료

**사용자 스토리**  
칸반 보드 뷰에서 대기/진행/중지/종료 4개 컬럼이 나란히 표시되고, 각 컬럼에 해당 상태의 투두 카드가 배치된다.

**구현 세부사항**
- `KanbanBoard` 컴포넌트: `todo-app.tsx` 내에 정의
- 레이아웃: 수평 스크롤 가능한 4컬럼 (`grid-cols-4` 또는 `flex`)
- 각 컬럼 구성:
  - 컬럼 헤더: 상태 라벨 + 투두 수 Badge
  - 투두 카드 목록: `KanbanCard` 컴포넌트
- `KanbanCard`: 리스트 뷰 `TodoItem`과 동일한 액션 제공 (삭제, 편집 모달)
- 모바일: 컬럼을 세로로 쌓는 반응형 처리 (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)

**완료 기준**
- 4개 컬럼이 정상 렌더링됨을 확인
- 각 컬럼에 올바른 투두 카드가 배치됨을 확인
- 모바일에서 반응형 레이아웃 확인

**체크리스트**
- [x] `KanbanBoard` 컴포넌트 구현
- [x] `KanbanCard` 컴포넌트 구현 (편집·삭제 연동)
- [x] 컬럼 헤더 상태 Badge 렌더링
- [x] 반응형 레이아웃 처리

---

### ES-S3 — 드래그&드롭 상태 전이
> 상태: ✅ 완료

**사용자 스토리**  
칸반 보드에서 투두 카드를 다른 컬럼으로 드래그하면 해당 상태로 전이되며 Supabase에 저장된다.

**구현 세부사항**
- 패키지: `@dnd-kit/core`, `@dnd-kit/utilities` 설치
- `DndContext` (루트), `useDroppable` (컬럼), `useDraggable` (카드) 사용
- 드롭 완료 시 (`onDragEnd`):
  - `setTodoStatus(todos, id, newStatus)` 호출 (낙관적 업데이트)
  - `supabase.from('todos').update({ status }).eq('id', id)` 비동기 저장
- 드래그 중 시각적 피드백: 카드 `opacity-50` 처리
- 드롭 가능한 컬럼은 드래그 오버 시 `ring-2 ring-indigo-500` 하이라이트

**완료 기준**
- 카드를 다른 컬럼으로 드래그&드롭 → 상태 변경 확인
- Supabase DB 상태 값 업데이트 확인
- 드래그 중 시각 피드백 확인

**체크리스트**
- [x] `@dnd-kit/core`, `@dnd-kit/utilities` 설치
- [x] `DndContext` + `onDragEnd` 핸들러 구현
- [x] 각 컬럼에 `useDroppable` 적용
- [x] 각 카드에 `useDraggable` 적용
- [x] 낙관적 업데이트 + Supabase 저장 연동
- [x] 드래그 오버 컬럼 하이라이트 처리

---

### ES-S4 — 체크박스 → 종료 토글 (해제 시 → 대기)
> 상태: ✅ 완료

**사용자 스토리**  
리스트 뷰에서 체크박스를 클릭하면 투두가 종료 상태로 전환되고, 다시 클릭하면 대기 상태로 되돌아간다.

**구현 세부사항**
- `handleToggle` 수정:
  ```ts
  const newStatus: TodoStatus = todo.status === 'done' ? 'waiting' : 'done'
  ```
- Supabase: `update({ status: newStatus })`
- 체크박스 `checked` 상태: `todo.status === 'done'`

**완료 기준**
- 체크박스 체크 → `status='done'` 확인
- 체크박스 해제 → `status='waiting'` 확인
- Supabase DB 값 반영 확인

**체크리스트**
- [x] `handleToggle` 로직 수정
- [x] Checkbox `checked` prop 수정
- [x] Supabase 업데이트 컬럼 변경 (`done` → `status`)

---

### ES-S5 — 사이드바 필터 5개로 확장
> 상태: ✅ 완료

**사용자 스토리**  
사이드바 필터에서 전체/대기/진행/중지/종료 5가지로 목록을 필터링할 수 있다.

**구현 세부사항**
```ts
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: '전체' },
  { key: 'waiting', label: '대기' },
  { key: 'active',  label: '진행' },
  { key: 'paused',  label: '중지' },
  { key: 'done',    label: '종료' },
]
```
- 각 필터 버튼 우측 카운트: 해당 상태의 투두 수
- 리스트 뷰와 칸반 뷰 모두에 적용 (칸반 뷰에서는 선택 상태 컬럼 카드만 표시)
- 헤더 타이틀도 현재 필터에 맞게 표시

**완료 기준**
- 5개 필터 버튼 렌더링 확인
- 각 필터 선택 시 올바른 투두만 표시됨을 확인
- 카운트 숫자 정확성 확인

**체크리스트**
- [x] `FILTERS` 배열 수정
- [x] 필터별 카운트 계산 로직 추가
- [x] 헤더 타이틀 필터 연동
- [x] 칸반 뷰 필터 적용 확인

---

### ES-S6 — 리스트 뷰 상태 Badge 표시
> 상태: ✅ 완료

**사용자 스토리**  
리스트 뷰의 각 투두 아이템에 현재 상태(대기/진행/중지/종료)가 Badge로 표시된다.

**구현 세부사항**
- `TodoItem`에 상태 Badge 추가 (긴급도·중요도 Badge와 동일한 위치)
- `statusLabel()` / `statusColor()` 유틸 함수 사용
- Badge 색상:
  - 대기: `bg-zinc-100 text-zinc-600`
  - 진행: `bg-blue-100 text-blue-700`
  - 중지: `bg-amber-100 text-amber-700`
  - 종료: `bg-green-100 text-green-700`

**완료 기준**
- 각 투두 아이템에 상태 Badge 표시 확인
- 상태 변경 시 Badge 즉시 반영 확인

**체크리스트**
- [x] `statusLabel` / `statusColor` 유틸 구현 (ES-T2와 연계)
- [x] `TodoItem`에 상태 Badge 렌더링 추가
- [x] 상태 변경 후 낙관적 업데이트로 Badge 즉시 반영 확인

---

## 의존성

```
ES-T1 (DB 마이그레이션)
  └── ES-T2 (타입·함수)
        ├── ES-S4 (체크박스 토글)
        ├── ES-S5 (필터 확장)
        ├── ES-S6 (상태 Badge)
        └── ES-S1 (뷰 전환)
              ├── ES-S2 (칸반 렌더링)
              │     └── ES-S3 (드래그&드롭)
              └── ES-S5 (필터 연동)
```

---

## 완료 기준 (Definition of Done)

- [x] 기능이 로컬(`npm run dev`)에서 정상 동작
- [x] 관련 단위 테스트 작성 및 통과 (`npm test`)
- [x] ESLint 경고 없음 (`npm run lint`)
- [ ] Vercel 프리뷰 배포 정상 확인
- [x] `plan.md` 스프린트 현황 업데이트
- [x] Architecture 문서 DB 스키마 섹션 반영
