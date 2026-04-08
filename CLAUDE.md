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

## 현재 개발 상태

> **[필수] 태스크·스토리 완료 시마다 이 섹션을 반드시 업데이트한다.**  
> 업데이트 항목: 현재 브랜치, 완료된 스프린트, 스프린트 진행률, 태스크 현황 테이블.

| 항목 | 내용 |
|---|---|
| 버전 목표 | v2.0 |
| 현재 브랜치 | `feature/epic4-matrix-view` |
| 완료된 스프린트 | Sprint 1 (Epic 1), Sprint 2 (Epic 2), Sprint 3 (Epic 3), Sprint S (Epic S), Sprint 4 (Epic 4) |
| 스프린트 진행률 | Sprint 4 — 5 / 5 태스크 완료 |

### Sprint 4 진행 현황

| ID | 제목 | 상태 |
|---|---|---|
| E4-T1 | `todo-matrix.tsx` 컴포넌트 구현 (반응형 2×2 그리드) | ✅ 완료 |
| E4-S1 | 목록 뷰 ↔ 매트릭스 뷰 전환 | ✅ 완료 |
| E4-S2 | 매트릭스 뷰 4사분면 투두 배치 | ✅ 완료 |
| E4-S3 | 미분류 투두 별도 영역 표시 | ✅ 완료 |
| E4-S4 | 매트릭스 뷰에서 완료 토글·삭제 동작 | ✅ 완료 |

전체 스프린트 계획 → [plan/plan.md](plan/plan.md)  
Epic 4 상세 → [plan/epic4-matrix-view.md](plan/epic4-matrix-view.md)

---

## Next.js 16 주의사항

- 미들웨어 파일명: `middleware.ts` → **`proxy.ts`** (함수명도 `proxy`, config export는 `config`)
- `proxyConfig`는 인식되지 않음 — 반드시 `export const config = { matcher: [...] }` 사용

## 환경 변수

로컬 개발 시 `.env.local` 필요:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
