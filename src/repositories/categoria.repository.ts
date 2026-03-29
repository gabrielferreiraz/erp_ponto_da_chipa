import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class CategoriaRepository {
  async findAll() {
    return prisma.categoria.findMany({
      orderBy: { ordem: 'asc' },
      include: {
        _count: {
          select: { produtos: true },
        },
      },
    })
  }

  async findById(id: string) {
    return prisma.categoria.findUnique({
      where: { id },
      include: {
        _count: {
          select: { produtos: true },
        },
      },
    })
  }

  async create(data: Prisma.CategoriaCreateInput) {
    return prisma.categoria.create({ data })
  }

  async update(id: string, data: Prisma.CategoriaUpdateInput) {
    return prisma.categoria.update({
      where: { id },
      data,
    })
  }

  async delete(id: string) {
    return prisma.categoria.delete({
      where: { id },
    })
  }
}
