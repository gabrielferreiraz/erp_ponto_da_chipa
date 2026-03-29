import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { estoqueAjusteSchema } from '@/lib/validations/estoque'
import { EstoqueService } from '@/services/estoque.service'

const estoqueService = new EstoqueService()

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { produtoId, quantidade, motivo } = body
    
    if (!produtoId) {
       return NextResponse.json({ error: 'ProdutoId é obrigatório' }, { status: 400 })
    }

    const parsed = estoqueAjusteSchema.safeParse({ quantidade: Number(quantidade), motivo })
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    await estoqueService.ajusteVisor(produtoId, parsed.data.quantidade, parsed.data.motivo, session.user.id)

    return NextResponse.json({ success: true, message: 'Ajuste manual executado com sucesso' })
  } catch (error: any) {
    console.error('[POST_AJUSTE_ESTOQUE]', error)
    if (error.message.includes('NOT_FOUND') || error.message.includes('BAD_REQUEST')) {
       return NextResponse.json({ error: error.message.replace(/^(BAD_REQUEST|NOT_FOUND|CONFLICT): /, '') }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno no banco de dados' }, { status: 500 })
  }
}
