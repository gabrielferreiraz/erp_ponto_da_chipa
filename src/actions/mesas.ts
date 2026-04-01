'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth-instance'
import { revalidatePath } from 'next/cache'

export async function getMesasAction() {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') throw new Error('Não autorizado')

  return await prisma.mesa.findMany({
    orderBy: { numero: 'asc' },
    include: {
      pedidos: {
        where: { orderStatus: 'ABERTO' },
        select: { id: true }
      }
    }
  })
}

export async function upsertMesaAction(data: any) {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') throw new Error('Não autorizado')

  const { id, numero, ativa } = data

  // Validar se número já existe
  const existing = await prisma.mesa.findFirst({
    where: { 
      numero: Number(numero),
      id: id ? { not: id } : undefined
    }
  })

  if (existing) throw new Error(`A mesa número ${numero} já está cadastrada.`)

  if (id) {
    await prisma.mesa.update({
      where: { id },
      data: { numero: Number(numero), ativa }
    })
  } else {
    await prisma.mesa.create({
      data: { numero: Number(numero), ativa }
    })
  }

  revalidatePath('/admin/mesas')
  return { success: true }
}

export async function toggleMesaStatusAction(id: string, currentStatus: boolean) {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') throw new Error('Não autorizado')

  await prisma.mesa.update({
    where: { id },
    data: { ativa: !currentStatus }
  })

  revalidatePath('/admin/mesas')
  return { success: true }
}

export async function deleteMesaAction(id: string) {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') throw new Error('Não autorizado')

  // Verificar se há pedidos abertos
  const mesa = await prisma.mesa.findUnique({
    where: { id },
    include: { pedidos: { where: { orderStatus: 'ABERTO' } } }
  })

  if (mesa?.pedidos.length) {
    throw new Error('Não é possível excluir uma mesa com pedidos abertos.')
  }

  await prisma.mesa.delete({ where: { id } })

  revalidatePath('/admin/mesas')
  return { success: true }
}
