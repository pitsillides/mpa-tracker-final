'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import confetti from 'canvas-confetti'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [lang, setLang] = useState<'EL' | 'EN'>('EL')
  
  const target = 1000000

  useEffect(() => {
    setMounted(true)
    const fetchData = async () => {
      const { data } = await supabase.from('progress_data').select('*').single()
      if (data) setCurrent(data.current_amount)

      const { data: stats } = await supabase.from('page_stats').select('visit_count').single()
      if (stats) {
        await supabase.from('page_stats').update({ visit_count: stats.visit_count + 1 }).eq('id', 1)
      }
    }
    fetchData()

    const subscription = supabase.channel('progress_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'progress_data' }, (payload) => {
        setCurrent(payload.new.current_amount)
      })
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [])

  // Confetti Effect
  useEffect(() => {
    if (mounted && current >= target) {
      const end = Date.now() + 3 * 1000;
      const frame = () => {
        confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#38BDF8', '#FFD700'] });
        confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#38BDF8', '#FFD700'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [current, mounted])

  if (!mounted) return <div className="min-h-screen bg-[#020410]"></div>

  const percentage = (current / target) * 100;
  const isGoalReached = current >= target;
  const segments = Array.from({ length: 12 }, (_, i) => i);

  return (
    <main className="min-h-screen bg-[#020410] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#38BDF8]/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0EA5E9]/10 blur-[120px] rounded-full animate-pulse"></div>
      </div>

      {/* Language Switcher */}
      <div className="absolute top-8 right-8 z-50 flex gap-2">
        {['EL', 'EN'].map((l) => (
          <button key={l} onClick={() => setLang(l as 'EL' | 'EN')} className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border transition-all ${lang === l ? 'bg-[#38BDF8] border-[#38BDF8] text-[#0a0b1e]' : 'bg-transparent border-white/20 text-white/50'}`}>{l}</button>
        ))}
      </div>

      <div className="w-full max-w-5xl bg-white/[0.02] backdrop-blur-3xl rounded-[4rem] p-12 md:p-20 border border-white/10 shadow-2xl relative z-10 text-center">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-16">
          <img src="/logo.png" alt="Logo" className="h-28 md:h-36 drop-shadow-2xl mb-10" />
          <h1 className={`text-xs md:text-sm font-black tracking-[0.5em] uppercase italic transition-colors duration-1000 ${isGoalReached ? 'text-yellow-500' : 'text-[#38BDF8]'}`}>
            MPA PROPERTY PROMOTERS & CONSULTANTS LTD
          </h1>
        </div>

        {/* Progress Bar Container */}
        <div className="relative mb-12 text-left">
          <div className="flex justify-between items-end mb-6 px-4">
            <span className="text-[#38BDF8] text-[11px] font-black tracking-widest uppercase italic opacity-70">
               {isGoalReached ? (lang === 'EL' ? 'Ο ΣΤΟΧΟΣ ΕΠΙΤΕΥΧΘΗ!' : 'GOAL REACHED!') : (lang === 'EL' ? 'ΠΡΟΟΔΟΣ ΣΤΟΧΟΥ' : 'TARGET PROGRESS')}
            </span>
            <span className={`font-black text-6xl md:text-8xl italic tracking-tighter leading-none ${isGoalReached ? 'text-yellow-500' : 'text-white'}`}>
              {percentage.toFixed(1)}%
            </span>
          </div>

          <div className="relative h-28 bg-black/60 rounded-[2rem] p-3 border border-white/10 shadow-inner overflow-hidden">
            {/* 12 Segments */}
            <div className="absolute inset-0 flex justify-between px-4 z-20 pointer-events-none opacity-20">
              {segments.map((s) => (
                <div key={s} className="w-[1px] h-full bg-white"></div>
              ))}
            </div>

            {/* Progress Fill */}
            <div 
              className={`h-full rounded-xl transition-all duration-[2000ms] ease-out relative shadow-xl ${isGoalReached ? 'bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9]'}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 blur-sm animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="flex flex-col items-center mt-12">
          <div className={`h-[1px] w-64 mb-8 ${isGoalReached ? 'bg-yellow-500' : 'bg-white/10'}`}></div>
          <p className={`text-2xl md:text-4xl font-black italic tracking-widest uppercase animate-pulse ${isGoalReached ? 'text-yellow-500' : 'text-white'}`}>
            {isGoalReached ? (lang === 'EL' ? '✨ ΜΠΡΑΒΟ! ✨' : '✨ BRAVO! ✨') : (lang === 'EL' ? 'ΚΑΛΗ ΕΠΙΤΥΧΙΑ ΣΕ ΟΛΟΥΣ!' : 'GOOD LUCK TO EVERYONE!')}
          </p>
        </div>
      </div>
    </main>
  )
}