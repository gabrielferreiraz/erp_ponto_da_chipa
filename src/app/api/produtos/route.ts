import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { ProdutoService } from '@/services/produto.service'
import { createProdutoSchema } from '@/lib/validations/produto'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'CAIXA', 'ATENDENTE'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const categoriaId = searchParams.get('categoriaId') || undefined
  const status = searchParams.get('status') || undefined

  const service = new ProdutoService()
  const produtos = await service.findAll({ search, categoriaId, status })
  
  return NextResponse.json(produtos)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  try {
    const body = await request.json()
    console.log('[DEBUG API] Recebido no POST /api/produtos:', body)
    
    const parsed = createProdutoSchema.safeParse(body)
    
    if (!parsed.success) {
      console.error('[DEBUG API] Erro de validação Zod:', parsed.error.format())
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: parsed.error.format() 
      }, { status: 400 })
    }

    const validData = parsed.data
    const service = new ProdutoService()
    const produto = await service.create(validData)
    
    return NextResponse.json(produto, { status: 201 })
  } catch (error: any) {
    console.error('[DEBUG API] Erro fatal no POST:', error)
    return NextResponse.json({ error: error.message || 'Erro ao processar' }, { status: 400 })
  }
}
