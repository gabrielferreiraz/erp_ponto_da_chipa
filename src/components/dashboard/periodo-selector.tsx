'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { Calendar as CalendarIcon, ChevronDown, ArrowRight, Check } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'
import 'react-day-picker/src/style.css'

const PRESETS = [
  { label: 'Hoje', value: 'hoje' },
  { label: 'Ontem', value: 'ontem' },
  { label: 'Esta Semana', value: 'semana' },
  { label: 'Este Mês', value: 'mes' },
  { label: 'Este Ano', value: 'ano' },
]

export function PeriodoSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const periodoParam = searchParams.get('periodo') || 'hoje'
  const inicioParam = searchParams.get('inicio')
  const fimParam = searchParams.get('fim')

  const activeRange: DateRange | undefined =
    inicioParam && fimParam
      ? { from: new Date(inicioParam), to: new Date(fimParam) }
      : undefined

  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(undefined)
  const [open, setOpen] = useState(false)

  const updateURL = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value)
      else newParams.delete(key)
    })
    router.push(`?${newParams.toString()}`, { scroll: false })
  }

  const handlePeriodoChange = (val: string) => {
    updateURL({ periodo: val, inicio: null, fim: null })
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      // reset pending to current active range when opening
      setPendingRange(activeRange)
    }
  }

  const handleConfirm = () => {
    if (!pendingRange?.from || !pendingRange?.to) return
    updateURL({
      periodo: 'custom',
      inicio: format(pendingRange.from, 'yyyy-MM-dd'),
      fim: format(pendingRange.to, 'yyyy-MM-dd'),
    })
    setOpen(false)
  }

  const isCustomActive = periodoParam === 'custom' && !!activeRange?.from && !!activeRange?.to

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-zinc-100 shadow-sm ring-1 ring-black/[0.02]">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePeriodoChange(preset.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
              periodoParam === preset.value
                ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200'
                : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
            )}
          >
            {preset.label}
          </button>
        ))}

        <div className="w-px h-4 bg-zinc-100 mx-1" />

        {/* Custom date range popover */}
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
                isCustomActive
                  ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                  : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              {isCustomActive ? (
                <span>
                  {format(activeRange!.from!, 'dd/MM')}
                  <span className="opacity-50 mx-1">→</span>
                  {format(activeRange!.to!, 'dd/MM')}
                </span>
              ) : (
                'Custom'
              )}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="w-auto p-0 rounded-3xl border border-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.12)] z-50 bg-white overflow-hidden"
            align="end"
            sideOffset={8}
          >
            {/* Header: De / Até */}
            <div className="px-6 pt-5 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">De</p>
                  <p className={cn(
                    'text-lg font-black tabular-nums transition-colors',
                    pendingRange?.from ? 'text-rose-600' : 'text-zinc-300'
                  )}>
                    {pendingRange?.from ? format(pendingRange.from, 'dd/MM/yyyy') : '-- / --'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-300 shrink-0" />
                <div className="flex-1 text-right">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Até</p>
                  <p className={cn(
                    'text-lg font-black tabular-nums transition-colors',
                    pendingRange?.to ? 'text-rose-600' : 'text-zinc-300'
                  )}>
                    {pendingRange?.to ? format(pendingRange.to, 'dd/MM/yyyy') : '-- / --'}
                  </p>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="px-4 py-4 rdp-custom">
              <DayPicker
                mode="range"
                selected={pendingRange}
                onSelect={setPendingRange}
                numberOfMonths={2}
                locale={ptBR}
                defaultMonth={pendingRange?.from ?? activeRange?.from}
              />
            </div>

            {/* Actions */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
              <p className="text-[10px] text-zinc-400 font-medium">
                {!pendingRange?.from
                  ? 'Clique em um dia para iniciar'
                  : !pendingRange?.to
                    ? 'Clique no dia final'
                    : `${Math.round(Math.abs((pendingRange.to!.getTime() - pendingRange.from!.getTime()) / 86400000)) + 1} dias`}
              </p>
              <button
                onClick={handleConfirm}
                disabled={!pendingRange?.from || !pendingRange?.to}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                OK
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
