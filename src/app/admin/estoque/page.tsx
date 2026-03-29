'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, 
  Package, 
  ArrowRightLeft, 
  PlusCircle, 
  MinusCircle, 
  History,
  TrendingDown,
  Clock,
  User,
  Info
} from 'lucide-react'
import { useEstoque, ProdutoEstoqueFrontend } from '@/hooks/use-estoque'
import { useMovimentacoes } from '@/hooks/use-movimentacoes'
import { ModalReposicao } from '@/components/estoque/modais/modal-reposicao'
import { ModalEntrada } from '@/components/estoque/modais/modal-entrada'
import { ModalAjuste } from '@/components/estoque/modais/modal-ajuste'
import { ModalPerda } from '@/components/estoque/modais/modal-perda'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function EstoquePage() {
  const { dashboard, isLoading: loadingDash, mutate: mutateDash } = useEstoque()
  const { 
    movimentacoes, 
    hasMore, 
    loadMore, 
    isLoading: loadingMovs,
    mutate: mutateMovs
  } = useMovimentacoes()

  const [selRepo, setSelRepo] = useState<ProdutoEstoqueFrontend | null>(null)
  const [selEntrada, setSelEntrada] = useState<ProdutoEstoqueFrontend | null>(null)
  const [selAjuste, setSelAjuste] = useState<ProdutoEstoqueFrontend | null>(null)
  const [selPerda, setSelPerda] = useState<ProdutoEstoqueFrontend | null>(null)

  const handleSuccess = () => {
    mutateDash()
    mutateMovs()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CRITICO':
        return <Badge variant="destructive" className="bg-red-600">CRÍTICO</Badge>
      case 'ALERTA':
        return <Badge className="bg-amber-500 hover:bg-amber-600">ALERTA</Badge>
      default:
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">OK</Badge>
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Estoque</h1>
        <p className="text-muted-foreground">Monitoramento e movimentação de insumos.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Zerados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.kpis.zerados || 0}</div>
            <p className="text-xs text-muted-foreground">Necessitam de reposição imediata.</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Crítico</CardTitle>
            < TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.kpis.alertas || 0}</div>
            <p className="text-xs text-muted-foreground">Abaixo do estoque mínimo.</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Loja</CardTitle>
            <Package className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.kpis.totalMercadorias || 0}</div>
            <p className="text-xs text-muted-foreground">Soma total de todos os itens.</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gerenciamento" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gerenciamento" className="flex gap-2">
            <Package className="h-4 w-4" /> Gerenciamento
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex gap-2">
            <History className="h-4 w-4" /> Histórico de Movimentações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gerenciamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventário Geral</CardTitle>
              <CardDescription>
                Visualize e gerencie os saldos entre Depósito e Visor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Visor</TableHead>
                    <TableHead className="text-center">Depósito</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Mínimo</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingDash ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">Carregando estoque...</TableCell>
                    </TableRow>
                  ) : dashboard?.produtos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell>{p.categoria}</TableCell>
                      <TableCell className="text-center">{p.qtdVisor}</TableCell>
                      <TableCell className="text-center">{p.qtdEstoque}</TableCell>
                      <TableCell className="text-center font-bold text-lg">{p.total}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{p.estoqueMinimo}</TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(p.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Repor Visor"
                            onClick={() => setSelRepo(p)}
                          >
                            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Entrada"
                            onClick={() => setSelEntrada(p)}
                          >
                            <PlusCircle className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Ajuste"
                            onClick={() => setSelAjuste(p)}
                          >
                            <Info className="h-4 w-4 text-zinc-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Perda"
                            onClick={() => setSelPerda(p)}
                          >
                            <MinusCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Auditoria</CardTitle>
              <CardDescription>
                Registro de todas as movimentações de entrada, saída, reposição e ajustes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Motivo/Obs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs flex flex-col">
                        <span className="font-bold flex items-center gap-1">
                          <Clock className="h-3 w-3" /> 
                          {format(new Date(m.criadoEm), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {m.tipo.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{m.produto.nome}</TableCell>
                      <TableCell className={`text-center font-bold ${m.quantidade < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}
                      </TableCell>
                      <TableCell className="text-xs">
                         <span className="flex items-center gap-1">
                           <User className="h-3 w-3 text-zinc-400" /> {m.usuario.nome.split(' ')[0]}
                         </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {m.origem}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground italic">
                        {m.observacao || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="ghost" onClick={loadMore} disabled={loadingMovs}>
                    {loadingMovs ? 'Carregando...' : 'Carregar mais registros'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ModalReposicao 
        produto={selRepo} 
        onClose={() => setSelRepo(null)} 
        onSuccess={handleSuccess} 
      />
      <ModalEntrada 
        produto={selEntrada} 
        onClose={() => setSelEntrada(null)} 
        onSuccess={handleSuccess} 
      />
      <ModalAjuste 
        produto={selAjuste} 
        onClose={() => setSelAjuste(null)} 
        onSuccess={handleSuccess} 
      />
      <ModalPerda 
        produto={selPerda} 
        onClose={() => setSelPerda(null)} 
        onSuccess={handleSuccess} 
      />
    </div>
  )
}
