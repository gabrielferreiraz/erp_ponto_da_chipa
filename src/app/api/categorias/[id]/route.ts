import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { CategoriaService } from '@/services/categoria.service'
import { updateCategoriaSchema } from '@/lib/validations/produto'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  try {
    const body = await request.json()
    // Zod validation (id comes from params)
    const validData = updateCategoriaSchema.parse({ ...body, id: params.id })
    const { id, ...updateData } = validData

    const service = new CategoriaService()
    const categoria = await service.update(id!, updateData)
    
    return NextResponse.json(categoria)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  try {
    const service = new CategoriaService()
    await service.delete(params.id)
    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    if (error.message.includes('CONFLICT')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    if (error.message.includes('NOT_FOUND')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
