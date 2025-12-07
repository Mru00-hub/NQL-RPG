import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Database, AiFeedbackResponse } from '../types/database.types'

type Topic = Database['public']['Tables']['topics']['Row']
type UserStats = {
  total_score: number
  current_streak: number
  global_rank: number
  role_rank: number
  badges: string[]
}

interface GameState {
  userStats: UserStats | null
  syllabus: Topic[]
  currentDay: number
  latestFeedback: AiFeedbackResponse | null
  isFeedbackModalOpen: boolean
  isLoading: boolean
  
  // Actions
  fetchUserStats: (userId: string) => Promise<void>
  fetchSyllabus: () => Promise<void>
  subscribeToAiFeedback: (userId: string, dayNumber: number) => void
  checkForFeedback: (dayNumber: number) => Promise<void>
  setFeedbackModalOpen: (isOpen: boolean) => void
  clearFeedback: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  userStats: null,
  syllabus: [],
  currentDay: 1, // Default, will update via RPC
  latestFeedback: null,
  isFeedbackModalOpen: false,
  isLoading: false,

  fetchUserStats: async (userId: string) => {
    set({ isLoading: true })
    try {
      const { data: stats, error } = await supabase.rpc('get_user_quiz_stats', { user_id: userId })
      if (error) throw error
      
      // Fetch current day from system
      const { data: dayData } = await supabase.rpc('get_current_day')
      
      set({ 
        userStats: stats, 
        currentDay: dayData || 1 
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchSyllabus: async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('day_number', { ascending: true })
      
      if (error) throw error
      set({ syllabus: data })
    } catch (err) {
      console.error('Error fetching syllabus:', err)
    }
  },

  subscribeToAiFeedback: (userId: string, dayNumber: number) => {
    // Unsubscribe from previous if exists (simplified for this context)
    supabase.removeAllChannels()

    const channel = supabase
      .channel('daily_progress_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'daily_progress',
          filter: `user_id=eq.${userId}`, 
        },
        async (payload) => {
          const newRecord = payload.new as any
          // Verify if the update indicates completion (5 questions) and matches the day
          if (newRecord.day_number === dayNumber && newRecord.questions_completed === 5) {
             // Fetch the formatted AI feedback via RPC to ensure we get the full generated object
             const { data: feedback } = await supabase.rpc('get_my_ai_feedback', { day_num: dayNumber })
             
             if (feedback) {
               set({ 
                 latestFeedback: feedback,
                 isFeedbackModalOpen: true
               })
             }
          }
        }
      )
      .subscribe()
  },

  checkForFeedback: async (dayNumber: number) => {
    // Fallback: Manually check if feedback is available (e.g., if Realtime fails)
    try {
      const { data: feedback } = await supabase.rpc('get_my_ai_feedback', { day_num: dayNumber })
      // We only show it if valid remedial questions exist, implying the cycle is complete
      if (feedback && feedback.remedial_questions && feedback.remedial_questions.length > 0) {
          set({ 
            latestFeedback: feedback,
            isFeedbackModalOpen: true
          })
      }
    } catch (err) {
      console.error("Manual feedback fetch failed", err)
    }
  },

  setFeedbackModalOpen: (isOpen) => set({ isFeedbackModalOpen: isOpen }),
  
  clearFeedback: () => set({ latestFeedback: null, isFeedbackModalOpen: false })
}))