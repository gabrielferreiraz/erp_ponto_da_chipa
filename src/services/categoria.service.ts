import { CategoriaRepository } from '@/repositories/categoria.repository'
import { CreateCategoriaInput, UpdateCategoriaInput } from '@/lib/validations/produto'

export class CategoriaService {
  private repository: CategoriaRepository

  constructor() {
    this.repository = new CategoriaRepository()
  }

  async findAll() {
    return this.repository.findAll()
  }

  async findById(id: string) {
    return this.repository.findById(id)
  }

  async create(data: CreateCategoriaInput) {
    return this.repository.create({
      nome: data.nome,
      cor: data.cor,
      ordem: data.ordem,
    })
  }

  async update(id: string, data: Omit<UpdateCategoriaInput, 'id'>) {
    return this.repository.update(id, {
      ...data,
    })
  }

  async delete(id: string) {
    const categoria = await this.repository.findById(id)
    if (!categoria) {
      throw new Error('NOT_FOUND: Categoria não encontrada')
    }

    if (categoria._count.produtos > 0) {
      throw new Error('CONFLICT: Não é possível deletar uma categoria que possui produtos vinculados.')
    }

    return this.repository.delete(id)
  }
}
