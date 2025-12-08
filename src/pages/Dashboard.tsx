import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import { supabase } from '../lib/supabase'
import { 
  Trophy, Flame, Target, Lock, CheckCircle, 
  PlayCircle, Users, ChevronDown, Loader2, Activity, AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// --- CONFIGURATION ---
const BUCKET_NAME = 'public-assets';

const getAssetUrl = (filename: string) => {
  if (!filename) return '';
  const path = filename;
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)
  return data.publicUrl
}

// Updated with Vibe/Theme information for future use
const WEEKS_DATA = [
  { id: 1, title: "Week 1: Data Science Foundations", subtitle: "(The Lab)", filename: "week-1.jpg", theme: "cyan" },
  { id: 2, title: "Week 2: Clinical AI", subtitle: "(The Clinic)", filename: "week-2.jpg", theme: "blue" },
  { id: 3, title: "Week 3: GenAI & Advanced Models", subtitle: "(The Library)", filename: "week-3.jpg", theme: "purple" },
  { id: 4, title: "Week 4: Digital Health Infrastructure", subtitle: "(The Admin Block)", filename: "week-4.jpg", theme: "green" },
  { id: 5, title: "Week 5: Robotics & Emerging Tech", subtitle: "(The OT)", filename: "week-5.jpg", theme: "red" },
  { id: 6, title: "Week 6: Governance & Ethics", subtitle: "(The Courtroom)", filename: "week-6.jpg", theme: "yellow" },
  { id: 7, title: "Week 7: Innovation & Systems", subtitle: "(The Future)", filename: "week-7.jpg", theme: "orange" },
]

const getWeekTitle = (day: number | null | undefined) => {
  const safeDay = day || 1;
  const week = WEEKS_DATA.find(w => w.id === Math.min(Math.ceil(safeDay / 7), 7));
  return week ? `${week.title} ${week.subtitle}` : "Initializing...";
}

const getWeekIndex = (day: number | null | undefined) => {
  const safeDay = day || 1;
  return Math.min(Math.ceil(safeDay / 7), 7)
}

// --- MAIN COMPONENT ---

const Dashboard: React.FC = () => {
  const { userStats, syllabus, currentDay, fetchSyllabus, isLoading, error } = useGameStore()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [lbMode, setLbMode] = useState<'national' | 'institution'>('national')
  const [selectedWeek, setSelectedWeek] = useState<number>(1)
  const [isWeekMenuOpen, setIsWeekMenuOpen] = useState(false)

  useEffect(() => {
    fetchSyllabus()
  }, [])

  useEffect(() => {
    if (currentDay) setSelectedWeek(getWeekIndex(currentDay))
  }, [currentDay])

  useEffect(() => {
    const fetchLB = async () => {
      const instId = userStats?.institution_id || null
      const { data } = await supabase.rpc('get_leaderboard', { 
        p_institution_id: lbMode === 'institution' ? instId : null
      })
      if (data && data.leaderboard) setLeaderboard(data.leaderboard)
    }
    if (userStats) fetchLB()
  }, [lbMode, userStats])

  const safeSyllabus = Array.isArray(syllabus) ? syllabus : []
  
  const filteredTopics = safeSyllabus.filter(topic => {
      if (!topic || typeof topic.day_number !== 'number') return false;
      return getWeekIndex(topic.day_number) === selectedWeek
  })
  
  const activeWeekInfo = WEEKS_DATA.find(w => w.id === selectedWeek)
  const masterBgUrl = getAssetUrl('masterbg.jpg');
  const safeCurrentDay = currentDay || 1;

  // --- RENDER ERROR STATE ---
  if (error) {
      return (
          <div className="min-h-screen bg-medical-dark flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-red-500/50 p-8 rounded-xl text-center max-w-md">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-white mb-2">System Error</h2>
                  <p className="text-slate-400 mb-6">{error}</p>
                  <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-white transition-colors">
                      Reinitialize System
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div 
      className="min-h-screen bg-medical-dark text-slate-200 font-sans relative overflow-hidden bg-cover bg-center bg-fixed transition-all duration-500"
      style={{ backgroundImage: `url(${masterBgUrl})` }}
    >
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[3px]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none mix-blend-overlay" />
      
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        
        {/* Header HUD */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-slate-800/60 pb-6 gap-6 backdrop-blur-md bg-slate-900/30 p-4 rounded-xl">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter drop-shadow-[0_0_10px_rgba(0,188,212,0.5)]">
              THE NEXUS
            </h1>
            <div className="flex items-center gap-2 mt-2 text-medical-cyan font-clinical text-sm tracking-widest uppercase">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4 animate-pulse" />}
              <span>{isLoading ? "Establish Link..." : `${getWeekTitle(safeCurrentDay)} // Day ${safeCurrentDay}`}</span>
            </div>
          </div>
          
          <div className="flex gap-4">
             {/* Stats Cards */}
             {[
               { icon: Target, label: "Score", val: userStats?.total_score || 0, color: "text-medical-cyan" },
               { icon: Flame, label: "Streak", val: userStats?.current_streak || 0, color: "text-orange-500" },
               { icon: Trophy, label: "Rank", val: `#${userStats?.global_rank || '-'}`, color: "text-yellow-500" }
             ].map((stat, i) => (
               <div key={i} className="glass-card px-5 py-3 rounded-lg flex items-center gap-4 min-w-[140px] bg-slate-900/60">
                  <stat.icon className={`${stat.color} w-6 h-6`} />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">{stat.label}</div>
                    <div className="text-xl font-bold text-white">{stat.val}</div>
                  </div>
               </div>
             ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Deployment Map */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className={`w-2 h-8 rounded-full shadow-[0_0_10px_currentColor] ${activeWeekInfo?.theme === 'cyan' ? 'bg-medical-cyan text-medical-cyan' : activeWeekInfo?.theme === 'blue' ? 'bg-blue-500 text-blue-500' : 'bg-medical-cyan text-medical-cyan'}`} />
                  {activeWeekInfo?.title}
                </h2>
                <p className="text-slate-400 text-sm ml-5">{activeWeekInfo?.subtitle}</p>
              </div>
              
              {/* Week Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsWeekMenuOpen(!isWeekMenuOpen)}
                  className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-medical-cyan/30 px-5 py-3 rounded-lg hover:border-medical-cyan hover:shadow-[0_0_15px_rgba(0,188,212,0.15)] transition-all"
                  disabled={isLoading}
                >
                  <span className="text-sm font-bold text-white">Change Sector</span>
                  <ChevronDown className={`w-4 h-4 text-medical-cyan transition-transform ${isWeekMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isWeekMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-16 w-80 bg-slate-950 border border-medical-cyan/30 rounded-lg shadow-2xl z-50 overflow-hidden"
                    >
                      {WEEKS_DATA.map((week) => (
                        <button
                          key={week.id}
                          onClick={() => { setSelectedWeek(week.id); setIsWeekMenuOpen(false); }}
                          className={`w-full text-left px-5 py-4 text-sm border-b border-slate-800 last:border-0 hover:bg-medical-cyan/10 transition-colors flex items-center justify-between ${selectedWeek === week.id ? 'text-medical-cyan font-bold bg-medical-cyan/5' : 'text-slate-400'}`}
                        >
                          <div>
                            <div className="font-bold">{week.title}</div>
                            <div className="text-xs opacity-70">{week.subtitle}</div>
                          </div>
                          {selectedWeek === week.id && <CheckCircle className="w-5 h-5" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* THE CARDS AREA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                  <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-slate-800 border-dashed rounded-xl text-slate-500 bg-slate-900/50">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-medical-cyan" />
                    <p className="font-clinical text-lg animate-pulse">SYNCHRONIZING SYLLABUS DATA...</p>
                  </div>
              ) : filteredTopics.length > 0 ? (
                <AnimatePresence mode='wait'>
                  {filteredTopics.map((topic, index) => {
                    if (!topic || !topic.id) return null;
                    const dayNum = topic.day_number || 0
                    const isLocked = topic.is_unlocked === false;
                    const isCurrent = dayNum === safeCurrentDay
                    const weekImageUrl = activeWeekInfo ? getAssetUrl(activeWeekInfo.filename) : undefined;

                    return (
                      <motion.div
                        key={topic.id}
                        layout
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={!isLocked ? { scale: 1.03, y: -5 } : {}}
                        className={`
                          relative rounded-xl overflow-hidden h-56 border transition-all group bg-slate-900 flex flex-col
                          ${isLocked 
                            ? 'border-slate-800/50 opacity-60' 
                            : isCurrent
                              ? 'border-medical-cyan shadow-[0_0_25px_rgba(0,188,212,0.4)] ring-1 ring-medical-cyan'
                              : 'border-slate-700 hover:border-medical-cyan/60 hover:shadow-[0_0_20px_rgba(0,188,212,0.2)]'
                          }
                        `}
                      >
                        <div className="absolute inset-0 bg-slate-900 z-0" />
                        {weekImageUrl && (
                          <img 
                            src={weekImageUrl} 
                            alt={`Background for ${activeWeekInfo?.title}`}
                            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isLocked ? 'blur-md scale-105 grayscale-[50%]' : 'opacity-80'}`}
                          />
                        )}
                        
                        <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40 ${isLocked ? 'bg-slate-950/90' : ''} z-0`} />
                        {isCurrent && <div className="scan-line opacity-50 z-0" />}

                        <div className="relative p-5 flex flex-col justify-between h-full z-10">
                          <div className="flex justify-between items-start">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${isCurrent ? 'bg-medical-cyan/20 text-medical-cyan border-medical-cyan/50' : 'bg-slate-950/60 text-slate-400 border-slate-700'}`}>
                              DAY {dayNum}
                            </span>
                            {isLocked ? <Lock className="w-5 h-5 text-slate-500" /> : 
                            isCurrent ? <Activity className="w-5 h-5 text-medical-cyan animate-pulse drop-shadow-[0_0_5px_rgba(0,188,212,0.8)]" /> : 
                            <CheckCircle className="w-5 h-5 text-medical-success" />
                            }
                          </div>

                          <div>
                            <h3 className={`font-bold text-xl leading-tight mb-2 ${isLocked ? 'text-slate-500' : 'text-white group-hover:text-medical-cyan transition-colors'}`}>
                              {topic.title || "Unknown Topic"}
                            </h3>
                            {/* ADDED DESCRIPTION HERE */}
                            <p className={`text-sm leading-snug line-clamp-2 ${isLocked ? 'text-slate-600' : 'text-slate-300'}`}>
                              {topic.description || "No description available."}
                            </p>
                          </div>

                          {!isLocked && isCurrent && (
                            <div className="flex items-center gap-2 text-xs text-medical-cyan font-bold animate-pulse mt-3">
                              <PlayCircle className="w-4 h-4" />
                              Initialize Simulation
                            </div>
                          )}
                        </div>

                        {!isLocked && (
                          <Link to={`/quiz/${dayNum}`} className="absolute inset-0 z-20 cursor-pointer">
                            <span className="sr-only">Start Day {dayNum}</span>
                          </Link>
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
             ) : (
                <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-slate-800 border-dashed rounded-xl text-slate-500 bg-slate-900/50">
                  <AlertTriangle className="w-8 h-8 mb-2 text-yellow-500" />
                  <p className="font-clinical">No modules found for this sector.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Leaderboard */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-md sticky top-6 shadow-xl">
              <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-950/50">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Users className="w-4 h-4 text-medical-cyan" /> Top Agents
                </h3>
                <div className="flex bg-slate-800 rounded p-1">
                  {['national', 'institution'].map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setLbMode(mode as any)}
                      className={`px-3 py-1 text-[10px] uppercase font-bold rounded transition-all ${lbMode === mode ? 'bg-medical-cyan text-slate-950 shadow-[0_0_10px_rgba(0,188,212,0.3)]' : 'text-slate-400 hover:text-white'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto custom-scrollbar min-h-[200px]">
                {isLoading && leaderboard.length === 0 ? (
                   <div className="p-12 text-center">
                     <Loader2 className="w-6 h-6 text-slate-600 animate-spin mx-auto mb-2" />
                     <p className="text-xs text-slate-500 font-clinical">ESTABLISHING UPLINK...</p>
                   </div>
                ) : leaderboard.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <p>No agents found in network.</p>
                    </div>
                ) : (
                  leaderboard.map((user, idx) => (
                    <div key={user.user_id || idx} className="p-3 flex items-center gap-3 border-b border-slate-800/50 hover:bg-white/5 transition-colors relative">
                      {idx < 3 && <div className={`absolute left-0 top-0 bottom-0 w-1 ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-300' : 'bg-orange-500'}`} />}
                      <div className={`font-mono font-bold w-6 text-center ${idx < 3 ? 'text-white' : 'text-slate-600'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-200 text-sm truncate flex items-center gap-2">
                          {user.full_name || user.display_name || 'Unknown Agent'}
                          {userStats && user.user_id === userStats.user_id && <span className="text-[10px] bg-medical-cyan/20 text-medical-cyan px-1 rounded">(YOU)</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{user.institution_name || user.organization || 'Freelance'}</div>
                      </div>
                      <div className="font-mono text-medical-cyan font-bold text-sm bg-medical-cyan/10 px-2 py-1 rounded border border-medical-cyan/20">
                        {user.total_score || 0}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard
