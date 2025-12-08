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
  Activity,
  Users
} from 'lucide-react'
import { motion } from 'framer-motion'

const Dashboard: React.FC = () => {
  const { userStats, syllabus, currentDay, fetchSyllabus } = useGameStore()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [lbMode, setLbMode] = useState<'national' | 'institution'>('national')

  useEffect(() => {
    fetchSyllabus()
    fetchLeaderboard()
  }, [lbMode])

  const fetchLeaderboard = async () => {
    const { data } = await supabase.rpc('get_leaderboard', { 
      institution_id_filter: lbMode === 'institution' ? userStats?.role_rank?.toString() /* Mock logic for inst ID */ : null
    })
    if (data) setLeaderboard(data)
  }

  return (
    <div className="min-h-screen bg-medical-dark text-slate-200 font-sans p-6 overflow-x-hidden">
      {/* Top HUD */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">COMMAND CENTER</h1>
          <p className="text-medical-cyan font-clinical text-sm tracking-widest uppercase">
            Deployment Map // Day {currentDay} of 45
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
        
        {/* Left: Deployment Map (Syllabus) */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {syllabus.map((topic) => {
              const isLocked = topic.day_number > currentDay
              const isCompleted = topic.day_number < currentDay // Simplified logic
              const isCurrent = topic.day_number === currentDay

              return (
                <motion.div
                  key={topic.id}
                  {...({
                    whileHover: !isLocked ? { scale: 1.02 } : {},
                    className: `
                      relative p-4 rounded-xl border h-32 flex flex-col justify-between transition-all
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
                    <span className="text-xs font-clinical font-bold opacity-70">DAY {topic.day_number}</span>
                    {isLocked && <Lock className="w-4 h-4" />}
                    {isCompleted && <CheckCircle className="w-4 h-4 text-yellow-500" />}
                    {isCurrent && <Activity className="w-4 h-4 text-medical-cyan animate-pulse" />}
                  </div>
                  
                  <div className="font-bold text-sm leading-tight">
                    {topic.title}
                  </div>

                  {!isLocked && (
                    <Link 
                      to={`/quiz/${topic.day_number}`}
                      className="absolute inset-0 z-10"
                    >
                      <span className="sr-only">Start Day {topic.day_number}</span>
                    </Link>
                  )}
                  
                  {isCurrent && (
                    <div className="absolute bottom-3 right-3 text-medical-cyan">
                      <PlayCircle className="w-6 h-6" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Right: Leaderboard Widget */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
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