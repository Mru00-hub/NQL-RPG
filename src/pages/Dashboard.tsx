import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import { supabase } from '../lib/supabase'
import { 
  Trophy, 
  Flame, 
  Target, 
  Lock, 
  CheckCircle, 
  PlayCircle,
  Users,
  ChevronDown,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Helper to get Week Name from Day Number
const getWeekTitle = (day: number) => {
  if (!day) return "Initializing..."
  if (day <= 7) return "Week 1: Data Science & ML Foundations"
  if (day <= 14) return "Week 2: AI in Clinical Practice"
  if (day <= 21) return "Week 3: Generative AI & Advanced Models"
  if (day <= 28) return "Week 4: Digital Health Infrastructure"
  if (day <= 35) return "Week 5: Robotics & Emerging Tech"
  if (day <= 42) return "Week 6: Governance, Privacy & Ethics"
  return "Week 7: Innovation & Systems"
}

// Helper to get Week Index (1-7) from Day Number
const getWeekIndex = (day: number) => {
  if (!day) return 1
  if (day <= 7) return 1
  if (day <= 14) return 2
  if (day <= 21) return 3
  if (day <= 28) return 4
  if (day <= 35) return 5
  if (day <= 42) return 6
  return 7
}

// Define weeks outside to prevent re-render cycles
const WEEKS_DATA = [
  { id: 1, title: "Week 1: Data Science" },
  { id: 2, title: "Week 2: Clinical AI" },
  { id: 3, title: "Week 3: Generative AI" },
  { id: 4, title: "Week 4: Infrastructure" },
  { id: 5, title: "Week 5: Robotics" },
  { id: 6, title: "Week 6: Governance" },
  { id: 7, title: "Week 7: Innovation" },
]

const Dashboard: React.FC = () => {
  const { userStats, syllabus, currentDay, fetchSyllabus } = useGameStore()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [lbMode, setLbMode] = useState<'national' | 'institution'>('national')
  const [selectedWeek, setSelectedWeek] = useState<number>(1)
  const [isWeekMenuOpen, setIsWeekMenuOpen] = useState(false)

  useEffect(() => {
    fetchSyllabus()
  }, [])

  useEffect(() => {
    if (currentDay) {
      setSelectedWeek(getWeekIndex(currentDay))
    }
  }, [currentDay])

  useEffect(() => {
    fetchLeaderboard()
  }, [lbMode, userStats]) // Re-fetch if mode or stats change

  const fetchLeaderboard = async () => {
    // FIX: Safely handle the RPC call. Passing a rank number as ID was likely causing issues.
    // If we don't have an institution ID, we shouldn't filter by it.
    const instId = userStats?.institution_id || null
    
    const { data } = await supabase.rpc('get_leaderboard', { 
      institution_id_filter: lbMode === 'institution' ? instId : null
    })
    if (data) setLeaderboard(data)
  }

  // FIX: Safety check (syllabus || []) prevents "filter of undefined" crash
  const safeSyllabus = Array.isArray(syllabus) ? syllabus : []
  
  const filteredTopics = safeSyllabus.filter(topic => {
    const weekIdx = getWeekIndex(topic.day_number)
    return weekIdx === selectedWeek
  })

  // Get current active week title safely
  const activeWeekTitle = WEEKS_DATA.find(w => w.id === selectedWeek)?.title || "Select Module"

  return (
    <div className="min-h-screen bg-medical-dark text-slate-200 font-sans p-6 overflow-x-hidden">
      {/* Top HUD */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">THE NEXUS</h1>
          <p className="text-medical-cyan font-clinical text-sm tracking-widest uppercase mt-1">
            {getWeekTitle(currentDay || 1)} // Day {currentDay || 1} of 45
          </p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-slate-900/50 border border-slate-700 px-4 py-2 rounded flex items-center gap-3">
              <Target className="text-medical-cyan w-5 h-5" />
              <div>
                <div className="text-xs text-slate-400 uppercase">Score</div>
                <div className="text-xl font-bold text-white">{userStats?.total_score || 0}</div>
              </div>
           </div>
           <div className="bg-slate-900/50 border border-slate-700 px-4 py-2 rounded flex items-center gap-3">
              <Flame className="text-orange-500 w-5 h-5" />
              <div>
                <div className="text-xs text-slate-400 uppercase">Streak</div>
                <div className="text-xl font-bold text-white">{userStats?.current_streak || 0}</div>
              </div>
           </div>
           <div className="bg-slate-900/50 border border-slate-700 px-4 py-2 rounded flex items-center gap-3">
              <Trophy className="text-yellow-500 w-5 h-5" />
              <div>
                <div className="text-xs text-slate-400 uppercase">Rank</div>
                <div className="text-xl font-bold text-white">#{userStats?.global_rank || '-'}</div>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Deployment Map */}
        <div className="lg:col-span-8">
          
          {/* Week Navigator */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Active Sector</h2>
            
            <div className="relative">
              <button 
                onClick={() => setIsWeekMenuOpen(!isWeekMenuOpen)}
                className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded hover:border-medical-cyan transition-colors"
              >
                <span className="text-sm font-clinical text-medical-cyan">
                  {activeWeekTitle}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isWeekMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isWeekMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-12 w-64 bg-slate-900 border border-slate-700 rounded shadow-xl z-20 overflow-hidden"
                  >
                    {WEEKS_DATA.map((week) => (
                      <button
                        key={week.id}
                        onClick={() => {
                          setSelectedWeek(week.id)
                          setIsWeekMenuOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0 ${
                          selectedWeek === week.id ? 'text-medical-cyan bg-slate-800/50' : 'text-slate-300'
                        }`}
                      >
                        {week.title}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Grid Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTopics.length > 0 ? (
              filteredTopics.map((topic) => {
                const dayNum = topic.day_number || 0
                const isLocked = dayNum > (currentDay || 1)
                const isCompleted = dayNum < (currentDay || 1)
                const isCurrent = dayNum === (currentDay || 1)

                return (
                  <motion.div
                    key={topic.id}
                    layout 
                    {...({
                      whileHover: !isLocked ? { scale: 1.02 } : {},
                      className: `
                        relative p-5 rounded-xl border h-40 flex flex-col justify-between transition-all
                        ${isLocked 
                          ? 'bg-slate-900/50 border-slate-800 text-slate-600 grayscale' 
                          : isCurrent 
                            ? 'bg-medical-cyan/5 border-medical-cyan shadow-[0_0_15px_rgba(0,188,212,0.2)]' 
                            : 'bg-slate-800 border-yellow-500/50'
                        }
                      `
                    } as any)}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-clinical font-bold opacity-70">DAY {dayNum}</span>
                      {isLocked && <Lock className="w-4 h-4" />}
                      {isCompleted && <CheckCircle className="w-4 h-4 text-yellow-500" />}
                      {isCurrent && <Activity className="w-4 h-4 text-medical-cyan animate-pulse" />}
                    </div>
                    
                    <div className="font-bold text-md leading-snug mt-2">
                      {topic.title}
                    </div>

                    {!isLocked && (
                      <Link 
                        to={`/quiz/${dayNum}`}
                        className="absolute inset-0 z-10"
                      >
                        <span className="sr-only">Start Day {dayNum}</span>
                      </Link>
                    )}
                    
                    {isCurrent && (
                      <div className="absolute bottom-3 right-3 text-medical-cyan">
                        <PlayCircle className="w-8 h-8" />
                      </div>
                    )}
                  </motion.div>
                )
              })
            ) : (
              <div className="col-span-full p-12 text-center border border-slate-800 border-dashed rounded-xl flex flex-col items-center gap-4">
                {safeSyllabus.length === 0 ? (
                  <>
                    <Loader2 className="w-8 h-8 text-medical-cyan animate-spin" />
                    <p className="text-slate-500 font-clinical">Initializing Neural Link...</p>
                  </>
                ) : (
                  <p className="text-slate-500">No modules found for this sector.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Leaderboard Widget */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden sticky top-6">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-medical-cyan" /> LEADERBOARD
              </h3>
              <div className="flex bg-slate-800 rounded p-1">
                <button 
                  onClick={() => setLbMode('national')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${lbMode === 'national' ? 'bg-medical-cyan text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  National
                </button>
                <button 
                  onClick={() => setLbMode('institution')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${lbMode === 'institution' ? 'bg-medical-cyan text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Campus
                </button>
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              {leaderboard.length === 0 ? (
                 <div className="p-8 text-center text-slate-500 font-clinical text-sm">
                   CONNECTING TO GLOBAL NETWORK...
                 </div>
              ) : (
                leaderboard.map((user, idx) => (
                  <div 
                    key={user.user_id} 
                    className={`
                      p-4 flex items-center gap-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors
                      ${user.user_id === supabase.auth.getSession().then(s => s.data.session?.user.id) ? 'bg-medical-cyan/5 border-l-2 border-l-medical-cyan' : ''}
                    `}
                  >
                    <div className="font-mono font-bold text-slate-500 w-6">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white text-sm">{user.display_name || 'Anonymous User'}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">{user.institution_name || 'Independent'}</div>
                    </div>
                    <div className="font-mono text-medical-cyan font-bold">
                      {user.score}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard

