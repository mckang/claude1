# 할 일 목록

한국어 Todo 앱 — Next.js 16 + Supabase Auth + shadcn/ui + Tailwind CSS v4

**Vercel 배포**: https://prac1-flame.vercel.app

## 기능

- 이메일/비밀번호 회원가입 및 로그인
- Google OAuth 로그인
- 사용자별 투두 저장 (Supabase DB)
- 진행도 바 및 통계
- 필터링 (전체 / 진행중 / 완료)
- 반응형 레이아웃 (모바일 햄버거 메뉴)

## 브랜치

| 브랜치 | 배포 | 인증 |
|---|---|---|
| `main` | Vercel | Supabase (이메일 + Google) |
| `github-pages` | GitHub Pages | 없음 (localStorage) |

## 로컬 개발

**1. 의존성 설치**

```bash
npm install
```

**2. 환경 변수 설정**

```bash
cp .env.local.example .env.local
```

`.env.local`에 Supabase 프로젝트의 URL과 anon key 입력:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**3. Supabase DB 설정**

Supabase 대시보드 → SQL Editor에서 실행:

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

**4. 개발 서버 실행**

```bash
npm run dev
```

http://localhost:3000 에서 확인

## 기술 스택

- **프레임워크**: Next.js 16 (App Router, Turbopack)
- **인증 / DB**: Supabase (Auth + PostgreSQL + RLS)
- **UI**: shadcn/ui, Tailwind CSS v4, lucide-react
- **언어**: TypeScript
- **테스트**: Vitest

## 커맨드

```bash
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드
npm test           # 단위 테스트
npm run lint       # ESLint
```
