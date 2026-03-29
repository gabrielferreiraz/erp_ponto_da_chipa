import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { ProdutoService } from '@/services/produto.service'
import { updateProdutoSchema } from '@/lib/validations/produto'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  try {
    const body = await request.json()
    const validData = updateProdutoSchema.parse({ ...body, id: params.id })
    const { id, ...updateData } = validData

    const service = new ProdutoService()
    // ID do usuário é capturado direto do Token (R3) e enviado para o Service
    const produto = await service.update(id!, updateData, session.user.id)
    
    return NextResponse.json(produto)
  } catch (error: any) {
    if (error?.message?.includes('NOT_FOUND')) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ error: error.message || 'Dados inválidos' }, { status: 400 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  try {
    const service = new ProdutoService()
    const produto = await service.toggleStatus(params.id)
    return NextResponse.json(produto)
  } catch (error: any) {
    if (error?.message?.includes('NOT_FOUND')) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ error: error.message || 'Erro ao alternar status' }, { status: 400 })
  }
}
