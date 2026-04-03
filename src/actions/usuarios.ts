'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth-instance'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function getUsuariosAction() {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') throw new Error('Não autorizado')

  return await prisma.usuario.findMany({
    orderBy: { nome: 'asc' },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ativo: true,
      criadoEm: true,
    }
  })
}

export async function upsertUsuarioAction(data: any) {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') throw new Error('Não autorizado')

  const { id, nome, email, role, ativo, senha } = data

  const payload: any = {
    nome,
    email,
    role,
    ativo,
  }

  // Se houver senha nova, criptografa
  if (senha && senha.trim() !== '') {
    payload.senha = await bcrypt.hash(senha, 12)
    payload.emailVerified = new Date() // Garante acesso imediato
  }

  if (id) {
    await prisma.usuario.update({
      where: { id },
      data: payload
    })
  } else {
    if (!senha) throw new Error('Senha é obrigatória para novos usuários')
    await prisma.usuario.create({
      data: {
        ...payload,
        emailVerified: new Date()
      }
    })
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function toggleUsuarioStatusAction(id: string, currentStatus: boolean) {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') throw new Error('Não autorizado')

  // Impede desativar a si próprio
  if (id === session.user.id) throw new Error('Você não pode desativar sua própria conta')

  await prisma.usuario.update({
    where: { id },
    data: { ativo: !currentStatus }
  })

  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function deleteUsuarioAction(id: string) {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') throw new Error('Não autorizado')

  if (id === session.user.id) throw new Error('Você não pode excluir sua própria conta')

  // Verifica se o usuário possui registros vinculados que impediriam a exclusão
  const [pedidosCount, movimentacoesCount, fechamentosCount] = await Promise.all([
    prisma.pedido.count({ where: { OR: [{ atendenteId: id }, { caixaId: id }] } }),
    prisma.movimentacaoEstoque.count({ where: { usuarioId: id } }),
    prisma.shiftClosing.count({ where: { usuarioId: id } }),
  ])

  if (pedidosCount > 0 || movimentacoesCount > 0 || fechamentosCount > 0) {
    throw new Error(
      'Não é possível excluir este usuário pois ele possui registros vinculados (pedidos, movimentações ou fechamentos de turno). Desative-o em vez de excluir.'
    )
  }

  await prisma.usuario.delete({ where: { id } })

  revalidatePath('/admin/usuarios')
  return { success: true }
}
