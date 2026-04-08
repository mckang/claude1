# Architecture — 한국어 Todo 앱

## 1. 기술 스택

| 레이어 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 런타임 | React 19 |
| 언어 | TypeScript 5 (strict mode) |
| 인증 / DB | Supabase (PostgreSQL + Auth + Storage) |
| UI 라이브러리 | shadcn/ui (base-nova) + Tailwind CSS v4 |
| 아이콘 | lucide-react |
| 마크다운 | react-markdown + remark-gfm |
| 테스트 | Vitest + Testing Library |
| 배포 | Vercel (main), GitHub Pages (github-pages 브랜치) |
| 외부 API | Google Calendar API v3 (Google OAuth 사용자 전용) |

---

## 2. 디렉토리 구조

```
src/
├── app/
│   ├── layout.tsx              # Root layout (메타데이터)
│   ├── page.tsx                # Home — Server Component, 인증 확인
│   ├── globals.css             # Tailwind v4 + shadcn 테마 변수
│   ├── auth/
│   │   ├── page.tsx            # 로그인·회원가입 페이지 (정적 렌더링)
│   │   └── callback/route.ts   # OAuth/이메일 인증 콜백 Route Handler
│   └── api/
│       ├── calendar/
│       │   ├── events/route.ts      # Calendar 이벤트 생성·삭제
│       │   └── webhook/route.ts     # Google Pub/Sub 웹훅 수신 (삭제 동기화)
│       └── attachments/route.ts     # 첨부 파일 Signed URL 발급 / redirect
├── components/
│   ├── todo-app.tsx            # 메인 Client Component (CRUD + 상태 + 모달)
│   ├── auth-form.tsx           # 인증 폼 Client Component
│   └── ui/                     # shadcn 원자 컴포넌트
│       ├── button.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       └── ...
├── lib/
│   ├── todo-utils.ts           # 순수 함수 비즈니스 로직
│   ├── todo-utils.test.ts      # 단위 테스트
│   ├── utils.ts                # cn() 유틸
│   ├── google-calendar.ts      # Google Calendar API 래퍼
│   └── supabase/
│       ├── client.ts           # 브라우저 Supabase 클라이언트
│       └── server.ts           # 서버 Supabase 클라이언트
├── proxy.ts                    # Next.js 16 미들웨어 (인증 라우팅)
└── test/
    └── setup.ts                # Vitest 전역 설정
```

---

## 3. 요청 흐름

### 3-1. 일반 페이지 요청

```
브라우저 GET /
    │
    ▼
proxy.ts (미들웨어)
 ├─ supabase.auth.getUser() — 세션 갱신
 ├─ 미인증 → redirect /auth
 └─ 인증됨 → 통과
    │
    ▼
app/page.tsx (Server Component)
 ├─ createClient() (서버) → getUser()
 ├─ user 없음 → redirect /auth
 └─ user 있음 → <TodoApp userEmail userId />
    │
    ▼
components/todo-app.tsx (Client Component)
 ├─ useEffect: Supabase에서 todos 로드
 └─ 사용자 인터랙션 → CRUD 함수 실행
```

### 3-2. 인증 흐름 (이메일)

```
/auth → AuthForm → supabase.auth.signInWithPassword()
    → 세션 쿠키 저장 → redirect /
```

### 3-3. 인증 흐름 (Google OAuth)

```
/auth → AuthForm → supabase.auth.signInWithOAuth({ provider: "google" })
    → Google 동의 화면
    → /auth/callback?code=xxx
    → exchangeCodeForSession(code)
    → redirect /
```

---

## 4. 컴포넌트 계층

모든 컴포넌트는 `todo-app.tsx` 단일 파일에 정의된다.

```
app/page.tsx (Server)
└── TodoApp (Client)
    ├── 사이드바
    │   ├── 진행 바
    │   ├── StatCard × 2 (남은 일 / 완료)
    │   ├── 필터 버튼 × 3
    │   └── 완료 삭제 버튼
    ├── 메인
    │   ├── 헤더 (`+` 새 할 일 버튼)
    │   └── 투두 목록
    │       └── TodoItem × n
    │           ├── Checkbox (완료 토글)
    │           ├── 텍스트 영역 (클릭 → TodoDetailModal)
    │           │   ├── 첨부 없음: 마크다운 최대 3줄 렌더링
    │           │   └── 첨부 있음: 1줄 텍스트 + h-10 첨부 영역
    │           ├── 연필 버튼 (클릭 → TodoFormModal edit)
    │           ├── 삭제 버튼
    │           ├── TodoDetailModal (상세 조회)
    │           └── TodoFormModal mode="edit" (편집)
    └── TodoFormModal mode="add" (새 할 일 추가)

TodoFormModal (add / edit 공용)
    ├── 편집 탭: textarea (Ctrl+Enter 저장)
    ├── 미리보기 탭: MarkdownContent
    └── 파일 첨부 영역
        ├── 기존 첨부: 썸네일 + × 삭제 + (이미지) + 본문 삽입
        └── 신규 첨부: PendingFilePreview

TodoDetailModal
    ├── MarkdownContent (전체 본문)
    └── 첨부파일 목록 (이미지 → 새 탭, 그 외 → download)

app/auth/page.tsx (Server)
└── AuthForm (Client)
    ├── 이메일 / 비밀번호 Input
    ├── 로그인·회원가입 Button
    └── Google 로그인 Button
```

---

## 5. 데이터 레이어

### Supabase DB 스키마

```sql
-- v1 (현재)
create table todos (
  id         bigserial primary key,
  user_id    uuid references auth.users not null,
  text       text not null,
  status     text not null default 'waiting'
             check (status in ('waiting', 'active', 'paused', 'done')),
  created_at timestamptz default now()
);

-- v2 추가 컬럼 (마이그레이션)
alter table todos
  add column due_date          timestamptz,
  add column urgency           smallint check (urgency between 1 and 3),   -- 1=낮음 2=보통 3=높음
  add column importance        smallint check (importance between 1 and 3), -- 1=낮음 2=보통 3=높음
  add column calendar_event_id text;  -- Google Calendar 이벤트 ID

-- Epic S: done(boolean) → status(text) 전환 완료
-- status: 'waiting'(대기) | 'active'(진행) | 'paused'(일시중지) | 'done'(완료)

-- 첨부 파일 테이블 (v2)
create table todo_attachments (
  id         bigserial primary key,
  todo_id    bigint references todos on delete cascade not null,
  user_id    uuid references auth.users not null,
  name       text not null,           -- 원본 파일명
  storage_path text not null,         -- Supabase Storage 경로
  mime_type  text not null,
  size_bytes bigint not null,
  created_at timestamptz default now()
);

alter table todos enable row level security;
alter table todo_attachments enable row level security;

create policy "users can manage their own todos" on todos
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can manage their own attachments" on todo_attachments
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### Supabase Storage

| 버킷 | 접근 | 경로 규칙 | 용도 |
|---|---|---|---|
| `todo-attachments` | private | `{user_id}/{todo_id}/{timestamp}_{filename}` | 투두 첨부 파일 |

- 파일 접근은 Signed URL (만료 1시간) 사용
- 투두 삭제 시 연관 Storage 파일도 삭제 (`handleRemove`에서 명시적 처리)
- DB cascade로 `todo_attachments` 레코드 자동 삭제

### `/api/attachments` Route Handler

| 메서드 | 쿼리 파라미터 | 동작 |
|---|---|---|
| `GET` | `path` | Signed URL JSON 반환 |
| `GET` | `path` + `redirect=true` | Signed URL로 302 redirect (마크다운 이미지 삽입용) |
| `DELETE` | `path` | Storage 파일 삭제 |

`redirect=true` 모드는 마크다운 본문에 `![name](/api/attachments?path=...&redirect=true)` 형태로 이미지를 삽입할 때 사용. 서버가 매 요청마다 새 Signed URL을 발급해 redirect하므로 URL 만료 문제가 없다.

### 낙관적 업데이트 패턴

```
사용자 액션
    │
    ├─ 1) UI 즉시 반영 (setState)
    └─ 2) Supabase 비동기 요청
           ├─ 성공: 서버 데이터로 재동기화
           └─ 실패: 이전 상태 롤백 (TODO: 현재 미구현)
```

### Supabase 클라이언트 이원화

| 클라이언트 | 파일 | 사용처 |
|---|---|---|
| Browser | `lib/supabase/client.ts` | Client Component (todo-app, auth-form) |
| Server | `lib/supabase/server.ts` | Server Component, Route Handler, Middleware |

---

## 6. Google Calendar 연동 아키텍처

### 6-1. 조건
- Google OAuth로 로그인한 사용자만 활성화
- Supabase `auth.identities` 테이블에서 provider token 획득

### 6-2. 이벤트 생성 흐름

```
사용자: "캘린더 연동" 버튼 클릭
    │
    ▼
POST /api/calendar/events
 ├─ Supabase 서버 클라이언트로 provider_token 획득
 ├─ Google Calendar API: events.insert()
 ├─ todos.calendar_event_id 업데이트
 └─ 응답 반환 → UI에 캘린더 아이콘 표시
```

### 6-3. 삭제 동기화 흐름

```
[앱 → 캘린더]
사용자: 투두 삭제
    │
    ▼
DELETE /api/calendar/events?eventId={id}
 └─ Google Calendar API: events.delete()

[캘린더 → 앱]
Google Pub/Sub 웹훅 → POST /api/calendar/webhook
 ├─ 이벤트 삭제 알림 수신
 ├─ calendar_event_id로 투두 조회
 └─ Supabase: 해당 투두 삭제
```

### 6-4. OAuth Scope
```
https://www.googleapis.com/auth/calendar.events
```
Supabase Google provider 설정에서 추가 scope 지정 필요.

---

## 7. 인증 아키텍처

- **세션 저장**: HTTP Only 쿠키 (`@supabase/ssr` 관리)
- **세션 갱신**: 모든 요청마다 `proxy.ts`에서 자동 갱신
- **RLS**: DB 레벨에서 `auth.uid() = user_id` 강제

---

## 8. 배포 구조

| 브랜치 | CI | 호스팅 | 특이사항 |
|---|---|---|---|
| `main` | Vercel 자동 | Vercel | 일반 Next.js 서버 빌드 |
| `github-pages` | GitHub Actions | GitHub Pages | `output: 'export'`, basePath `/claude1`, 인증 없음 |

`next.config.ts`에서 `GITHUB_ACTIONS` 환경 변수로 빌드 분기.

---

## 9. 환경 변수

| 변수 | 노출 범위 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 브라우저·서버 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 브라우저·서버 | Supabase 익명 키 (RLS로 보호) |
| `GOOGLE_CALENDAR_WEBHOOK_SECRET` | 서버 전용 | Pub/Sub 웹훅 검증 토큰 |
