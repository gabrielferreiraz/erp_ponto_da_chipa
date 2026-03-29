/** @type {import('next').NextConfig} */
const nextConfig = {
  // Necessário para Docker com standalone output
  output: 'standalone',

  eslint: {
    // Ignora erros de linting durante o build para agilizar o deploy,
    // já que o linting deve ser validado no CI ou desenvolvimento.
    ignoreDuringBuilds: true,
  },

  typescript: {
    // Mantém a validação de tipos real ativa no build.
    ignoreBuildErrors: false,
  },

  // Pacotes que devem ser tratados como externos (não bundled) no servidor
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },

  // Configurações de imagens (adicionar domínios conforme necessário)
  images: {
    remotePatterns: [],
  },

  // Desabilita telemetria
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
}

module.exports = nextConfig
