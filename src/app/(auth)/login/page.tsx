import { Suspense } from 'react'
import { LightBackground, LoginForm } from "@/components/ui/login-form-v2"

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <LightBackground />
      <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
        <div className="w-[720px] h-[720px] rounded-full bg-white/70 blur-[120px] ring-1 ring-white/60 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.15)]" />
      </div>
      
      <div className="relative z-10 w-full flex items-center justify-center p-4">
        <Suspense fallback={
          <div className="w-full max-w-sm h-[450px] bg-white/40 backdrop-blur-2xl rounded-[32px] animate-pulse flex items-center justify-center border border-white shadow-xl">
            <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>

      <div className="absolute bottom-8 left-0 w-full text-center z-10">
        <p className="text-[10px] text-zinc-400 font-bold tracking-[0.2em] uppercase">
          © 2026 Ponto da Chipa • ERP Interno
        </p>
      </div>
    </main>
  )
}
