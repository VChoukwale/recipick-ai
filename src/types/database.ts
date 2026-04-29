export type DietaryPreference = 'vegetarian' | 'vegetarian_with_eggs' | 'vegan' | 'non_vegetarian'

export interface AiRecipe {
  title: string
  description: string
  cuisine: string
  region_detail: string | null
  difficulty: Difficulty
  time_minutes: number
  ingredients: RecipeIngredient[]
  missing_ingredients: { name: string; substitution: string }[]
  match_percentage: number
  instructions: string[]
  why_this: string
}
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'
export type DayStatus = 'home_all_day' | 'busy_until' | 'late_night' | 'quick_only'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type RecipeSource = 'ai_generated' | 'web_import' | 'manual'

export type PantryCategory =
  | 'fresh_produce'
  | 'fruits'
  | 'dairy_eggs'
  | 'protein'
  | 'nuts_seeds'
  | 'grains_legumes'
  | 'spices_herbs'
  | 'condiments_sauces'
  | 'oils_fats'
  | 'frozen'
  | 'canned'
  | 'dry_shelf'
  | 'baking'
  | 'snacks'
  | 'beverages'
  | 'dips'
  | 'supplements'
  | 'other'

export interface Profile {
  id: string
  display_name: string | null
  dietary_preference: DietaryPreference
  skill_level: SkillLevel
  preferred_cuisines: string[]
  day_status: DayStatus
  busy_until_time: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface PantryItem {
  id: string
  user_id: string
  name: string
  category: PantryCategory
  subcategory: string | null
  store_name: string | null
  product_url: string | null
  product_image_url: string | null
  manual_image_url: string | null
  is_available: boolean
  is_favorite: boolean
  is_star_ingredient: boolean
  quantity: string | null
  ai_tags: string[]
  secondary_categories: PantryCategory[]
  added_at: string
  updated_at: string
}

export interface SavedRecipe {
  id: string
  user_id: string
  title: string
  description: string | null
  cuisine_type: string | null
  region_detail: string | null
  ingredients: RecipeIngredient[]
  instructions: string[]
  difficulty: Difficulty
  time_minutes: number | null
  match_percentage: number | null
  is_favorite: boolean
  source: RecipeSource
  source_url: string | null
  why_this: string | null
  substitutions: Record<string, string> | null
  created_at: string
  tried: boolean
  rating: number
}

export interface RecipeIngredient {
  name: string
  quantity: string
  in_pantry: boolean
}

export interface GroceryItem {
  id: string
  user_id: string
  name: string
  category: string | null
  store_name: string | null
  is_checked: boolean
  ai_tags: string[]
  added_at: string
}

export interface FoodVocabulary {
  id: string
  user_id: string
  word: string
  frequency: number
  last_used: string
}

// Supabase Database generic type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: { id: string; display_name?: string | null; dietary_preference?: DietaryPreference; skill_level?: SkillLevel; preferred_cuisines?: string[]; day_status?: DayStatus; busy_until_time?: string | null; onboarding_completed?: boolean }
        Update: { display_name?: string | null; dietary_preference?: DietaryPreference; skill_level?: SkillLevel; preferred_cuisines?: string[]; day_status?: DayStatus; busy_until_time?: string | null; onboarding_completed?: boolean }
      }
      pantry_items: {
        Row: PantryItem
        Insert: { user_id: string; name: string; category: PantryCategory; subcategory?: string | null; store_name?: string | null; product_url?: string | null; product_image_url?: string | null; manual_image_url?: string | null; is_available?: boolean; is_favorite?: boolean; is_star_ingredient?: boolean; quantity?: string | null; ai_tags?: string[]; secondary_categories?: PantryCategory[] }
        Update: { name?: string; category?: PantryCategory; subcategory?: string | null; store_name?: string | null; product_url?: string | null; product_image_url?: string | null; manual_image_url?: string | null; is_available?: boolean; is_favorite?: boolean; is_star_ingredient?: boolean; quantity?: string | null; ai_tags?: string[]; secondary_categories?: PantryCategory[] }
      }
      saved_recipes: {
        Row: SavedRecipe
        Insert: { user_id: string; title: string; description?: string | null; cuisine_type?: string | null; region_detail?: string | null; ingredients?: RecipeIngredient[]; instructions?: string[]; difficulty?: Difficulty; time_minutes?: number | null; match_percentage?: number | null; is_favorite?: boolean; source?: RecipeSource; source_url?: string | null; why_this?: string | null; substitutions?: Record<string, string> | null }
        Update: { title?: string; description?: string | null; cuisine_type?: string | null; region_detail?: string | null; ingredients?: RecipeIngredient[]; instructions?: string[]; difficulty?: Difficulty; time_minutes?: number | null; match_percentage?: number | null; is_favorite?: boolean; source?: RecipeSource; source_url?: string | null; why_this?: string | null; substitutions?: Record<string, string> | null }
      }
      grocery_list: {
        Row: GroceryItem
        Insert: { user_id: string; name: string; category?: string | null; store_name?: string | null; is_checked?: boolean; ai_tags?: string[] }
        Update: { name?: string; category?: string | null; store_name?: string | null; is_checked?: boolean; ai_tags?: string[] }
      }
      food_vocabulary: {
        Row: FoodVocabulary
        Insert: { user_id: string; word: string; frequency?: number; last_used?: string }
        Update: { word?: string; frequency?: number; last_used?: string }
      }
    }
  }
}
