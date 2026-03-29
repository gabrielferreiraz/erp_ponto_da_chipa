import { auth } from '@/lib/auth-instance'
import { TurnoService } from '@/services/turno.service'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const service = new TurnoService()

const confirmarFechamentoSchema = z.array(z.object({
  produtoId: z.string(),
  qtdFisica: z.number().int().min(0)
}))

export async function GET(request: Request, { params }: { params: { action: string } }) {
  const session = await auth()
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'CAIXA')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (params.action === 'status') {
    return NextResponse.json(await service.getStatus())
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}

export async function POST(request: Request, { params }: { params: { action: string } }) {
  const session = await auth()
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'CAIXA')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    switch (params.action) {
      case 'iniciar-fechamento':
        return NextResponse.json(await service.iniciarFechamento(session.user.id))
      
      case 'confirmar-fechamento': {
        const body = await request.json()
        const contagens = confirmarFechamentoSchema.parse(body)
        return NextResponse.json(await service.confirmarFechamento(session.user.id, contagens))
      }

      case 'cancelar-fechamento':
        return NextResponse.json(await service.cancelarFechamento())

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error: any) {
    console.error(`Erro no turno action ${params.action}:`, error)
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 400 })
  }
}
