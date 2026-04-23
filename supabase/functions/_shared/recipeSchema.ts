import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

export const RecipeIngredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().default(''),
  in_pantry: z.boolean(),
})

export const MissingIngredientSchema = z.object({
  name: z.string().min(1),
  substitution: z.string().default(''),
})

export const RecipeSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  cuisine: z.string().default(''),
  region_detail: z.string().nullable().default(null),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  time_minutes: z.number().positive(),
  ingredients: z.array(RecipeIngredientSchema).min(1),
  missing_ingredients: z.array(MissingIngredientSchema).default([]),
  match_percentage: z.number().min(0).max(100),
  instructions: z.array(z.string().min(1)).min(1),
  why_this: z.string().default(''),
})

export const RecipesResponseSchema = z.object({
  recipes: z.array(z.unknown()),
})

export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>
export type MissingIngredient = z.infer<typeof MissingIngredientSchema>
export type Recipe = z.infer<typeof RecipeSchema>
