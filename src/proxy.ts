import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  // 환경 변수 미설정 시 통과
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신 (getUser()는 반드시 호출해야 함)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 인증 안 된 사용자 → /auth 로 리다이렉트
  if (!user && !pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth"
    return NextResponse.redirect(url)
  }

  // 이미 인증된 사용자가 /auth 접근 → / 로 리다이렉트
  if (user && pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  // 페이지 경로만 대상으로 함 — Turbopack JS 청크 등 기타 요청 제외
  matcher: ["/", "/auth", "/auth/callback"],
}
