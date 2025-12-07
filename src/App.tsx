import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useGameStore } from './stores/gameStore'
import Dashboard from './pages/Dashboard'
import ClinicalTerminal from './components/quiz/ClinicalTerminal'
import { Activity, ShieldAlert, UserCircle } from 'lucide-react'

// Auth Guard Component
const AuthLayout = () => {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { fetchUserStats } = useGameStore()

  useEffect(() => {
    let mounted = true;
    
    // Safety timeout: stop loading after 5 seconds to prevent infinite white screen
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth check timed out.');
        setLoading(false);
      }
    }, 5000);

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          setSession(session)
          if (session) {
            // Fetch stats immediately if session exists
            fetchUserStats(session.user.id)
          }
          setLoading(false)
        }
      } catch (e) {
        console.error("Auth check failed:", e)
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session)
        if (session) {
          fetchUserStats(session.user.id)
        }
      }
    })

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe()
    }
  }, [])

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-medical-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-16 h-16 text-medical-cyan animate-pulse" />
          <div className="flex flex-col items-center">
            <p className="text-medical-cyan font-clinical tracking-widest text-sm font-bold">SYSTEM INITIALIZING</p>
            <p className="text-slate-500 text-xs mt-1">Establishing Secure Connection...</p>
          </div>
        </div>
      </div>
    )
  }

  // 2. Login State (Standalone Preview Mode)
  if (!session) {
    return (
      <div className="min-h-screen bg-medical-dark flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-medical-cyan to-transparent opacity-50"></div>
        <div className="absolute -left-20 top-1/2 w-64 h-64 bg-medical-cyan/10 rounded-full blur-3xl"></div>

        <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-md border border-medical-cyan/30 p-8 rounded-2xl text-center shadow-[0_0_50px_rgba(0,188,212,0.15)] relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-medical-cyan/10 rounded-full flex items-center justify-center border border-medical-cyan/50">
               <ShieldAlert className="w-8 h-8 text-medical-cyan" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">MedNexus RPG</h1>
          <p className="text-slate-400 mb-8 font-clinical text-lg">Restricted Access: Medical Personnel Only</p>
          
          <div className="space-y-4">
            <button 
              onClick={async () => {
                // Using Anonymous Sign In for smoother preview testing
                const { error } = await supabase.auth.signInAnonymously()
                if (error) {
                  alert(`Login Failed: ${error.message}\n\nTip: Enable "Anonymous Sign-ins" in your Supabase Auth Providers settings.`)
                }
              }}
              className="w-full py-4 bg-medical-cyan hover:bg-cyan-400 text-medical-dark font-bold text-lg rounded-lg transition-all shadow-[0_0_20px_rgba(0,188,212,0.4)] hover:shadow-[0_0_30px_rgba(0,188,212,0.6)] flex items-center justify-center gap-2"
            >
              <UserCircle className="w-5 h-5" />
              Initialize Guest Session
            </button>
            
            <p className="text-xs text-slate-500 mt-6 font-mono">
              SECURE TERMINAL // V.2.0.4
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />
}

// 3. Main Router Configuration
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quiz/:dayNumber" element={<ClinicalTerminal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
