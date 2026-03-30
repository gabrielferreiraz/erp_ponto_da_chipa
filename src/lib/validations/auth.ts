import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(10, 'Senha deve ter pelo menos 10 caracteres')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^a-zA-Z0-9]/, 'Senha deve conter pelo menos um caractere especial')

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

export const resetPasswordRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase()
    .trim(),
})

export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  senha: passwordSchema,
})

export const verifyEmailRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase()
    .trim(),
})

export const verifyEmailConfirmSchema = z.object({
  token: z.string().uuid('Token inválido'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>
export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>
export type VerifyEmailRequestInput = z.infer<typeof verifyEmailRequestSchema>
export type VerifyEmailConfirmInput = z.infer<typeof verifyEmailConfirmSchema>
