const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados (JavaScript)...');

  // Criar categorias padrão
  const categoriaChipas = await prisma.categoria.upsert({
    where: { id: 'cat-chipas' },
    update: {},
    create: {
      id: 'cat-chipas',
      nome: 'Chipas',
      cor: '#F59E0B',
      ordem: 1,
    },
  });

  const categoriaBebidas = await prisma.categoria.upsert({
    where: { id: 'cat-bebidas' },
    update: {},
    create: {
      id: 'cat-bebidas',
      nome: 'Bebidas',
      cor: '#3B82F6',
      ordem: 2,
    },
  });

  const categoriaExtras = await prisma.categoria.upsert({
    where: { id: 'cat-extras' },
    update: {},
    create: {
      id: 'cat-extras',
      nome: 'Extras',
      cor: '#10B981',
      ordem: 3,
    },
  });

  console.log('✅ Categorias criadas');

  // Criar produtos iniciais
  await prisma.produto.upsert({
    where: { id: 'prod-chipa-simples' },
    update: {},
    create: {
      id: 'prod-chipa-simples',
      nome: 'Chipa Simples',
      categoriaId: categoriaChipas.id,
      preco: 5.00,
      qtdEstoque: 100,
      qtdVisor: 20,
      estoqueMinimo: 10,
      disponivel: true,
    },
  });

  await prisma.produto.upsert({
    where: { id: 'prod-chipa-queijo' },
    update: {},
    create: {
      id: 'prod-chipa-queijo',
      nome: 'Chipa com Queijo',
      categoriaId: categoriaChipas.id,
      preco: 7.00,
      qtdEstoque: 80,
      qtdVisor: 15,
      estoqueMinimo: 8,
      disponivel: true,
    },
  });

  await prisma.produto.upsert({
    where: { id: 'prod-refrigerante' },
    update: {},
    create: {
      id: 'prod-refrigerante',
      nome: 'Refrigerante Lata',
      categoriaId: categoriaBebidas.id,
      preco: 6.00,
      qtdEstoque: 50,
      qtdVisor: 12,
      estoqueMinimo: 5,
      disponivel: true,
    },
  });

  console.log('✅ Produtos iniciais criados');

  // Criar mesas
  for (let i = 1; i <= 5; i++) {
    await prisma.mesa.upsert({
      where: { numero: i },
      update: {},
      create: {
        numero: i,
        ativa: true,
      },
    });
  }

  console.log('✅ 5 mesas criadas (1 a 5)');

  // Criar usuário ADMIN
  const senhaHasheada = await bcrypt.hash('Admin@2024', 12);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@pontodachipa.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@pontodachipa.com',
      senha: senhaHasheada,
      role: 'ADMIN',
      ativo: true,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Usuário ADMIN criado:', { email: admin.email, role: admin.role });

  // Criar usuário CAIXA de exemplo
  const senhaCaixa = await bcrypt.hash('Caixa@2024', 12);
  await prisma.usuario.upsert({
    where: { email: 'caixa@pontodachipa.com' },
    update: {},
    create: {
      nome: 'Operador Caixa',
      email: 'caixa@pontodachipa.com',
      senha: senhaCaixa,
      role: 'CAIXA',
      ativo: true,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Usuário CAIXA de exemplo criado');

  // Criar usuário ATENDENTE de exemplo
  const senhaAtendente = await bcrypt.hash('Atendente@2024', 12);
  await prisma.usuario.upsert({
    where: { email: 'atendente@pontodachipa.com' },
    update: {},
    create: {
      nome: 'Atendente Exemplo',
      email: 'atendente@pontodachipa.com',
      senha: senhaAtendente,
      role: 'ATENDENTE',
      ativo: true,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Usuário ATENDENTE de exemplo criado');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('  ADMIN:     admin@pontodachipa.com / Admin@2024');
  console.log('  CAIXA:     caixa@pontodachipa.com / Caixa@2024');
  console.log('  ATENDENTE: atendente@pontodachipa.com / Atendente@2024');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
