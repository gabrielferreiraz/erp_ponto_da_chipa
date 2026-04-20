'use client'

import { forwardRef } from 'react'

interface ReciboFechamentoProps {
  data: string
  usuario: string
  fundoCaixa: number
  totalVendas: number
  totalDinheiro: number
  totalCartao: number
  totalPix: number
  sangrias: number
  suprimentos: number
  dinheiroFisico: number
  divergenciaDinheiro: number
  observacao?: string
}

export const ReciboFechamento = forwardRef<HTMLDivElement, ReciboFechamentoProps>(
  (
    {
      data,
      usuario,
      fundoCaixa,
      totalVendas,
      totalDinheiro,
      totalCartao,
      totalPix,
      sangrias,
      suprimentos,
      dinheiroFisico,
      divergenciaDinheiro,
      observacao,
    },
    ref
  ) => {
    const fmt = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

    return (
      <div ref={ref} className="font-mono text-black print:text-black w-full text-xs">
        {/* CSS para Impressão Térmica escondido na tela, ativo só no print */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              #receipt-print, #receipt-print * { visibility: visible; }
              #receipt-print {
                position: absolute;
                left: 0;
                top: 0;
                width: 80mm;
                padding: 4mm;
                line-height: 1.2;
              }
              .no-print { display: none; }
            }
          `
        }} />

        <div id="receipt-print" className="w-[80mm] p-4 bg-white mx-auto border border-zinc-200 print:border-none print:w-full print:p-0">
          <div className="text-center space-y-1 mb-4">
            <h2 className="text-base font-bold uppercase">Fechamento de Caixa</h2>
            <p>Ponto da Chipa</p>
            <p>Emissão: {new Date(data).toLocaleString('pt-BR')}</p>
            <p>Operador: {usuario}</p>
          </div>

          <div className="border-t border-dashed border-black my-2" />

          <div className="space-y-1 mb-2">
            <h3 className="font-bold uppercase text-[10px]">Valores de Venda</h3>
            <div className="flex justify-between"><span>Vendas Totais</span><span>{fmt(totalVendas)}</span></div>
            <div className="flex justify-between"><span>Dinheiro</span><span>{fmt(totalDinheiro)}</span></div>
            <div className="flex justify-between"><span>Pix</span><span>{fmt(totalPix)}</span></div>
            <div className="flex justify-between"><span>Cartão</span><span>{fmt(totalCartao)}</span></div>
          </div>

          <div className="border-t border-dashed border-black my-2" />

          <div className="space-y-1 mb-2">
            <h3 className="font-bold uppercase text-[10px]">Fluxo de Caixa (Físico)</h3>
            <div className="flex justify-between"><span>Fundo Inicial</span><span>{fmt(fundoCaixa)}</span></div>
            <div className="flex justify-between"><span>Suprimentos (+)</span><span>{fmt(suprimentos)}</span></div>
            <div className="flex justify-between"><span>Sangrias (-)</span><span>{fmt(sangrias)}</span></div>
            <div className="flex justify-between font-bold mt-1">
              <span>Físico Informado</span>
              <span>{fmt(dinheiroFisico)}</span>
            </div>
            <div className="flex justify-between font-bold mt-1">
              <span>Diferença Caixa</span>
              <span className={divergenciaDinheiro === 0 ? '' : 'text-xl'}>{divergenciaDinheiro === 0 ? 'Exato' : (divergenciaDinheiro > 0 ? '+' : '') + fmt(divergenciaDinheiro)}</span>
            </div>
          </div>

          {observacao && (
            <>
              <div className="border-t border-dashed border-black my-2" />
              <div className="space-y-1 mb-2">
                <h3 className="font-bold uppercase text-[10px]">Observações</h3>
                <p className="text-[10px] break-words">{observacao}</p>
              </div>
            </>
          )}

          <div className="border-t border-dashed border-black my-2" />

          <div className="mt-8 mb-4 text-center">
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <p className="text-[10px] uppercase">Assinatura Operador(a)</p>
          </div>

          <div className="mt-6 mb-4 text-center">
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <p className="text-[10px] uppercase">Assinatura Conferente</p>
          </div>
          
          <div className="text-center text-[9px] mt-6">
            *** Fim do Relatório ***
          </div>
        </div>
      </div>
    )
  }
)

ReciboFechamento.displayName = 'ReciboFechamento'
