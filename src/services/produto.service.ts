import { ProdutoRepository } from '@/repositories/produto.repository'
import { CreateProdutoInput, UpdateProdutoInput } from '@/lib/validations/produto'
import { Prisma } from '@prisma/client'

export class ProdutoService {
  private repository: ProdutoRepository

  constructor() {
    this.repository = new ProdutoRepository()
  }

  async findAll(params?: { search?: string; categoriaId?: string; status?: string }) {
    return this.repository.findAll(params)
  }

  async findById(id: string) {
    return this.repository.findById(id)
  }

  async create(data: CreateProdutoInput) {
    return this.repository.create({
      nome: data.nome,
      preco: new Prisma.Decimal(data.preco),
      qtdEstoque: data.qtdEstoque ?? 0,
      qtdVisor: data.qtdVisor ?? 0,
      estoqueMinimo: data.estoqueMinimo ?? 5,
      disponivel: data.disponivel ?? true,
      imagemUrl: data.imagemUrl,
      categoria: {
        connect: { id: data.categoriaId }
      }
    })
  }

  async update(id: string, data: Omit<UpdateProdutoInput, 'id'>, usuarioId: string) {
    const produtoAtual = await this.repository.findById(id)
    
    if (!produtoAtual) {
      throw new Error('NOT_FOUND: Produto não encontrado')
    }

    const updateData: Prisma.ProdutoUpdateInput = {}

    if (data.nome !== undefined) updateData.nome = data.nome
    if (data.categoriaId !== undefined) updateData.categoria = { connect: { id: data.categoriaId } }
    if (data.qtdEstoque !== undefined) updateData.qtdEstoque = data.qtdEstoque
    if (data.qtdVisor !== undefined) updateData.qtdVisor = data.qtdVisor
    if (data.estoqueMinimo !== undefined) updateData.estoqueMinimo = data.estoqueMinimo
    if (data.disponivel !== undefined) updateData.disponivel = data.disponivel
    if (data.imagemUrl !== undefined) updateData.imagemUrl = data.imagemUrl

    // Regra obrigatória (Update de Preço): Ao editar preço, gravar preço anterior, data e ID do usuário
    if (data.preco !== undefined) {
      const novoPrecoNum = data.preco
      const precoAtualNum = produtoAtual.preco

      if (novoPrecoNum !== precoAtualNum) {
        updateData.preco = new Prisma.Decimal(novoPrecoNum)
        updateData.precoAnterior = new Prisma.Decimal(precoAtualNum)
        updateData.precoAtualizadoEm = new Date()
        updateData.precoAtualizadoPorId = usuarioId
      }
    }

    return this.repository.update(id, updateData)
  }

  async toggleStatus(id: string) {
    const produtoAtual = await this.repository.findById(id)
    if (!produtoAtual) {
      throw new Error('NOT_FOUND: Produto não encontrado')
    }
    
    return this.repository.update(id, {
      disponivel: !produtoAtual.disponivel
    })
  }
}
