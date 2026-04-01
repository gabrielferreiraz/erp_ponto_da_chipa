'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'

const PRESETS = [
  { label: 'Hoje', value: 'hoje' },
  { label: 'Ontem', value: 'ontem' },
  { label: 'Esta Semana', value: 'semana' },
  { label: 'Este Mês', value: 'mes' },
  { label: 'Este Ano', value: 'ano' },
  { label: 'Personalizado', value: 'custom' },
]

export function PeriodoSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const periodoParam = searchParams.get('periodo') || 'hoje'
  const inicioParam = searchParams.get('inicio')
  const fimParam = searchParams.get('fim')

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (inicioParam && fimParam) {
      return { from: new Date(inicioParam), to: new Date(fimParam) }
    }
    return undefined
  })

  const updateURL = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value)
      else newParams.delete(key)
    })
    router.push(`?${newParams.toString()}`, { scroll: false })
  }

  const handlePeriodoChange = (val: string) => {
    if (val === 'custom') return
    updateURL({ periodo: val, inicio: null, fim: null })
  }

  const handleCustomRange = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      updateURL({ 
        periodo: 'custom', 
        inicio: format(range.from, 'yyyy-MM-dd'), 
        fim: format(range.to, 'yyyy-MM-dd') 
      })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Selector de Presets */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-zinc-100 shadow-sm ring-1 ring-black/[0.02]">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePeriodoChange(preset.value)}
            className={cn(
              "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
              periodoParam === preset.value && preset.value !== 'custom'
                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {preset.label}
          </button>
        ))}

        <div className="w-px h-4 bg-zinc-100 mx-1" />

        {/* Date Range Picker para Personalizado */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                periodoParam === 'custom'
                  ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                  : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              {periodoParam === 'custom' && dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                : 'Custom'}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl z-50" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleCustomRange}
              numberOfMonths={2}
              locale={ptBR}
              className="rounded-3xl border-zinc-100"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
