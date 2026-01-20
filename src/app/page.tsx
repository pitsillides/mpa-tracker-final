'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function HomePage() {
  const [amount, setAmount] = useState<number>(0)
  const [displayAmount, setDisplayAmount] = useState<number>(0)
  const [lang, setLang] = useState<'EL' | 'EN'>('EL')
  
  const goal = 1000000
  const percentage = (amount / goal) * 100
  const isFinished = percentage >= 100

  // Counter Animation
  useEffect(() => {
    const duration = 2000;
    const start = displayAmount;
    const end = percentage;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayAmount(start + (end - start) * progress);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [amount]);

  // REALTIME SUBSCRIPTION: Εδώ γίνεται η "μαγεία" του αυτόματου refresh
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('progress_data').select('*').single()
      if (data) setAmount(data.current_amount)
    }
    fetchData()

    const channel = supabase.channel('realtime-updates')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'progress_data' 
      }, (payload: any) => {
        setAmount(payload.new.current_amount) // Ενημερώνεται αυτόματα χωρίς refresh
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const content = {
    EL: { title: 'ΠΡΟΟΔΟΣ ΣΤΟΧΟΥ', goodLuck: 'ΚΑΛΗ ΕΠΙΤΥΧΙΑ', success: 'Ο ΣΤΟΧΟΣ ΕΠΙΤΕΥΧΘΗ!', bravo: 'ΜΠΡΑΒΟ!' },
    EN: { title: 'TARGET PROGRESS', goodLuck: 'GOOD LUCK', success: 'TARGET ACHIEVED!', bravo: 'BRAVO!' }
  }

  return (
    <main className="h-screen w-full bg-[#12133c] flex flex-col items-center justify-between py-10 px-6 text-white overflow-hidden font-sans relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#38BDF8]/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 flex gap-2 z-50">
        {['EL', 'EN'].map((l) => (
          <button key={l} onClick={() => setLang(l as 'EL' | 'EN')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${lang === l ? 'bg-[#38BDF8] border-[#38BDF8] text-[#12133c]' : 'bg-transparent border-white/20 text-white/60 hover:border-white/40'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex-shrink-0 relative z-10">
        <img src="/logo.png" alt="Logo" className="h-24 md:h-32 w-auto object-contain drop-shadow-[0_0_20px_rgba(56,189,248,0.3)]" />
      </div>

      <div className="text-center z-10">
        <h1 className="text-3xl md:text-5xl font-black italic tracking-[0.3em] uppercase text-[#38BDF8]">
          {content[lang].title}
        </h1>
      </div>

      {/* Animated Percentage */}
      <div className="w-full max-w-5xl flex flex-col items-center justify-center relative z-10">
        <div className="text-center mb-[-1.5rem] md:mb-[-2.5rem] z-20">
          <span className={`text-[9rem] md:text-[13rem] font-black italic tracking-tighter leading-none drop-shadow-[0_15px_40px_rgba(0,0,0,0.6)] transition-colors duration-1000 ${isFinished ? 'text-yellow-400' : 'text-white'}`}>
            {displayAmount.toFixed(1)}<span className={`${isFinished ? 'text-yellow-500' : 'text-[#38BDF8]'} text-5xl md:text-7xl ml-2`}>%</span>
          </span>
        </div>

        {/* Progress Bar with 12 Segments */}
        <div className="w-full relative px-4">
          <div className={`relative h-28 md:h-36 w-full bg-black/40 backdrop-blur-xl rounded-2xl border-2 overflow-hidden shadow-2xl transition-all duration-1000 ${isFinished ? 'border-yellow-500' : 'border-white/10'}`}>
            <div className={`h-full transition-all duration-[2000ms] ease-out relative ${isFinished ? 'bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-100' : 'bg-gradient-to-r from-[#12133c] via-[#38BDF8] to-[#ffffff]'}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}>
              {isFinished && (
                <div className="absolute inset-0 flex items-center justify-end pr-10">
                  <span className="text-[#12133c] font-black italic text-5xl md:text-7xl tracking-tighter animate-bounce">{content[lang].bravo}</span>
                </div>
              )}
            </div>
            <div className="absolute inset-0 flex w-full h-full pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`flex-1 border-r last:border-r-0 h-full ${isFinished ? 'border-yellow-900/20' : 'border-white/10'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Title */}
      <div className="flex flex-col items-center pb-8 z-10 w-full px-2">
          <div className="h-[2px] w-full max-w-lg bg-gradient-to-r from-transparent via-[#38BDF8]/30 to-transparent mb-6"></div>
          <p className={`text-2xl md:text-5xl font-black uppercase tracking-[0.4em] md:tracking-[0.8em] italic text-center whitespace-nowrap transition-all duration-1000 ${isFinished ? 'text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]' : 'text-[#38BDF8]'}`}>
            {isFinished ? content[lang].success : content[lang].goodLuck}
          </p>
      </div>
    </main>
  )
}