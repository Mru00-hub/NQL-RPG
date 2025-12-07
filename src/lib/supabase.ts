import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

// Safely access env variables with fallback to empty object to prevent "Cannot read properties of undefined"
const supabaseUrl = 'https://kkghalgyuxgzktcaxzht.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZ2hhbGd5dXhnemt0Y2F4emh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2OTY2MTcsImV4cCI6MjA3NDI3MjYxN30.Szg9SXKdJyKKrYSSQCmjuZB8cRdZOb1ImrlDvRhRSLM'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)
