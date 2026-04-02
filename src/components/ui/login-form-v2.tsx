"use client";
import { useState, useTransition } from "react";
import { User, Lock, ArrowRight, ChefHat, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * A lightweight background pattern component using SVG and Gradients
 */
export function LightBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-zinc-950">
      {/* Animated Deep Gradient Background */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 via-zinc-900/70 to-blue-900/50 animate-[pulse_8s_infinite] transition-all duration-[4s]" />
      </div>
      
      {/* Subtle Pattern Overlay (Plus Signs) */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} 
      />

      {/* Deep Radial Glows for subtle color shifting */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-red-800/30 blur-[160px] rounded-full animate-[pulse_10s_infinite]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-800/30 blur-[160px] rounded-full animate-[pulse_12s_infinite] delay-1000" />
      <div className="absolute top-[20%] right-[-20%] w-[60%] h-[60%] bg-zinc-800/20 blur-[140px] rounded-full animate-[pulse_15s_infinite] delay-2000" />
      
      {/* Central Highlight behind the form */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40">
        <div className="w-[500px] h-[500px] bg-white/5 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}

/**
 * A glassmorphism-style login form component with animated labels.
 */
export function LoginForm() {
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
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-sm group"
    >
      <div className="absolute -inset-4 bg-gradient-to-br from-red-500/20 via-transparent to-zinc-500/10 blur-3xl rounded-[48px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      <div className="relative p-10 space-y-8 bg-white/90 backdrop-blur-3xl rounded-[32px] border border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25),0_16px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.03] overflow-hidden group-focus-within:ring-red-500/15 group-focus-within:shadow-[0_60px_120px_-30px_rgba(0,0,0,0.3)]">
        
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        <div className="text-center">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="bg-red-600 rounded-2xl p-3 shadow-[0_12px_24px_-8px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Ponto da Chipa</h1>
          </motion.div>
          
          <h2 className="text-xl font-bold text-zinc-800 tracking-tight">Bem-vindo de volta</h2>
          <p className="mt-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Sistema de Gestão Interna</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <AnimatePresence>
            {erro && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-4 text-xs overflow-hidden"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-medium leading-relaxed">{erro}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-0 group/field">
            <input
              type="email"
              id="floating_email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              className="block py-3 px-0 w-full text-sm font-bold text-zinc-900 bg-transparent border-0 border-b-2 border-zinc-100 appearance-none focus:outline-none focus:ring-0 focus:border-red-500 peer transition-all duration-300"
              placeholder=" "
              required
            />
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-500 peer-focus:w-full" />
            
            <label
              htmlFor="floating_email"
              className="absolute text-[11px] font-bold text-zinc-400 uppercase tracking-widest duration-300 transform -translate-y-8 scale-90 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-red-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-90 peer-focus:-translate-y-8 cursor-text group-hover/field:text-zinc-500 transition-all ease-in-out flex items-center"
            >
              <User className="mr-2 transition-transform duration-300 peer-focus:scale-110" size={14} />
              E-mail
            </label>
          </div>

          <div className="relative z-0 group/field">
            <input
              type={showSenha ? "text" : "password"}
              id="floating_password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={isPending}
              className="block py-3 px-0 w-full text-sm font-bold text-zinc-900 bg-transparent border-0 border-b-2 border-zinc-100 appearance-none focus:outline-none focus:ring-0 focus:border-red-500 peer transition-all duration-300 pr-10"
              placeholder=" "
              required
            />
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-500 peer-focus:w-full" />

            <label
              htmlFor="floating_password"
              className="absolute text-[11px] font-bold text-zinc-400 uppercase tracking-widest duration-300 transform -translate-y-8 scale-90 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-red-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-90 peer-focus:-translate-y-8 cursor-text group-hover/field:text-zinc-500 transition-all ease-in-out flex items-center"
            >
              <Lock className="mr-2 transition-transform duration-300 peer-focus:scale-110" size={14} />
              Senha
            </label>
            <button
              type="button"
              onClick={() => setShowSenha(!showSenha)}
              className="absolute right-0 top-3 text-zinc-300 hover:text-zinc-600 transition-colors"
              tabIndex={-1}
            >
              {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex items-center justify-end -mt-6">
            <button 
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-[10px] font-bold text-zinc-400 hover:text-red-500 uppercase tracking-widest transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isPending}
            className="group w-full h-14 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300"
          >
            {isPending ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Autenticando</span>
              </div>
            ) : (
              <>
                <span>Acessar Painel</span>
                <ArrowRight className="ml-3 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-zinc-100" />
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.4em]">
              Seguro
            </span>
            <div className="h-px w-8 bg-zinc-100" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
