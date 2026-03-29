import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { cancelarItemSchema } from '@/lib/validations/caixa'
import { CaixaService } from '@/services/caixa.service'

const caixaService = new CaixaService()

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!['ADMIN', 'CAIXA'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = cancelarItemSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Motivo inválido', details: parsed.error.flatten() }, { status: 400 })
    }

    const { motivoCancelamento, quantidadeCancelada } = parsed.data

    await caixaService.cancelarItem(params.id, session.user.id, motivoCancelamento, quantidadeCancelada)

    return NextResponse.json({ success: true, message: 'Item estornado.' })
  } catch (error: any) {
    console.error('[PATCH_CAIXA_CANCELAR_ITEM]', error)
    
    if (error.message.includes('NOT_FOUND')) {
       return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }
    if (error.message.includes('CONFLICT')) {
       return NextResponse.json({ error: error.message.replace('CONFLICT: ', '') }, { status: 409 })
    }

    return NextResponse.json({ error: 'Erro ao cancelar o item' }, { status: 500 })
  }
}
