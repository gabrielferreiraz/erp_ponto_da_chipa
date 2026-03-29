'use client'

import { useState, useTransition, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, ChefHat, AlertCircle } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    startTransition(async () => {
      const result = await signIn('credentials', {
        email,
        senha,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setErro('Email ou senha inválidos. Verifique suas credenciais.')
        return
      }

      if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl shadow-amber-900/10 border border-amber-100/60 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 rounded-xl p-2.5">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ponto da Chipa</h1>
            <p className="text-amber-100 text-sm">Sistema de Gestão</p>
          </div>
        </div>
        <p className="text-amber-50/90 text-sm leading-relaxed">
          Acesse com suas credenciais de operador para continuar.
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
        {/* Erro */}
        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            autoComplete="email"
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 
                       placeholder:text-zinc-400 text-sm
                       focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
          />
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <label htmlFor="senha" className="block text-sm font-medium text-zinc-700">
            Senha
          </label>
          <div className="relative">
            <input
              id="senha"
              type={showSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 
                         placeholder:text-zinc-400 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowSenha(!showSenha)}
              disabled={isPending}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-1"
            >
              {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Botão Entrar */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl
                     shadow-lg shadow-zinc-200 active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                     transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Autenticando...</span>
            </>
          ) : (
            <span>Acessar Painel</span>
          )}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Suspense fallback={
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-zinc-500 font-medium animate-pulse">Carregando portal...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
