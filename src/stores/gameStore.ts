import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Database, AiFeedbackResponse } from '../types/database.types'

export interface TopicView {
  id: string
  day_number: number
  title: string
  description: string | null
  total_points: number
  is_unlocked: boolean
  is_available: boolean
}

export interface UserStats {
  total_score: number
  current_streak: number
  longest_streak: number
  days_completed: number
  total_questions_answered: number
  correct_answers: number
  accuracy_percentage: number
  global_rank: number | null
  badges_earned: number
  referrals_made: number
  last_played: string | null // Timestamptz string
  // Note: institution_id and user_role are not in the quiz stats RPC.
  // You should get those from your main auth profile context if needed for filtering.
}

export interface AiFeedbackData {
  day_number: number
  ai_feedback: string | null
  persona_assigned: string | null
  remedial_questions: any[] | null // You can define a stricter type for remedial questions later
  generated_at: string | null
  questions_completed: number
  score: number
  perfect_score: boolean
}

interface GameState {
  userStats: UserStats | null
  syllabus: Topic[]
  currentDay: number
  latestFeedback: AiFeedbackResponse | null
  isFeedbackModalOpen: boolean
  isLoading: boolean
  error: string | null
  
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
  error: null,

  fetchUserStats: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data: stats, error } = await supabase.rpc('get_user_quiz_stats', { 
        target_user_id: userId 
      })
      
      if (error) throw error
      
      // Fetch current day from system
      const { data: dayData, error: dayError } = await supabase.rpc('get_current_day')
      if (dayError) throw dayError
      
      set({ 
        userStats: stats as UserStats, 
        currentDay: dayData || 1,
        isLoading: false
      })
    } catch (err: any) {
      console.error('Error fetching stats:', err)
      set({ error: err.message, isLoading: false })
    }
  },

  fetchSyllabus: async () => {
    set({ isLoading: true, error: null })
    try {
      // 4. CHANGE: Fetch from the 'available_topics' VIEW instead of the raw table.
      // This gives us the 'is_unlocked' status automatically.
      const { data, error } = await supabase
        .from('available_topics') // Use the view name here
        .select('*')
        .order('day_number', { ascending: true })
      
      if (error) throw error
      set({ syllabus: data as TopicView[], isLoading: false })
    } catch (err: any) {
      console.error('Error fetching syllabus:', err)
      set({ error: err.message, isLoading: false })
    }
  },

  subscribeToAiFeedback: (userId: string, dayNumber: number) => {
    // Ensure we clean up old subscriptions first
    const existingChannels = supabase.getChannels()
    existingChannels.forEach(chan => {
      if (chan.topic === 'daily_progress_updates') {
        supabase.removeChannel(chan)
      }
    })

    supabase
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
          // Check if this update is relevant to the current quiz day and is complete
          if (newRecord.day_number === dayNumber && newRecord.questions_completed === 5) {
             // Important: Wait a moment for the Edge Function to finish generating feedback.
             // Realtime triggers fast, sometimes before the AI part is saved.
             // A simpler way is to just check if ai_feedback_text is not null in the payload.
             if (newRecord.ai_feedback_text) {
                 // Fetch full formatted feedback
                 const { data: feedback } = await supabase.rpc('get_my_ai_feedback', { day_num: dayNumber })
                 if (feedback) {
                   set({ 
                     latestFeedback: feedback as AiFeedbackData,
                     isFeedbackModalOpen: true
                   })
                 }
             }
          }
        }
      )
      .subscribe()
  },

  checkForFeedback: async (dayNumber: number) => {
    try {
      const { data: feedback, error } = await supabase.rpc('get_my_ai_feedback', { day_num: dayNumber })
      
      if (error) {
        // Don't throw if it's just "no progress found", just ignore
        if (!error.message.includes('No progress found')) {
            console.error("Error checking feedback:", error)
        }
        return;
      }

      // Only show if actual feedback exists
      if (feedback && feedback.ai_feedback) {
          set({ 
            latestFeedback: feedback as AiFeedbackData,
            isFeedbackModalOpen: true
          })
      }
    } catch (err) {
      console.error("Manual feedback check failed", err)
    }
  },

  setFeedbackModalOpen: (isOpen) => set({ isFeedbackModalOpen: isOpen }),
  
  clearFeedback: () => set({ latestFeedback: null, isFeedbackModalOpen: false })
}))
