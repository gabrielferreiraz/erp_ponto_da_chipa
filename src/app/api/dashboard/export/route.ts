import { NextResponse } from 'next/server'
import { DashboardService } from '@/services/dashboard.service'
import { withSecurity } from '@/lib/with-security'
import { format, parseISO, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const service = new DashboardService()

// ── Helpers ──────────────────────────────────────────────────────────────────

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function pct(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`
}

function periodoLabel(inicio: string | null, fim: string | null, periodo: string | null): string {
  const hoje = new Date()
  if (inicio && fim) {
    return `${format(parseISO(inicio), 'dd/MM/yyyy')} até ${format(parseISO(fim), 'dd/MM/yyyy')}`
  }
  switch (periodo) {
    case 'ontem':    return `Ontem — ${format(subDays(hoje, 1), 'dd/MM/yyyy')}`
    case 'semana':   return `Esta semana — ${format(startOfWeek(hoje, { weekStartsOn: 1 }), 'dd/MM')} a ${format(endOfWeek(hoje, { weekStartsOn: 1 }), 'dd/MM/yyyy')}`
    case 'mes':      return `${format(hoje, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}`
    case 'ano':      return `Ano ${format(hoje, 'yyyy')}`
    default:         return `Hoje — ${format(hoje, 'dd/MM/yyyy')}`
  }
}

function barHtml(value: number, max: number, color: string) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0
  return `<div style="background:#f4f4f5;border-radius:4px;height:8px;width:100%;"><div style="background:${color};border-radius:4px;height:8px;width:${w}%;"></div></div>`
}

// ── HTML Generator ────────────────────────────────────────────────────────────

function buildHTML(data: {
  kpis: any
  faturamento: any[]
  produtos: any[]
  pagamentos: any[]
  diaSemana: any[]
  cancelamentos: any[]
  mesas: any[]
  localViagem: any[]
}, periodo: string, geradoEm: string): string {

  const { kpis, faturamento, produtos, pagamentos, diaSemana, cancelamentos, mesas } = data

  // Derived values
  const maxFat = Math.max(...faturamento.map(f => f.total), 1)
  const maxProd = Math.max(...produtos.map(p => p.receita), 1)
  const maxMesa = Math.max(...mesas.map(m => m.faturamento), 1)
  const maxCan = Math.max(...cancelamentos.map(c => c.valorPerdido), 1)
  const maxDia = Math.max(...diaSemana.map(d => d.total), 1)
  const totalPagamentos = pagamentos.reduce((a, p) => a + p.valor, 0)
  const horaPicoLabel = kpis.horaPico != null
    ? `${String(kpis.horaPico).padStart(2, '0')}h–${String(kpis.horaPico + 1).padStart(2, '0')}h`
    : '—'

  // ── Sections HTML ──

  const kpiSection = `
  <div class="section">
    <h2 class="section-title">Resumo Executivo</h2>
    <div class="kpi-grid">
      <div class="kpi-card kpi-emerald">
        <div class="kpi-label">Faturamento Total</div>
        <div class="kpi-value">${brl(kpis.totalFaturado)}</div>
        <div class="kpi-sub">${kpis.pedidosPagos} pedidos pagos</div>
      </div>
      <div class="kpi-card kpi-blue">
        <div class="kpi-label">Ticket Médio</div>
        <div class="kpi-value">${brl(kpis.ticketMedio)}</div>
        <div class="kpi-sub">por pedido</div>
      </div>
      <div class="kpi-card kpi-orange">
        <div class="kpi-label">Pedidos Realizados</div>
        <div class="kpi-value">${kpis.pedidosPagos}</div>
        <div class="kpi-sub">no período</div>
      </div>
      <div class="kpi-card kpi-rose">
        <div class="kpi-label">Valor Cancelado</div>
        <div class="kpi-value">${brl(kpis.valorCancelado)}</div>
        <div class="kpi-sub">${kpis.totalCancelado} itens cancelados</div>
      </div>
      <div class="kpi-card kpi-indigo">
        <div class="kpi-label">Mix de Vendas</div>
        <div class="kpi-value">${pct(kpis.percentualLocal)} Local</div>
        <div class="kpi-sub">${pct(kpis.percentualViagem)} Para viagem</div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-label">Hora de Pico</div>
        <div class="kpi-value">${horaPicoLabel}</div>
        <div class="kpi-sub">maior volume do dia</div>
      </div>
    </div>
  </div>`

  const faturamentoSection = faturamento.length === 0 ? '' : `
  <div class="section">
    <h2 class="section-title">Faturamento por Período</h2>
    <table>
      <thead><tr><th>Período</th><th class="right">Faturamento</th><th style="width:40%">Distribuição</th></tr></thead>
      <tbody>
        ${faturamento.map(f => `
          <tr>
            <td>${f.periodo}</td>
            <td class="right mono">${brl(f.total)}</td>
            <td>${barHtml(f.total, maxFat, '#10b981')}</td>
          </tr>`).join('')}
        <tr class="total-row">
          <td><strong>Total</strong></td>
          <td class="right mono"><strong>${brl(faturamento.reduce((a, f) => a + f.total, 0))}</strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>`

  const produtosSection = produtos.length === 0 ? '' : `
  <div class="section">
    <h2 class="section-title">Ranking de Produtos</h2>
    <table>
      <thead>
        <tr>
          <th style="width:32px">#</th>
          <th>Produto</th>
          <th>Categoria</th>
          <th class="right">Qtd</th>
          <th class="right">Ticket Médio</th>
          <th class="right">Receita</th>
          <th style="width:20%">Volume</th>
        </tr>
      </thead>
      <tbody>
        ${produtos.slice(0, 10).map((p, i) => `
          <tr>
            <td><span class="badge ${i === 0 ? 'badge-gold' : i === 1 ? 'badge-silver' : i === 2 ? 'badge-bronze' : 'badge-gray'}">${i + 1}</span></td>
            <td><strong>${p.nome}</strong></td>
            <td><span class="tag">${p.categoria}</span></td>
            <td class="right mono">${p.quantidade}</td>
            <td class="right mono">${brl(p.ticketMedio)}</td>
            <td class="right mono">${brl(p.receita)}</td>
            <td>${barHtml(p.receita, maxProd, '#3b82f6')}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>`

  const pagamentosSection = pagamentos.length === 0 ? '' : `
  <div class="section">
    <h2 class="section-title">Formas de Pagamento</h2>
    <table>
      <thead><tr><th>Forma</th><th class="right">Transações</th><th class="right">Total</th><th class="right">Participação</th><th style="width:30%">Distribuição</th></tr></thead>
      <tbody>
        ${pagamentos.map(p => `
          <tr>
            <td><strong>${p.forma}</strong></td>
            <td class="right mono">${p.quantidade}</td>
            <td class="right mono">${brl(p.valor)}</td>
            <td class="right mono">${pct(totalPagamentos > 0 ? (p.valor / totalPagamentos) * 100 : 0)}</td>
            <td>${barHtml(p.valor, totalPagamentos, '#f59e0b')}</td>
          </tr>`).join('')}
        <tr class="total-row">
          <td><strong>Total</strong></td>
          <td class="right mono"><strong>${pagamentos.reduce((a, p) => a + p.quantidade, 0)}</strong></td>
          <td class="right mono"><strong>${brl(totalPagamentos)}</strong></td>
          <td class="right mono">100%</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>`

  const diaSemanaSection = diaSemana.length === 0 ? '' : `
  <div class="section">
    <h2 class="section-title">Vendas por Dia da Semana</h2>
    <table>
      <thead><tr><th>Dia</th><th class="right">Faturamento</th><th style="width:50%">Volume Relativo</th></tr></thead>
      <tbody>
        ${diaSemana.map(d => `
          <tr>
            <td><strong>${d.dia}</strong></td>
            <td class="right mono">${brl(d.total)}</td>
            <td>${barHtml(d.total, maxDia, '#6366f1')}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>`

  const cancelamentosSection = cancelamentos.length === 0 ? `
  <div class="section">
    <h2 class="section-title">Análise de Cancelamentos</h2>
    <div class="empty">Nenhum cancelamento registrado no período.</div>
  </div>` : `
  <div class="section">
    <h2 class="section-title">Análise de Cancelamentos</h2>
    <p class="section-note">Itens cancelados e impacto financeiro no período selecionado.</p>
    <table>
      <thead><tr><th>Produto</th><th>Motivo Principal</th><th class="right">Qtd</th><th class="right">Valor Perdido</th><th style="width:25%">Impacto</th></tr></thead>
      <tbody>
        ${cancelamentos.map(c => `
          <tr>
            <td><strong>${c.produto}</strong></td>
            <td>${c.motivoPrincipal || '—'}</td>
            <td class="right mono">${c.quantidade}</td>
            <td class="right mono loss">${brl(c.valorPerdido)}</td>
            <td>${barHtml(c.valorPerdido, maxCan, '#f43f5e')}</td>
          </tr>`).join('')}
        <tr class="total-row">
          <td colspan="2"><strong>Total de perdas</strong></td>
          <td class="right mono"><strong>${cancelamentos.reduce((a, c) => a + c.quantidade, 0)}</strong></td>
          <td class="right mono loss"><strong>${brl(cancelamentos.reduce((a, c) => a + c.valorPerdido, 0))}</strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>`

  const mesasSection = mesas.length === 0 ? '' : `
  <div class="section">
    <h2 class="section-title">Performance de Mesas</h2>
    <table>
      <thead><tr><th>Mesa</th><th class="right">Pedidos</th><th class="right">Ticket Médio</th><th class="right">Faturamento</th><th style="width:25%">Volume</th></tr></thead>
      <tbody>
        ${mesas.map((m, i) => `
          <tr>
            <td><span class="badge ${i === 0 ? 'badge-gold' : 'badge-gray'}">Mesa ${m.numero}</span></td>
            <td class="right mono">${m.pedidos}</td>
            <td class="right mono">${brl(m.ticketMedio)}</td>
            <td class="right mono">${brl(m.faturamento)}</td>
            <td>${barHtml(m.faturamento, maxMesa, '#8b5cf6')}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>`

  // ── Full HTML ──

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatório — Ponto da Chipa</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #18181b;
      background: #fff;
      padding: 0;
    }

    /* ── Print controls (screen only) ── */
    .print-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      background: #18181b; color: #fff;
      padding: 12px 32px; gap: 16px;
      font-size: 12px; font-weight: 600; letter-spacing: 0.05em;
    }
    .print-bar .actions { display: flex; gap: 8px; }
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 18px; border-radius: 10px; font-size: 12px;
      font-weight: 700; cursor: pointer; border: none; transition: all 0.15s;
    }
    .btn-primary { background: #e11d48; color: #fff; }
    .btn-primary:hover { background: #be123c; }
    .btn-ghost { background: rgba(255,255,255,0.1); color: #fff; }
    .btn-ghost:hover { background: rgba(255,255,255,0.2); }

    /* ── Page layout ── */
    .report { max-width: 960px; margin: 0 auto; padding: 72px 40px 60px; }

    /* ── Cover ── */
    .cover {
      padding: 60px 0 48px;
      border-bottom: 2px solid #18181b;
      margin-bottom: 48px;
    }
    .cover-logo {
      display: flex; align-items: center; gap: 16px; margin-bottom: 32px;
    }
    .cover-icon {
      width: 52px; height: 52px; border-radius: 16px;
      background: linear-gradient(135deg, #f29100, #e24a07, #b91c1c);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
    }
    .cover-company { font-size: 26px; font-weight: 900; letter-spacing: -0.02em; }
    .cover-subtitle { font-size: 11px; font-weight: 700; color: #71717a; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; }
    .cover-title { font-size: 36px; font-weight: 900; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 16px; }
    .cover-meta { display: flex; gap: 32px; flex-wrap: wrap; margin-top: 24px; }
    .cover-meta-item label { display: block; font-size: 9px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 4px; }
    .cover-meta-item span { font-size: 14px; font-weight: 700; color: #18181b; }
    .cover-period { font-size: 15px; font-weight: 700; color: #e24a07; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 8px 16px; display: inline-block; margin-top: 8px; }

    /* ── Sections ── */
    .section { margin-bottom: 48px; }
    .section-title {
      font-size: 16px; font-weight: 900; letter-spacing: -0.01em;
      color: #18181b; margin-bottom: 6px;
      padding-bottom: 10px; border-bottom: 1.5px solid #f4f4f5;
    }
    .section-note { font-size: 12px; color: #71717a; margin-bottom: 12px; }
    .empty { font-size: 13px; color: #a1a1aa; padding: 24px; text-align: center; background: #fafafa; border-radius: 12px; border: 1px dashed #e4e4e7; }

    /* ── KPI Grid ── */
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .kpi-card { padding: 16px 20px; border-radius: 14px; border: 1px solid; }
    .kpi-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px; }
    .kpi-value { font-size: 22px; font-weight: 900; letter-spacing: -0.02em; line-height: 1; }
    .kpi-sub { font-size: 11px; font-weight: 600; margin-top: 6px; opacity: 0.7; }
    .kpi-emerald { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
    .kpi-blue { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
    .kpi-orange { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }
    .kpi-rose { background: #fff1f2; border-color: #fecdd3; color: #9f1239; }
    .kpi-indigo { background: #eef2ff; border-color: #c7d2fe; color: #3730a3; }
    .kpi-purple { background: #faf5ff; border-color: #e9d5ff; color: #6b21a8; }

    /* ── Tables ── */
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #fafafa; }
    th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; border-bottom: 1.5px solid #e4e4e7; }
    td { padding: 9px 12px; border-bottom: 1px solid #f4f4f5; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: #fafafa; }
    .total-row td { background: #fafafa; border-top: 1.5px solid #e4e4e7; }
    .right { text-align: right; }
    .mono { font-variant-numeric: tabular-nums; font-family: 'SF Mono', 'Fira Code', monospace; }
    .loss { color: #e11d48; }

    /* ── Badges & Tags ── */
    .badge { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; }
    .badge-gold { background: #fef9c3; color: #713f12; }
    .badge-silver { background: #f1f5f9; color: #334155; }
    .badge-bronze { background: #fef3c7; color: #78350f; }
    .badge-gray { background: #f4f4f5; color: #52525b; }
    .tag { display: inline-block; padding: 2px 8px; background: #f4f4f5; border-radius: 6px; font-size: 11px; font-weight: 600; color: #52525b; }

    /* ── Footer ── */
    .footer {
      margin-top: 60px; padding-top: 20px;
      border-top: 1px solid #e4e4e7;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 10px; font-weight: 600; color: #a1a1aa;
      text-transform: uppercase; letter-spacing: 0.12em;
    }
    .footer-brand { font-weight: 800; color: #71717a; }

    /* ── Print ── */
    @media print {
      .print-bar { display: none !important; }
      .report { padding: 0; }
      body { font-size: 12px; }
      .kpi-grid { grid-template-columns: repeat(3, 1fr); }
      .section { page-break-inside: avoid; }
      .cover { page-break-after: always; }
      @page { size: A4; margin: 18mm 16mm; }
    }
  </style>
</head>
<body>

  <!-- Print Bar (screen only) -->
  <div class="print-bar">
    <span>📊 Relatório de Gestão — Ponto da Chipa</span>
    <div class="actions">
      <button class="btn btn-ghost" onclick="window.close()">Fechar</button>
      <button class="btn btn-primary" onclick="window.print()">⬇ Salvar / Imprimir PDF</button>
    </div>
  </div>

  <div class="report">

    <!-- Cover -->
    <div class="cover">
      <div class="cover-logo">
        <div class="cover-icon">🍢</div>
        <div>
          <div class="cover-company">Ponto da Chipa</div>
          <div class="cover-subtitle">Sistema de Gestão Interno</div>
        </div>
      </div>
      <div class="cover-title">Relatório de<br>Gestão & Desempenho</div>
      <div class="cover-period">${periodo}</div>
      <div class="cover-meta">
        <div class="cover-meta-item">
          <label>Gerado em</label>
          <span>${geradoEm}</span>
        </div>
        <div class="cover-meta-item">
          <label>Pedidos pagos</label>
          <span>${kpis.pedidosPagos}</span>
        </div>
        <div class="cover-meta-item">
          <label>Faturamento</label>
          <span>${brl(kpis.totalFaturado)}</span>
        </div>
        <div class="cover-meta-item">
          <label>Ticket médio</label>
          <span>${brl(kpis.ticketMedio)}</span>
        </div>
      </div>
    </div>

    <!-- Sections -->
    ${kpiSection}
    ${faturamentoSection}
    ${produtosSection}
    ${pagamentosSection}
    ${diaSemanaSection}
    ${cancelamentosSection}
    ${mesasSection}

    <!-- Footer -->
    <div class="footer">
      <span class="footer-brand">Ponto da Chipa — ERP Interno</span>
      <span>Relatório gerado em ${geradoEm}</span>
    </div>

  </div>

  <script>
    // Auto-print only if opened via export (has ?autoprint=1)
    if (new URLSearchParams(location.search).get('autoprint') === '1') {
      window.addEventListener('load', () => {
        setTimeout(() => window.print(), 600)
      })
    }
  </script>
</body>
</html>`
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export const GET = withSecurity(async (request: Request) => {
  const url = new URL(request.url)
  const inicio = url.searchParams.get('inicio')
  const fim = url.searchParams.get('fim')
  const periodo = url.searchParams.get('periodo') || 'hoje'

  // Fetch all data in parallel
  const [kpis, faturamento, produtos, pagamentos, diaSemana, cancelamentos, mesas, localViagem] =
    await Promise.all([
      service.getKPIs(inicio, fim, periodo),
      service.getFaturamentoSerie(inicio, fim, periodo),
      service.getRankingProdutos(inicio, fim, periodo),
      service.getFormasPagamento(inicio, fim, periodo),
      service.getPorDiaSemana(inicio, fim, periodo),
      service.getCancelamentos(inicio, fim, periodo),
      service.getMesas(inicio, fim, periodo),
      service.getLocalVsViagem(inicio, fim, periodo),
    ])

  const label = periodoLabel(inicio, fim, periodo)
  const geradoEm = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())

  const html = buildHTML(
    { kpis, faturamento, produtos, pagamentos, diaSemana, cancelamentos, mesas, localViagem },
    label,
    geradoEm,
  )

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}, { roles: ['ADMIN'] })
