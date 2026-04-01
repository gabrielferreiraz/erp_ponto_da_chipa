import { auth } from '@/lib/auth-instance'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const mesas = await prisma.mesa.findMany({
      orderBy: { numero: 'asc' },
      include: {
        pedidos: {
          where: { orderStatus: 'ABERTO' },
          select: { id: true }
        }
      }
    })

    return NextResponse.json(mesas)
  } catch (error) {
    console.error('Erro ao buscar mesas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
