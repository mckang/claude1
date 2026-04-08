import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 터널(pinggy/ngrok/Cloudflare)·프록시 환경에서는 request.url이 내부 host(localhost)를
  // 가리키므로 X-Forwarded-* 헤더로 원본 origin을 복원한다.
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const origin =
    forwardedHost && forwardedProto
      ? `${forwardedProto}://${forwardedHost}`
      : url.origin

  return NextResponse.redirect(`${origin}/`)
}
