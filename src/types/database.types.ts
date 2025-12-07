export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface RemedialQuestion {
  question: string
  options: string[]
  correct_answer_index: number
  explanation: string
}

export interface AiFeedbackResponse {
  persona: 'The Technical Prodigy' | 'The Policy Expert' | 'The Strategic Thinker' | 'The Clinical Innovator' | string
  feedback: string
  remedial_questions: RemedialQuestion[]
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          quiz_total_score: number
          quiz_current_streak: number
          institution_id: string | null
          user_role: 'student' | 'professional'
          created_at?: string
        }
        Insert: {
          id: string
          quiz_total_score?: number
          quiz_current_streak?: number
          institution_id?: string | null
          user_role: 'student' | 'professional'
        }
        Update: {
          quiz_total_score?: number
          quiz_current_streak?: number
          institution_id?: string | null
          user_role?: 'student' | 'professional'
        }
      }
      topics: {
        Row: {
          id: string
          day_number: number
          title: string
          description: string
        }
      }
      questions: {
        Row: {
          id: string
          day_number: number
          level: 1 | 2 | 3 | 4 | 5
          visual_scene: string | null
          points: number
          time_limit_seconds: number
          question_text: string
          options: string[]
        }
      }
      submissions: {
        Row: {
          user_id: string
          question_id: string
          selected_option: number
          is_correct: boolean
          created_at?: string
        }
      }
      daily_progress: {
        Row: {
          user_id: string
          day_number: number
          questions_completed: number
          ai_feedback_text: string | null
          remedial_questions: RemedialQuestion[] | null
          ai_persona_assigned: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_quiz: {
        Args: { day_num: number }
        Returns: {
          id: string
          day_number: number
          level: number
          visual_scene: string | null
          points: number
          time_limit_seconds: number
          question_text: string
          options: string[]
        }[]
      }
      submit_answer: {
        Args: {
          question_id: string
          selected_option: number
          time_taken: number
        }
        Returns: {
          is_correct: boolean
          points_earned: number
          day_completed: boolean
        }
      }
      get_user_quiz_stats: {
        Args: { user_id: string }
        Returns: {
          total_score: number
          current_streak: number
          global_rank: number
          role_rank: number
          badges: string[]
        }
      }
      get_leaderboard: {
        Args: {
          user_role_filter?: 'student' | 'professional' | null
          institution_id_filter?: string | null
        }
        Returns: {
          user_id: string
          display_name: string
          score: number
          rank: number
          institution_name: string
        }[]
      }
      get_my_ai_feedback: {
        Args: { day_num: number }
        Returns: AiFeedbackResponse
      }
      get_current_day: {
        Args: {}
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}