"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)

    const onInstalled = () => setDeferred(null)
    window.addEventListener("appinstalled", onInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (!deferred) return null

  const handleInstall = async () => {
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-indigo-400"
    >
      <Download className="h-3.5 w-3.5" />
      앱으로 설치
    </button>
  )
}
