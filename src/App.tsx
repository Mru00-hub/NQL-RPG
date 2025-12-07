import React, { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useGameStore } from './stores/gameStore'
import Dashboard from './pages/Dashboard'
import ClinicalTerminal from './components/quiz/ClinicalTerminal'
import { Activity } from 'lucide-react'

// Auth Guard Component
const AuthLayout = () => {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { fetchUserStats } = useGameStore()

  useEffect(() => {
    let mounted = true;
    
    // Safety timeout: stop loading after 3 seconds even if Supabase is slow
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth check timed out, defaulting to guest/login');
        setLoading(false);
      }
    }, 3000);

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          setSession(session)
          if (session) {
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-medical-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-medical-cyan animate-pulse" />
          <p className="text-medical-cyan font-clinical tracking-widest text-sm">INITIALIZING SYSTEM...</p>
        </div>
      </div>
    )
  }

  

  if (!session) {
    return (
      <div className="min-h-screen bg-medical-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-medical-cyan/30 p-8 rounded-lg text-center shadow-[0_0_30px_rgba(0,188,212,0.1)]">
          <h1 className="text-3xl font-bold text-white mb-6">MedNexus RPG</h1>
          
          <div className="space-y-4">
            <input 
              type="email" 
              placeholder="Test Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-800 text-white rounded border border-slate-600 focus:border-medical-cyan outline-none"
            />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-800 text-white rounded border border-slate-600 focus:border-medical-cyan outline-none"
            />
            
            <button 
              onClick={async () => {
                const { error } = await supabase.auth.signInWithPassword({
                  email,
                  password
                })
                if (error) alert(error.message)
              }}
              className="w-full py-3 bg-medical-cyan text-medical-dark font-bold rounded hover:bg-cyan-400 transition-colors"
            >
              Login (No Redirect)
            </button>
            
            <div className="text-xs text-slate-500 mt-4">
              Tip: Create a user in Supabase Dashboard first.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quiz/:dayNumber" element={<ClinicalTerminal />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
