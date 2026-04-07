"use client"

import { useState } from "react"
import { ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Mode = "login" | "signup"

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()

  async function handleGoogleLogin() {
    setError(null)
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // 성공 시 Google 로그인 페이지로 리다이렉트되므로 별도 처리 불필요
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const supabase = createClient()

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push("/")
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setMessage("인증 메일을 발송했습니다. 메일함을 확인해주세요.")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setMessage(null)
  }

  return (
    <div className="w-full max-w-sm space-y-8 px-4">
      {/* 로고 */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500">
          <ClipboardList className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">할 일 목록</h1>
        <p className="text-sm text-zinc-500">
          {mode === "login" ? "계속하려면 로그인하세요" : "새 계정을 만드세요"}
        </p>
      </div>

      {/* 구글 로그인 */}
      <Button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {googleLoading ? (
          "처리 중…"
        ) : (
          <>
            <GoogleIcon />
            Google로 계속하기
          </>
        )}
      </Button>

      {/* 구분선 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-xs text-zinc-600">또는 이메일로</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500"
          />
          <Input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500"
          />
        </div>

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        {message && <p className="text-xs text-indigo-400 text-center">{message}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-500 hover:bg-indigo-400 text-white disabled:opacity-50"
        >
          {loading ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
        </Button>
      </form>

      {/* 모드 전환 */}
      <p className="text-center text-sm text-zinc-500">
        {mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
        <button
          type="button"
          onClick={() => switchMode(mode === "login" ? "signup" : "login")}
          className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {mode === "login" ? "회원가입" : "로그인"}
        </button>
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
