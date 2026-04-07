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

## 브랜치 구조

| 브랜치 | 배포 대상 | 인증 | 데이터 저장 |
|---|---|---|---|
| `main` | Vercel | Supabase (이메일 + Google OAuth) | Supabase DB (사용자별) |
| `github-pages` | GitHub Pages | 없음 | localStorage |

- `main` push → Vercel 자동 배포
- `github-pages` push → GitHub Actions → GitHub Pages 자동 배포

## 아키텍처 (main 브랜치)

**한국어 Todo 앱** — Next.js 16 App Router + Supabase Auth + shadcn/ui + Tailwind CSS v4.

### 인증 흐름

```
브라우저 요청
    ↓
proxy.ts (세션 갱신 + 미인증 시 /auth 리다이렉트)
    ↓
page.tsx (서버 컴포넌트 — Supabase로 user 확인)
    ↓
TodoApp (Client Component — userEmail, userId props)
```

### 데이터 흐름

투두는 Supabase DB에 사용자별로 저장된다. 낙관적 업데이트(optimistic update) 패턴 사용.

```
Supabase DB (todos 테이블, RLS로 사용자별 격리)
    ↕ @supabase/ssr (브라우저 클라이언트)
TodoApp (Client Component)
    ↓ props
TodoItem / StatCard / EmptyState
```

### 핵심 파일

- **`src/proxy.ts`** — Next.js 16 미들웨어 (proxy.ts = 구 middleware.ts). 세션 갱신 + 인증 라우팅. config export로 matcher 지정 (`proxyConfig` 아님).
- **`src/lib/supabase/client.ts`** — 브라우저용 Supabase 클라이언트 (`createBrowserClient`)
- **`src/lib/supabase/server.ts`** — 서버용 Supabase 클라이언트 (`createServerClient` + cookies)
- **`src/app/auth/page.tsx`** — 로그인/회원가입 페이지 (정적 렌더링)
- **`src/app/auth/callback/route.ts`** — OAuth/이메일 인증 콜백 Route Handler
- **`src/components/auth-form.tsx`** — 로그인·회원가입·Google OAuth 폼 (Client Component)
- **`src/app/page.tsx`** — 서버 컴포넌트. 인증 확인 후 TodoApp에 user 정보 전달.
- **`src/components/todo-app.tsx`** — 메인 Client Component. Supabase CRUD + 낙관적 업데이트.
- **`src/lib/todo-utils.ts`** — 순수 함수 비즈니스 로직 (상태 변환). 단독 테스트 가능.
- **`src/lib/todo-utils.test.ts`** — 유틸 함수 전용 테스트.

### Supabase DB 스키마

```sql
create table todos (
  id bigserial primary key,
  user_id uuid references auth.users not null,
  text text not null,
  done boolean not null default false,
  created_at timestamptz default now()
);

alter table todos enable row level security;

create policy "users can manage their own todos" on todos
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### UI 레이아웃

전체 화면(`h-screen`) 2단 구조:
- **사이드바(왼쪽)**: 진행도 바, 통계, 필터, 완료 삭제 — `lg` 미만에서 햄버거 버튼으로 오버레이 전환
- **메인(오른쪽)**: 헤더(이메일 + 로그아웃 버튼) / 스크롤 가능한 목록 / 하단 고정 입력창

### 배포 설정

`next.config.ts`에서 `GITHUB_ACTIONS` 환경 변수로 분기한다:
- **Vercel**: 일반 Next.js 서버 빌드 (framework 명시는 `vercel.json` 참고)
- **GitHub Actions → GitHub Pages**: `output: 'export'`, `basePath: '/claude1'`, `trailingSlash: true` 적용

## Next.js 16 주의사항

- 미들웨어 파일명: `middleware.ts` → **`proxy.ts`** (함수명도 `proxy`, config export는 `config`)
- `proxyConfig`는 인식되지 않음 — 반드시 `export const config = { matcher: [...] }` 사용

## 환경 변수

로컬 개발 시 `.env.local` 필요:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Vercel 배포 시 동일한 변수를 Vercel 대시보드 → Settings → Environment Variables에 추가 후 재배포.
