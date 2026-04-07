# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # 개발 서버 (http://localhost:3000)
npm run build      # 프로덕션 빌드
npm test           # Vitest 단위 테스트 1회 실행
npm run test:watch # Vitest watch 모드
npm run lint       # ESLint
```

단일 테스트 파일 실행:
```bash
npx vitest run src/lib/todo-utils.test.ts
```

## 아키텍처

**한국어 Todo 앱** — Next.js 16 App Router + shadcn/ui + Tailwind CSS v4.

### 데이터 흐름

모든 상태는 클라이언트 전용이다. 서버 컴포넌트, API Route, Server Action 없음.

```
localStorage ("todos.v1")
    ↕ useEffect / save()
TodoApp (Client Component)
    ↓ props
TodoItem / StatCard / EmptyState
```

### 핵심 파일

- **`src/lib/todo-utils.ts`** — 순수 함수로 분리된 비즈니스 로직. 컴포넌트 상태에 의존하지 않으므로 단독 테스트 가능. 새 로직은 여기에 추가한다.
- **`src/components/todo-app.tsx`** — 유일한 Client Component(`"use client"`). `save(fn(todos))` 패턴으로 불변 업데이트 + localStorage 동기화를 한 번에 처리한다.
- **`src/lib/todo-utils.test.ts`** — 위 유틸 함수 전용 테스트. 컴포넌트 테스트는 없음.

### UI 레이아웃

전체 화면(`h-screen`) 2단 구조:
- **사이드바(왼쪽)**: 진행도 바, 통계, 필터, 완료 삭제 — `lg` 미만에서 햄버거 버튼으로 오버레이 전환
- **메인(오른쪽)**: 헤더 / 스크롤 가능한 목록 / 하단 고정 입력창

### 배포 분기

`next.config.ts`에서 `GITHUB_ACTIONS` 환경 변수로 분기한다:
- **Vercel**: 일반 Next.js 빌드 (설정 없음)
- **GitHub Actions → GitHub Pages**: `output: 'export'`, `basePath: '/claude1'`, `trailingSlash: true` 적용
