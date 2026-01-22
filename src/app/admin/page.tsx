'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import confetti from 'canvas-confetti'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [displayNum, setDisplayNum] = useState(0) // Για το animation του αριθμού
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

    const subscription = supabase
      .channel('progress_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'progress_data' }, (payload) => {
        setCurrent(payload.new.current_amount)
      })
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [])

  // Animation για το νούμερο που ανεβαίνει
  useEffect(() => {
    if (current > 0) {
      const duration = 2000; // 2 δευτερόλεπτα animation
      const steps = 60;
      const increment = current / steps;
      let count = 0;
      const timer = setInterval(() => {
        count += increment;
        if (count >= current) {
          setDisplayNum(current);
          clearInterval(timer);
        } else {
          setDisplayNum(Math.floor(count));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [current]);

  // Εφέ Confetti όταν ξεπεράσει το στόχο
  useEffect(() => {
    if (current >= target && mounted) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [current, target, mounted]);

  if (!mounted) return null;

  const percentage = (current / target) * 100;
  const isGoalReached = current >= target;
  const segments = Array.from({ length: 12 }, (_, i) => i);

  return (
    <main className="min-h-screen bg-[#020410] flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-[-20%] left-[-10%] w-[70%] h-[70%] blur-[150px] rounded-full animate-pulse transition-colors duration-1000 ${isGoalReached ? 'bg-yellow-500/10' : 'bg-[#38BDF8]/10'}`}></div>
        <div className={`absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] blur-[150px] rounded-full animate-pulse transition-colors duration-1000 ${isGoalReached ? 'bg-orange-500/10' : 'bg-[#0EA5E9]/10'}`}></div>
      </div>

      {/* Language Switcher */}
      <div className="absolute top-8 right-8 z-50 flex gap-3">
        {['EL', 'EN'].map((l) => (
          <button key={l} onClick={() => setLang(l as 'EL' | 'EN')} className={`px-5 py-2 rounded-full text-[11px] font-black tracking-widest border transition-all ${lang === l ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10'}`}>{l}</button>
        ))}
      </div>

      <div className="w-full max-w-5xl bg-white/[0.01] backdrop-blur-3xl rounded-[5rem] p-12 md:p-24 border border-white/[0.08] shadow-2xl relative z-10">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-20">
          <img src="/logo.png" alt="Logo" className="h-32 md:h-44 drop-shadow-2xl mb-10" />
          <h1 className={`text-xs md:text-sm font-black tracking-[0.5em] uppercase italic text-center transition-colors duration-1000 ${isGoalReached ? 'text-yellow-500' : 'text-[#38BDF8]'}`}>
            MPA PROPERTY PROMOTERS & CONSULTANTS LTD
          </h1>
        </div>

        {/* Progress Display */}
        <div className="relative mb-8">
          <div className="flex justify-between items-end mb-8 px-6">
            <span className="text-[#38BDF8] text-xs font-black tracking-widest uppercase italic opacity-60">
              {isGoalReached ? (lang === 'EL' ? 'Ο ΣΤΟΧΟΣ ΕΠΙΤΕΥΧΘΗ!' : 'GOAL REACHED!') : (lang === 'EL' ? 'ΠΡΟΟΔΟΣ ΣΤΟΧΟΥ' : 'TARGET PROGRESS')}
            </span>
            <span className={`font-black text-7xl md:text-9xl italic tracking-tighter leading-none transition-colors duration-1000 ${isGoalReached ? 'text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]' : 'text-white'}`}>
              {((displayNum / target) * 100).toFixed(1)}%
            </span>
          </div>

          {/* Animated Bar */}
          <div className="relative h-32 bg-black/80 rounded-[2.5rem] p-3 border border-white/[0.1] shadow-2xl overflow-hidden">
            {/* Segments */}
            <div className="absolute inset-0 flex justify-between px-4 z-20 opacity-20 pointer-events-none">
              {segments.map((s) => <div key={s} className="w-[1px] h-full bg-white"></div>)}
            </div>

            {/* Fill */}
            <div 
              className={`h-full rounded-[1.5rem] transition-all duration-[2500ms] cubic-bezier(0.17, 0.67, 0.83, 0.67) relative shadow-2xl ${isGoalReached ? 'bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 animate-[shimmer_2s_infinite]' : 'bg-gradient-to-r from-[#004e92] via-[#00c6ff] to-[#004e92] animate-[shimmer_4s_infinite]'}`}
              style={{ width: `${Math.min((displayNum / target) * 100, 100)}%`, backgroundSize: '200% 100%' }}
            >
              {isGoalReached && <div className="absolute inset-0 bg-white/20 blur-sm animate-pulse"></div>}
            </div>
          </div>
        </div>

        {/* Bravo / Good Luck Message */}
        <div className="flex flex-col items-center mt-12 text-center">
          <div className={`h-[2px] w-64 mb-10 transition-all duration-1000 ${isGoalReached ? 'bg-yellow-500' : 'bg-[#38BDF8]/30'}`}></div>
          <p className={`text-3xl md:text-5xl font-black italic tracking-widest uppercase transition-all duration-700 ${isGoalReached ? 'text-yellow-400 scale-110' : 'text-white opacity-80'}`}>
            {isGoalReached ? (lang === 'EL' ? '✨ ΜΠΡΑΒΟ! ✨' : '✨ BRAVO! ✨') : (lang === 'EL' ? 'ΚΑΛΗ ΕΠΙΤΥΧΙΑ ΣΕ ΟΛΟΥΣ!' : 'GOOD LUCK TO EVERYONE!')}
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </main>
  )
}