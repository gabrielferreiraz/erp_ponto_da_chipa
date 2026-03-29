'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  XCircle, 
  ClipboardCheck,
  Package,
  ArrowRight
} from 'lucide-react'
import { useTurnoStatus } from '@/hooks/use-turno-status'
import { useEstoque } from '@/hooks/use-estoque'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function FechamentoPage() {
  const { status, mutate: mutateStatus, isLoading: loadingStatus } = useTurnoStatus()
  const { dashboard, isLoading: loadingEstoque } = useEstoque()
  
  const [contagens, setContagens] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Inicializa contagens quando o fechamento é iniciado
  useEffect(() => {
    if (status?.isClosingShift && dashboard?.produtos) {
      const initial: Record<string, number> = {}
      dashboard.produtos.forEach(p => {
        initial[p.id] = p.qtdVisor
      })
      setContagens(initial)
    }
  }, [status?.isClosingShift, dashboard?.produtos])

  const handleIniciar = async () => {
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/turno/iniciar-fechamento', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao iniciar fechamento')
      }
      toast.success('Fechamento iniciado com sucesso!')
      mutateStatus()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelar = async () => {
    if (!confirm('Tem certeza que deseja cancelar o fechamento em andamento?')) return
    try {
      setIsSubmitting(true)
      await fetch('/api/turno/cancelar-fechamento', { method: 'POST' })
      toast.info('Fechamento cancelado.')
      mutateStatus()
    } catch (error: any) {
      toast.error('Erro ao cancelar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmarFinal = async () => {
    try {
      setIsSubmitting(true)
      const payload = Object.entries(contagens).map(([produtoId, qtdFisica]) => ({
        produtoId,
        qtdFisica
      }))

      const res = await fetch('/api/turno/confirmar-fechamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao finalizar fechamento')
      }

      toast.success('Turno fechado com sucesso e estoque ajustado!')
      setShowConfirmModal(false)
      mutateStatus()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDivergencias = () => {
    if (!dashboard?.produtos) return { count: 0, totalAjuste: 0 }
    let count = 0
    let totalAjuste = 0
    dashboard.produtos.forEach(p => {
      const fisica = contagens[p.id] ?? p.qtdVisor
      if (fisica !== p.qtdVisor) {
        count++
        totalAjuste += Math.abs(fisica - p.qtdVisor)
      }
    })
    return { count, totalAjuste }
  }

  if (loadingStatus) return <div className="p-8"><Skeleton className="h-20 w-full" /></div>

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">Fechamento de Turno</h1>
          <p className="text-zinc-500 font-medium">Controle de inventário e encerramento operacional.</p>
        </div>

        {!status?.isClosingShift ? (
          <div className="flex flex-col items-end gap-2">
            {status?.pedidosPendentes! > 0 && (
              <Badge variant="destructive" className="flex gap-1 py-1 px-3">
                <AlertCircle className="w-3 h-3" />
                {status?.pedidosPendentes} pedidos pendentes
              </Badge>
            )}
            <Button 
              size="lg" 
              className="bg-zinc-900 hover:bg-zinc-800 font-bold gap-2 h-12 px-6 rounded-xl shadow-lg shadow-zinc-200"
              disabled={status?.pedidosPendentes! > 0 || isSubmitting}
              onClick={handleIniciar}
            >
              <Play className="w-4 h-4 fill-white" /> Iniciar Fechamento
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="font-bold gap-2 h-12 px-6 rounded-xl border-zinc-200 text-zinc-500 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all"
              onClick={handleCancelar}
              disabled={isSubmitting}
            >
              <XCircle className="w-4 h-4" /> Cancelar
            </Button>
            <Button 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 font-black gap-2 h-12 px-8 rounded-xl shadow-lg shadow-emerald-100"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
            >
              <ClipboardCheck className="w-5 h-5" /> Finalizar Turno
            </Button>
          </div>
        )}
      </header>

      {status?.isClosingShift ? (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="p-8 border-b border-zinc-50 bg-amber-50/30">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                   <Package className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                   <CardTitle className="text-xl font-black text-zinc-900">Contagem Física do Visor</CardTitle>
                   <CardDescription className="text-amber-700 font-bold">
                     Iniciado por {status.usuarioIniciou} • Informe a quantidade real observada em cada item do visor.
                   </CardDescription>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="hover:bg-transparent border-b border-zinc-100">
                  <TableHead className="px-8 h-14 font-black text-zinc-400 uppercase tracking-widest text-[10px]">Produto</TableHead>
                  <TableHead className="h-14 font-black text-zinc-400 uppercase tracking-widest text-[10px] text-center">Sistema</TableHead>
                  <TableHead className="h-14 font-black text-zinc-400 uppercase tracking-widest text-[10px] text-center w-[180px]">Físico</TableHead>
                  <TableHead className="px-8 h-14 font-black text-zinc-400 uppercase tracking-widest text-[10px] text-right">Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEstoque ? (
                  <TableRow><TableCell colSpan={4} className="h-32 text-center"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ) : dashboard?.produtos.map((p) => {
                  const qtdFisica = contagens[p.id] ?? p.qtdVisor
                  const diferenca = qtdFisica - p.qtdVisor
                  const hasDivergence = diferenca !== 0

                  return (
                    <TableRow 
                      key={p.id} 
                      className={cn(
                        "transition-colors group",
                        hasDivergence ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-zinc-50"
                      )}
                    >
                      <TableCell className="px-8 py-5">
                        <div className="font-bold text-zinc-900 group-hover:translate-x-1 transition-transform">{p.nome}</div>
                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">{p.categoria}</div>
                      </TableCell>
                      <TableCell className="text-center font-black text-zinc-500 text-lg">
                        {p.qtdVisor}
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex justify-center">
                          <Input 
                            type="number" 
                            className="w-24 h-11 text-center font-black text-lg rounded-xl border-zinc-200 focus:ring-zinc-900 focus:border-zinc-900 shadow-sm"
                            value={qtdFisica}
                            onChange={(e) => setContagens(prev => ({ ...prev, [p.id]: parseInt(e.target.value) || 0 }))}
                            min={0}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <div className={cn(
                          "font-black text-lg",
                          diferenca === 0 ? "text-zinc-300" : (diferenca > 0 ? "text-emerald-600" : "text-rose-600")
                        )}>
                          {diferenca === 0 ? '-' : (diferenca > 0 ? `+${diferenca}` : diferenca)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
           <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-zinc-200" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-black text-zinc-900">Operação Normal</h2>
              <p className="text-zinc-400 font-medium max-w-[320px]">
                Nenhum fechamento em andamento. Inicie o processo quando o turno acabar.
              </p>
           </div>
        </div>
      )}

      {/* Modal de Confirmação em 2 passos */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-zinc-900 text-white">
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
               <ClipboardCheck className="w-6 h-6 text-indigo-400" />
               Confirmar Fechamento
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium pt-2 text-base">
               Revise as divergências encontradas antes de consolidar os ajustes no estoque.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-8 space-y-6 bg-white">
             <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                   <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Divergências</span>
                   <span className="text-3xl font-black text-zinc-900">{getDivergencias().count}</span>
                   <span className="text-xs font-bold text-zinc-400 block mt-1">Produtos afetados</span>
                </div>
                <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                   <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Ajustado</span>
                   <span className="text-3xl font-black text-zinc-900">{getDivergencias().totalAjuste}</span>
                   <span className="text-xs font-bold text-zinc-400 block mt-1">Unidades físicas</span>
                </div>
             </div>

             <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-amber-800 leading-relaxed">
                   Esta ação registrará movimentações de estoque automáticas para equilibrar as quantidades físicas informadas.
                </p>
             </div>
          </div>

          <DialogFooter className="p-8 pt-0 bg-white gap-3 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              className="w-full h-12 font-bold rounded-xl border-zinc-200"
              onClick={() => setShowConfirmModal(false)}
            >
              Voltar e Revisar
            </Button>
            <Button 
              className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 font-black rounded-xl gap-2 shadow-lg shadow-zinc-200"
              onClick={handleConfirmarFinal}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="animate-spin h-5 w-5 border-2 border-white/40 border-t-white rounded-full"></span>
              ) : (
                <>Confirmar e Fechar <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
