import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../stores/gameStore'
import { BrainCircuit, XCircle, CheckCircle, ShieldCheck, ChevronRight } from 'lucide-react'

const AiFeedbackModal: React.FC = () => {
  const { isFeedbackModalOpen, latestFeedback, setFeedbackModalOpen } = useGameStore()
  const [remedialStep, setRemedialStep] = useState(0) // 0: Feedback, 1: Q1, 2: Q2, 3: Done
  const [selectedRemedialOption, setSelectedRemedialOption] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)

  if (!isFeedbackModalOpen || !latestFeedback) return null

  const handleRemedialSubmit = (optionIndex: number, correctIndex: number) => {
    setSelectedRemedialOption(optionIndex)
    setShowExplanation(true)
  }

  const nextStep = () => {
    setSelectedRemedialOption(null)
    setShowExplanation(false)
    if (remedialStep < 2) {
      setRemedialStep(prev => prev + 1)
    } else {
      setFeedbackModalOpen(false)
      setRemedialStep(0)
    }
  }

  const currentQuestion = latestFeedback.remedial_questions[remedialStep - 1]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          {...({
            initial: { opacity: 0, scale: 0.9, y: 20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.9 },
            className: "bg-medical-dark border border-medical-cyan/50 shadow-[0_0_30px_rgba(0,188,212,0.2)] rounded-xl w-full max-w-2xl overflow-hidden relative"
          } as any)}
        >
          {/* Holographic Top Bar */}
          <div className="h-1 bg-gradient-to-r from-transparent via-medical-cyan to-transparent animate-pulse" />
          
          <div className="p-8">
            {remedialStep === 0 && (
              <div className="text-center space-y-6">
                <motion.div 
                  {...({
                    initial: { y: -20, opacity: 0 },
                    animate: { y: 0, opacity: 1 },
                    className: "inline-flex items-center gap-2 px-4 py-1 rounded-full border border-medical-cyan/30 bg-medical-cyan/10 text-medical-cyan"
                  } as any)}
                >
                  <BrainCircuit className="w-5 h-5" />
                  <span className="font-clinical tracking-wider uppercase text-sm">AI Analysis Complete</span>
                </motion.div>

                <h2 className="text-3xl font-bold text-white font-sans">
                  Persona Assigned: <span className="text-medical-cyan glow-text">{latestFeedback.persona}</span>
                </h2>

                <p className="text-slate-300 text-lg leading-relaxed font-clinical">
                  {latestFeedback.feedback}
                </p>

                <button
                  onClick={() => setRemedialStep(1)}
                  className="mt-8 px-8 py-3 bg-medical-cyan hover:bg-cyan-400 text-medical-dark font-bold rounded shadow-[0_0_15px_rgba(0,188,212,0.5)] transition-all flex items-center gap-2 mx-auto"
                >
                  Initialize Remedial Protocol <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {(remedialStep === 1 || remedialStep === 2) && currentQuestion && (
              <div className="space-y-6">
                <div className="flex justify-between items-center text-sm text-slate-400 font-clinical">
                  <span>REMEDIAL MODULE {remedialStep}/2</span>
                  <span className="text-medical-alert animate-pulse">CRITICAL KNOWLEDGE GAP</span>
                </div>

                <h3 className="text-xl text-white font-semibold">
                  {currentQuestion.question}
                </h3>

                <div className="space-y-3">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedRemedialOption === idx
                    const isCorrect = idx === currentQuestion.correct_answer_index
                    
                    let btnClass = "w-full text-left p-4 rounded border transition-all relative overflow-hidden "
                    
                    if (showExplanation) {
                      if (isCorrect) btnClass += "border-medical-success bg-medical-success/10 text-white"
                      else if (isSelected && !isCorrect) btnClass += "border-medical-alert bg-medical-alert/10 text-slate-300"
                      else btnClass += "border-slate-700 opacity-50"
                    } else {
                      btnClass += "border-slate-700 hover:border-medical-cyan hover:bg-medical-cyan/5 text-slate-300 hover:text-white"
                    }

                    return (
                      <button
                        key={idx}
                        disabled={showExplanation}
                        onClick={() => handleRemedialSubmit(idx, currentQuestion.correct_answer_index)}
                        className={btnClass}
                      >
                        <span className="relative z-10">{opt}</span>
                        {showExplanation && isCorrect && (
                          <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-medical-success" />
                        )}
                        {showExplanation && isSelected && !isCorrect && (
                          <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-medical-alert" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {showExplanation && (
                  <motion.div 
                    {...({
                      initial: { opacity: 0, height: 0 },
                      animate: { opacity: 1, height: 'auto' },
                      className: "p-4 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300"
                    } as any)}
                  >
                    <strong className="text-white block mb-1">Analysis:</strong>
                    {currentQuestion.explanation}
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={nextStep}
                        className="px-6 py-2 bg-white text-medical-dark font-bold rounded hover:bg-slate-200 transition-colors"
                      >
                        {remedialStep === 2 ? 'Complete Shift' : 'Next Scenario'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default AiFeedbackModal