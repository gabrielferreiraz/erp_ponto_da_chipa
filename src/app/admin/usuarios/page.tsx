'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus, Search, UserCircle, Shield, Mail, Calendar, MoreVertical, Trash2, Power, Edit3, Loader2, X, Check, Lock } from 'lucide-react'
import { getUsuariosAction, upsertUsuarioAction, toggleUsuarioStatusAction, deleteUsuarioAction } from '@/actions/usuarios'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  // Carregar usuários
  const loadUsuarios = async () => {
    try {
      const data = await getUsuariosAction()
      setUsuarios(data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsuarios() }, [])

  const filteredUsuarios = usuarios.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleStatus = async (user: any) => {
    try {
      await toggleUsuarioStatusAction(user.id, user.ativo)
      toast.success(`Usuário ${user.ativo ? 'desativado' : 'ativado'} com sucesso`)
      loadUsuarios()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário permanentemente?')) return
    try {
      await deleteUsuarioAction(id)
      toast.success('Usuário excluído com sucesso')
      loadUsuarios()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    
    startTransition(async () => {
      try {
        await upsertUsuarioAction({
          ...data,
          id: editingUser?.id,
          ativo: data.ativo === 'on'
        })
        toast.success(editingUser ? 'Usuário atualizado' : 'Usuário criado com sucesso')
        setIsModalOpen(false)
        setEditingUser(null)
        loadUsuarios()
      } catch (err: any) {
        toast.error(err.message)
      }
    })
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header Seção */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">Usuários</h1>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Gestão de Acessos e Níveis</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 pl-11 pr-6 bg-white border border-zinc-200/60 rounded-2xl text-sm font-medium w-full md:w-[300px] focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all shadow-sm"
            />
          </div>
          
          <button 
            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
            className="h-12 px-6 bg-zinc-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-zinc-900/10"
          >
            <Plus className="w-4 h-4" /> NOVO USUÁRIO
          </button>
        </div>
      </div>

      {/* Tabela Premium */}
      <div className="bg-white border border-zinc-200/60 rounded-[32px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_24px_-4px_rgba(0,0,0,0.04)] ring-1 ring-zinc-950/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Colaborador</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Nível</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Cadastro</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6 h-20 bg-zinc-50/20" />
                  </tr>
                ))
              ) : filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <UserCircle className="w-12 h-12 text-zinc-100" strokeWidth={1} />
                      <p className="text-sm font-medium text-zinc-400">Nenhum usuário encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((user) => (
                  <tr key={user.id} className="group hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200/50 group-hover:bg-white transition-colors">
                          <UserCircle className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 truncate leading-none">{user.nome}</p>
                          <p className="text-[11px] font-medium text-zinc-400 mt-1">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        user.role === 'ADMIN' ? "bg-red-50 text-red-600 border-red-100" :
                        user.role === 'CAIXA' ? "bg-blue-50 text-blue-600 border-blue-100" :
                        "bg-zinc-100 text-zinc-600 border-zinc-200"
                      )}>
                        <Shield className="w-3 h-3" /> {user.role}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <button 
                        onClick={() => handleToggleStatus(user)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                          user.ativo ? "text-emerald-600 hover:bg-emerald-50" : "text-zinc-400 hover:bg-zinc-100"
                        )}
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full", user.ativo ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-zinc-300")} />
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold tabular-nums">
                          {new Date(user.criadoEm).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                          className="p-2 rounded-xl bg-white border border-zinc-200/60 text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-all active:scale-90"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 rounded-xl bg-white border border-zinc-200/60 text-zinc-400 hover:text-red-600 hover:border-red-600 transition-all active:scale-90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Premium (Overlay) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[500px] bg-white rounded-[40px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25)] border border-zinc-200/50 overflow-hidden"
            >
              <div className="p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tighter text-zinc-900 uppercase">
                      {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                    </h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Preencha os dados de acesso</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 rounded-2xl bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Nome Completo</label>
                      <div className="relative">
                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                        <input name="nome" defaultValue={editingUser?.nome} required className="w-full h-14 pl-11 pr-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all" placeholder="Ex: João Silva" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">E-mail Corporativo</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                        <input type="email" name="email" defaultValue={editingUser?.email} required className="w-full h-14 pl-11 pr-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all" placeholder="joao@pontodachipa.com" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Nível de Acesso</label>
                        <select name="role" defaultValue={editingUser?.role || 'ATENDENTE'} className="w-full h-14 px-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all appearance-none">
                          <option value="ADMIN">ADMIN</option>
                          <option value="CAIXA">CAIXA</option>
                          <option value="ATENDENTE">ATENDENTE</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Senha de Acesso</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                          <input type="password" name="senha" required={!editingUser} className="w-full h-14 pl-11 pr-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all" placeholder={editingUser ? '••••••' : 'Senha forte'} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <input type="checkbox" name="ativo" defaultChecked={editingUser ? editingUser.ativo : true} className="w-5 h-5 rounded-lg border-zinc-200 text-zinc-900 focus:ring-zinc-900/10" id="ativo" />
                      <label htmlFor="ativo" className="text-sm font-bold text-zinc-700 cursor-pointer">Usuário Ativo e Autorizado</label>
                    </div>
                  </div>

                  <button 
                    disabled={isPending}
                    type="submit" 
                    className="w-full h-16 bg-zinc-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-zinc-900/20 hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <><Check className="w-5 h-5" /> {editingUser ? 'SALVAR ALTERAÇÕES' : 'CRIAR USUÁRIO'}</>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
