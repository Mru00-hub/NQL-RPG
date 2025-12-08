import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useGameStore } from '../../stores/gameStore'
import { Timer, AlertCircle, CheckCircle, Activity, Brain, ArrowRight } from 'lucide-react'
import AiFeedbackModal from './AiFeedbackModal'

// --- TYPES ---
type Option = {
  id: string
  index: number
  text: string
}

type Question = {
  id: string // Frontend uses 'id'
  day_number: number
  level: number
  visual_scene: string | null
  points: number
  time_limit_seconds: number
  question_text: string
  options: Option[]
}

const ClinicalTerminal: React.FC = () => {
  const { dayNumber } = useParams<{ dayNumber: string }>()
  const navigate = useNavigate()
  const { subscribeToAiFeedback, fetchUserStats, checkForFeedback } = useGameStore()
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  
  // Ref to prevent double submission
  const submissionRef = useRef(false)

  const currentQ = questions[currentIndex]

  // --- EFFECT: INITIAL LOAD ---
  useEffect(() => {
    if (dayNumber) {
      loadQuiz()
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          subscribeToAiFeedback(data.session.user.id, parseInt(dayNumber))
        }
      })
    }
  }, [dayNumber])

  // --- EFFECT: TIMER ---
  useEffect(() => {
    let timer: any
    if (timeLeft > 0 && !selectedOption && !feedback && !loading && currentQ) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (timeLeft === 0 && !selectedOption && currentQ && !feedback && !loading) {
      // Time Out: Auto-submit as skipped (-1)
      handleOptionSelect(-1)
    }
    return () => clearInterval(timer)
  }, [timeLeft, selectedOption, feedback, currentQ, loading])

  // --- LOAD QUIZ (WITH CRITICAL FIX) ---
  const loadQuiz = async () => {
    if (!dayNumber) return
    setLoading(true)
    const { data } = await supabase.rpc('get_daily_quiz', { day_num: parseInt(dayNumber) })
    
    if (data && data.length > 0) {
      const parsedQuestions = data.map((q: any) => ({
        ...q,
        // CRITICAL FIX: Map the DB's 'question_id' to Frontend 'id'
        id: q.question_id || q.id, 
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }))
      setQuestions(parsedQuestions)
      setTimeLeft(parsedQuestions[0].time_limit_seconds)
    } else {
      console.log("No questions found or day locked")
    }
    setLoading(false)
  }

  // --- HANDLE SUBMISSION ---
  const handleOptionSelect = async (idx: number) => {
    // Prevent multiple submissions
    if (isProcessing || (selectedOption !== null && idx !== -1)) return
    
    submissionRef.current = true
    setSelectedOption(idx)
    setIsProcessing(true)

    const startTime = currentQ.time_limit_seconds
    const timeTaken = Math.max(0, startTime - timeLeft)

    // Debugging: Ensure ID exists before sending
    console.log("Submitting:", { qID: currentQ.id, opt: idx, time: timeTaken });

    const { data, error } = await supabase.rpc('submit_answer', {
      p_question_id: currentQ.id, // This should now be defined!
      p_selected_option: idx,
      p_time_taken: timeTaken
    })

    if (error) {
      console.error("Submission Error:", error)
      setFeedback('incorrect') // Visual feedback
    } else {
      console.log("Submission Saved:", data)
      setFeedback(data.is_correct ? 'correct' : 'incorrect')
    }

    // Wait 1.5s then Advance
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        // Next Question
        const nextIndex = currentIndex + 1
        setCurrentIndex(nextIndex)
        setSelectedOption(null)
        setFeedback(null)
        setIsProcessing(false)
        submissionRef.current = false
        setTimeLeft(questions[nextIndex].time_limit_seconds)
      } else {
        // Quiz Complete
        setIsProcessing(false)
        
        // Final Sync & Trigger AI Feedback Modal
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
             fetchUserStats(data.session.user.id)
             if (dayNumber) {
                 // ONLY Check for AI Feedback at the very end
                 checkForFeedback(parseInt(dayNumber))
             }
          }
        })
      }
    }, 1500)
  }

  if (loading) {
    return (
      <div className="h-screen w-full bg-medical-dark flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-medical-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-medical-cyan font-clinical tracking-widest animate-pulse">LOADING CLINICAL SCENARIOS...</p>
      </div>
    )
  }

  if (!currentQ) return <div className="p-8 text-white">Scenario Load Failed. Return to Dashboard.</div>

  return (
    <div className="h-screen bg-medical-dark overflow-hidden flex flex-col relative">
      <AiFeedbackModal />

      {/* Header HUD */}
      <div className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white font-clinical uppercase text-sm">
            &larr; Abort Shift
          </button>
          <div className="h-6 w-px bg-slate-800" />
          <span className="text-medical-cyan font-bold tracking-wider">
            SCENARIO {currentIndex + 1}/{questions.length}
          </span>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 10 ? 'text-medical-alert animate-pulse' : 'text-white'}`}>
          <Timer className="w-5 h-5" />
          {timeLeft}s
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* LEFT: Patient Data / Scenario */}
        <div className="lg:w-1/2 p-8 overflow-y-auto border-r border-slate-800 relative bg-slate-900/50">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-medical-cyan/50 to-transparent" />
          
          <div className="mb-6 flex items-center gap-2 text-medical-cyan/70 text-sm font-bold tracking-widest uppercase">
            <Activity className="w-4 h-4" />
            Patient Clinical Data
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">
            {currentQ.question_text}
          </h2>

          {/* Diagnostic Context */}
          {currentQ.visual_scene && (
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded text-sm font-clinical text-slate-400 font-mono">
               <div className="flex items-center gap-2 mb-2 text-slate-500 uppercase text-[10px] tracking-widest">
                 <Brain className="w-3 h-3" /> Visual Context Log
               </div>
               {currentQ.visual_scene}
            </div>
          )}
        </div>

        {/* CENTER: VEO Placeholder */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-20 pointer-events-none">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-96 h-96 border border-medical-cyan/30 rounded-full flex items-center justify-center relative"
          >
            <div className="absolute inset-0 border border-medical-cyan/10 rounded-full scale-110" />
            <Brain className="w-32 h-32 text-medical-cyan" />
          </motion.div>
        </div>

        {/* RIGHT: Clinical Orders (Options) */}
        <div className="lg:w-1/2 p-8 flex flex-col justify-center relative z-10">
          <div className="mb-6 flex items-center gap-2 text-slate-500 text-sm font-bold tracking-widest uppercase">
            <Activity className="w-4 h-4" />
            Select Intervention
          </div>

          <div className="space-y-4">
            {currentQ.options.map((option, idx) => {
              let stateClass = "border-slate-700 bg-slate-900/50 hover:bg-slate-800"
              const optionIndex = option.index !== undefined ? option.index : idx;

              if (selectedOption === optionIndex) {
                if (feedback === 'correct') stateClass = "border-medical-success bg-medical-success/10 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                else if (feedback === 'incorrect') stateClass = "border-medical-alert bg-medical-alert/10 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                else stateClass = "border-medical-cyan bg-medical-cyan/10 text-white animate-pulse"
              } else if (selectedOption !== null) {
                 stateClass = "border-slate-800 opacity-40"
              }

              return (
                <button
                  key={option.id || idx}
                  onClick={() => handleOptionSelect(optionIndex)}
                  disabled={selectedOption !== null}
                  className={`w-full p-6 text-left rounded-xl border transition-all duration-200 group relative overflow-hidden ${stateClass}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border
                      ${selectedOption === optionIndex ? 'border-current' : 'border-slate-600 text-slate-500 group-hover:border-medical-cyan group-hover:text-medical-cyan'}
                    `}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    {/* Render text string, not object */}
                    <span className="flex-1 font-clinical text-lg">{option.text}</span>
                    
                    {feedback === 'correct' && selectedOption === optionIndex && <CheckCircle className="text-medical-success w-6 h-6" />}
                    {feedback === 'incorrect' && selectedOption === optionIndex && <AlertCircle className="text-medical-alert w-6 h-6" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Feedback Overlay - Only Visual */}
          <AnimatePresence>
            {feedback && (
              <motion.div 
                key="feedback-overlay"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-8 text-center font-bold tracking-widest uppercase ${feedback === 'correct' ? 'text-medical-success' : 'text-medical-alert'}`}
              >
                {feedback === 'correct' ? 'VITALS STABILIZED // +10 PTS' : 'INTERVENTION FAILED // PROCEEDING...'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}

export default ClinicalTerminal
