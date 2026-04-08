# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 문서

- [PRD](doc/prd.md) — 기능 요구사항, 사용자 스토리
- [Architecture](doc/architecture.md) — 기술 스택, 요청 흐름, DB 스키마, 배포 구조
- [UI 표준](doc/ui-standards.md) — 색상, 컴포넌트 사용법, 레이아웃 규칙
- [개발 표준](doc/dev-standards.md) — 타입, 네이밍, 테스트, 커밋 컨벤션

## 명령어

```bash
npm run dev        # 개발 서버 (http://localhost:3000)
npm run build      # 프로덕션 빌드
npm test           # Vitest 단위 테스트 1회 실행
npm run test:watch # Vitest watch 모드
npm run lint       # ESLint
npx vitest run src/lib/todo-utils.test.ts  # 단일 파일 테스트
```

## Next.js 16 주의사항

- 미들웨어 파일명: `middleware.ts` → **`proxy.ts`** (함수명도 `proxy`, config export는 `config`)
- `proxyConfig`는 인식되지 않음 — 반드시 `export const config = { matcher: [...] }` 사용

## 환경 변수

로컬 개발 시 `.env.local` 필요:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
