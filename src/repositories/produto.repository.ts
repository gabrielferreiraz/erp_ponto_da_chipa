import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class ProdutoRepository {
  async findAll(params?: { search?: string; categoriaId?: string; status?: string }) {
    const where: Prisma.ProdutoWhereInput = {}

    if (params?.search) {
      where.nome = { contains: params.search, mode: 'insensitive' }
    }
    if (params?.categoriaId && params.categoriaId !== 'all') {
      where.categoriaId = params.categoriaId
    }
    if (params?.status && params.status !== 'all') {
      where.disponivel = params.status === 'disponivel'
    }

    const produtos = await prisma.produto.findMany({
      where,
      include: { categoria: true },
      orderBy: { criadoEm: 'desc' },
    })

    // Converter Decimal para Number (R10)
    return produtos.map((p) => ({
      ...p,
      preco: Number(p.preco),
      precoAnterior: p.precoAnterior ? Number(p.precoAnterior) : null,
    }))
  }

  async findById(id: string) {
    const p = await prisma.produto.findUnique({
      where: { id },
      include: { categoria: true },
    })
    
    if (!p) return null
    return {
      ...p,
      preco: Number(p.preco),
      precoAnterior: p.precoAnterior ? Number(p.precoAnterior) : null,
    }
  }

  async create(data: Prisma.ProdutoCreateInput) {
    const p = await prisma.produto.create({ 
      data, 
      include: { categoria: true } 
    })
    return {
      ...p,
      preco: Number(p.preco),
      precoAnterior: p.precoAnterior ? Number(p.precoAnterior) : null,
    }
  }

  async update(id: string, data: Prisma.ProdutoUpdateInput) {
    const p = await prisma.produto.update({
      where: { id },
      data,
      include: { categoria: true }
    })
    return {
      ...p,
      preco: Number(p.preco),
      precoAnterior: p.precoAnterior ? Number(p.precoAnterior) : null,
    }
  }
}
