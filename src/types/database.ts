export type DietaryPreference = 'vegetarian' | 'vegetarian_with_eggs' | 'vegan'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'
export type DayStatus = 'home_all_day' | 'busy_until' | 'late_night' | 'quick_only'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type RecipeSource = 'ai_generated' | 'web_import' | 'manual'

export type PantryCategory =
  | 'fresh_produce'
  | 'dairy_eggs'
  | 'grains_legumes'
  | 'spices_herbs'
  | 'condiments_sauces'
  | 'frozen'
  | 'snacks'
  | 'beverages'
  | 'dry_shelf'
  | 'oils_fats'
  | 'baking'
  | 'dips'
  | 'canned'
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

// Supabase Database generic type for createClient
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      pantry_items: {
        Row: PantryItem
        Insert: Omit<PantryItem, 'id' | 'added_at' | 'updated_at'>
        Update: Partial<Omit<PantryItem, 'id' | 'user_id' | 'added_at'>>
      }
      saved_recipes: {
        Row: SavedRecipe
        Insert: Omit<SavedRecipe, 'id' | 'created_at'>
        Update: Partial<Omit<SavedRecipe, 'id' | 'user_id' | 'created_at'>>
      }
      grocery_list: {
        Row: GroceryItem
        Insert: Omit<GroceryItem, 'id' | 'added_at'>
        Update: Partial<Omit<GroceryItem, 'id' | 'user_id' | 'added_at'>>
      }
      food_vocabulary: {
        Row: FoodVocabulary
        Insert: Omit<FoodVocabulary, 'id'>
        Update: Partial<Omit<FoodVocabulary, 'id' | 'user_id'>>
      }
    }
  }
}
