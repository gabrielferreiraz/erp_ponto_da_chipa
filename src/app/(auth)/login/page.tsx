import { Suspense } from 'react'
import { SmokeyBackground, LoginForm } from "@/components/ui/login-form-v2"

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-zinc-950">
      {/* Background Shader com a cor Vermelha do Ponto da Chipa */}
      <SmokeyBackground 
        className="absolute inset-0 z-0" 
        color="#EF4444" 
        backdropBlurAmount="xl"
      />
      
      {/* Container Central com Glassmorphism */}
      <div className="relative z-10 w-full flex items-center justify-center p-4">
        <Suspense fallback={
          <div className="w-full max-w-sm h-[450px] bg-white/5 backdrop-blur-xl rounded-2xl animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>

      {/* Footer minimalista */}
      <div className="absolute bottom-6 left-0 w-full text-center z-10">
        <p className="text-[10px] text-zinc-50/20 font-medium tracking-widest uppercase">
          © 2026 Ponto da Chipa • ERP Interno
        </p>
      </div>
    </main>
  )
}
