# 개발 표준 — 한국어 Todo 앱

## 1. 언어 & 타입

- **TypeScript strict mode** 필수. `any` 사용 금지.
- 타입은 인터페이스(`interface`) 또는 타입 앨리어스(`type`) 모두 허용.  
  단, 공개 API·props는 `interface`, 유니온·유틸리티 타입은 `type` 선호.
- 컴포넌트 props는 반드시 명시적으로 타입 지정.

```typescript
// Good
interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}

// Bad
function TodoItem({ todo, onToggle, onRemove }: any) { ... }
```

---

## 2. 파일 & 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트 파일 | `kebab-case.tsx` | `todo-app.tsx` |
| 유틸 파일 | `kebab-case.ts` | `todo-utils.ts` |
| 테스트 파일 | `{원본}.test.ts(x)` | `todo-utils.test.ts` |
| 컴포넌트 함수 | `PascalCase` | `TodoApp` |
| 변수·함수 | `camelCase` | `handleToggle` |
| 상수 | `UPPER_SNAKE_CASE` | `MAX_TODO_LENGTH` |
| CSS 변수 | `--kebab-case` | `--sidebar-background` |

---

## 3. 컴포넌트 작성 규칙

### Server vs Client 컴포넌트

- **기본값은 Server Component** — 필요할 때만 `"use client"` 추가
- `useState`, `useEffect`, 이벤트 핸들러 → Client Component 필수
- Supabase 브라우저 클라이언트 → Client Component에서만 사용

```typescript
// Server Component (기본)
export default async function Page() {
  const supabase = await createClient(); // server client
  const { data: { user } } = await supabase.auth.getUser();
  return <TodoApp userEmail={user.email} userId={user.id} />;
}

// Client Component
"use client";
export function TodoApp({ userEmail, userId }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  // ...
}
```

### Props 전달 방향

- 데이터: 부모 → 자식 (props)
- 이벤트: 자식 → 부모 (콜백 props)
- 전역 상태 관리 라이브러리 사용 금지 (현재 규모에서 불필요)

---

## 4. 비즈니스 로직 분리

순수 함수 로직은 반드시 `src/lib/` 에 분리하고 테스트를 작성한다.

```typescript
// src/lib/todo-utils.ts — 순수 함수만
export function addTodo(todos: Todo[], text: string): Todo[] {
  // 부수 효과 없음, Supabase 호출 없음
}

// src/components/todo-app.tsx — 순수 함수 + Supabase 조합
async function handleAdd() {
  setTodos(addTodo(todos, input)); // 낙관적 업데이트
  await supabase.from("todos").insert(...);
}
```

**원칙**: 컴포넌트에서 복잡한 배열 조작이 생기면 `todo-utils.ts`로 이동.

---

## 5. Supabase 사용 규칙

### 클라이언트 선택

```typescript
// Client Component
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Server Component / Route Handler
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
```

### 에러 처리

```typescript
const { data, error } = await supabase.from("todos").select("*");
if (error) {
  console.error("todos 로드 실패:", error.message);
  return;
}
```

- Supabase 호출 결과는 항상 `error` 확인
- 사용자에게 표시할 에러는 상태(`setError`)로 관리

### 쿼리 패턴

```typescript
// 조회
const { data } = await supabase
  .from("todos")
  .select("*")
  .order("id");

// 삽입
const { data } = await supabase
  .from("todos")
  .insert({ text, done: false, user_id: userId })
  .select()
  .single();

// 업데이트
await supabase
  .from("todos")
  .update({ done: !todo.done })
  .eq("id", todo.id);

// 삭제
await supabase.from("todos").delete().eq("id", id);
```

---

## 6. 낙관적 업데이트 패턴

```typescript
async function handleToggle(id: number) {
  // 1) 즉시 UI 반영
  setTodos((prev) => toggleTodo(prev, id));

  // 2) 서버 요청
  const { error } = await supabase
    .from("todos")
    .update({ done: !current.done })
    .eq("id", id);

  // 3) 실패 시 롤백
  if (error) {
    setTodos((prev) => toggleTodo(prev, id)); // 재토글로 원복
  }
}
```

---

## 7. 테스트

### 테스트 대상

- `src/lib/` 의 순수 함수는 **반드시** 단위 테스트 작성
- 컴포넌트 테스트는 선택 사항 (현재는 유틸 함수 집중)

### 테스트 파일 위치

테스트 파일은 대상 파일과 **같은 디렉토리**에 위치.

```
src/lib/todo-utils.ts
src/lib/todo-utils.test.ts  ← 같은 위치
```

### 테스트 작성 원칙

```typescript
// 1. describe로 함수 단위 그룹화
describe("addTodo", () => {
  // 2. 한 테스트에 한 가지 동작만 검증
  it("새 투두를 목록 끝에 추가한다", () => {
    const result = addTodo([TODO_A], "새 항목");
    expect(result).toHaveLength(2);
    expect(result[1].text).toBe("새 항목");
  });

  // 3. 불변성 반드시 검증
  it("원본 배열을 변경하지 않는다", () => {
    const original = [TODO_A];
    addTodo(original, "새 항목");
    expect(original).toHaveLength(1);
  });
});
```

### 실행 명령

```bash
npm test                              # 1회 실행
npm run test:watch                    # watch 모드
npx vitest run src/lib/todo-utils.test.ts  # 단일 파일
```

---

## 8. 에러 처리

- **UI 경계**: 사용자에게 보여줄 에러는 `useState`로 관리 후 화면에 표시
- **서버 에러**: `console.error` 로깅 + 사용자 메시지 분리
- `try-catch`는 외부 I/O(Supabase, fetch)에만 사용

```typescript
// Good
const [error, setError] = useState<string | null>(null);

async function handleAdd() {
  const { error: dbError } = await supabase.from("todos").insert(...);
  if (dbError) {
    setError("투두 추가에 실패했습니다.");
    console.error(dbError);
  }
}

// Bad — 에러 무시
const { data } = await supabase.from("todos").insert(...);
```

---

## 9. 임포트 순서

1. React / Next.js 코어
2. 외부 라이브러리
3. 내부 모듈 (`@/` 경로)
4. 상대 경로 (`./`, `../`)

```typescript
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { addTodo } from "@/lib/todo-utils";
import type { Todo } from "./types";
```

---

## 10. 금지 사항

| 금지 | 이유 |
|---|---|
| `any` 타입 | 타입 안전성 상실 |
| 컴포넌트 내 직접 SQL | 로직 분리 원칙 위반 |
| `console.log` 커밋 | 디버그 코드 잔류 |
| 하드코딩된 `user_id` | 보안 취약점 |
| 전역 변수·싱글톤 상태 | 예측 불가한 상태 공유 |
| Supabase 서비스 롤 키 클라이언트 노출 | RLS 우회, 보안 위험 |

---

## 11. Git 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/) 형식 사용.

```
<type>: <요약>

[선택적 본문]
```

| type | 용도 |
|---|---|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `test` | 테스트 추가·수정 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `chore` | 빌드·설정 변경 |

```bash
# Good
git commit -m "feat: 완료 투두 일괄 삭제 기능 추가"
git commit -m "fix: 빈 문자열 투두 추가 방지"

# Bad
git commit -m "수정"
git commit -m "WIP"
```
