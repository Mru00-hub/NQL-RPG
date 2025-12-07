import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

// Safely access env variables with fallback to empty object to prevent "Cannot read properties of undefined"
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)
