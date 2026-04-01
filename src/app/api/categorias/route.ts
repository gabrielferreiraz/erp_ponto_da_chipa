import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { CategoriaService } from '@/services/categoria.service'
import { createCategoriaSchema } from '@/lib/validations/produto'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'CAIXA', 'ATENDENTE'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const service = new CategoriaService()
  const categorias = await service.findAll()
  
  return NextResponse.json(categorias)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  try {
    const body = await request.json()
    const validData = createCategoriaSchema.parse(body)
    
    const service = new CategoriaService()
    const categoria = await service.create(validData)
    
    return NextResponse.json(categoria, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
