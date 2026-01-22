'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [current, setCurrent] = useState(0)
  const target = 1500000

  useEffect(() => {
    setMounted(true)
    
    const fetchData = async () => {
      // 1. Progress Data
      const { data } = await supabase.from('progress_data').select('*').single()
      if (data) setCurrent(data.current_amount)

      // 2. Silent Visit Counter (Δεν επηρεάζει το UI)
      const { data: stats } = await supabase.from('page_stats').select('visit_count').single()
      if (stats) {
        await supabase.from('page_stats')
          .update({ visit_count: stats.visit_count + 1 })
          .eq('id', 1)
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

  if (!mounted) return <div className="min-h-screen bg-[#0a0b1e]"></div>

  const percentage = Math.min((current / target) * 100, 100)

  return (
    <main className="min-h-screen bg-[#0a0b1e] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#38BDF8]/30">
      
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#38BDF8]/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0EA5E9]/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-4xl bg-white/[0.03] backdrop-blur-2xl rounded-[3rem] p-8 md:p-16 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] z-10">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-16 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#38BDF8]/20 blur-2xl rounded-full"></div>
            <img src="/logo.png" alt="Logo" className="h-24 md:h-32 relative z-10 drop-shadow-2xl" />
          </div>
          <h1 className="text-[#38BDF8] text-xs md:text-sm font-black tracking-[0.5em] uppercase italic leading-loose max-w-lg">
            MPA PROPERTY PROMOTERS & CONSULTANTS LTD
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#38BDF8]/50 to-transparent mt-4"></div>
        </div>

        {/* Progress Bar Container */}
        <div className="relative mb-16">
          <div className="flex justify-between items-end mb-4 px-2">
            <span className="text-[#38BDF8] text-[10px] font-black tracking-widest uppercase italic">ΠΡΟΟΔΟΣ ΣΤΟΧΟΥ</span>
            <span className="text-white font-black text-4xl md:text-5xl italic tracking-tighter">
              {percentage.toFixed(1)}<span className="text-[#38BDF8] text-2xl ml-1">%</span>
            </span>
          </div>

          <div className="relative h-20 bg-black/40 rounded-3xl p-2 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* The Actual Bar */}
            <div 
              className="h-full bg-gradient-to-r from-[#38BDF8] via-[#0EA5E9] to-[#38BDF8] rounded-2xl transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(56,189,248,0.3)]"
              style={{ width: `${percentage}%` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] bg-[length:200%_100%] animate-[shimmer_3s_infinite] rounded-2xl"></div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group bg-white/[0.02] hover:bg-white/[0.04] transition-all p-8 rounded-[2rem] border border-white/5 hover:border-[#38BDF8]/30 relative overflow-hidden">
            <p className="text-[#38BDF8] text-[10px] font-bold tracking-[0.2em] uppercase mb-3 opacity-70">ΤΡΕΧΟΝ ΠΟΣΟ</p>
            <p className="text-4xl md:text-5xl text-white font-mono font-bold tracking-tighter italic relative z-10">
              €{current.toLocaleString('el-GR')}
            </p>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <div className="w-12 h-12 bg-[#38BDF8] rounded-full blur-xl"></div>
            </div>
          </div>

          <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
            <p className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">ΣΤΟΧΟΣ ΠΩΛΗΣΕΩΝ</p>
            <p className="text-4xl md:text-5xl text-white/40 font-mono font-bold tracking-tighter italic">
              €{target.toLocaleString('el-GR')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="mt-12 opacity-20 text-[10px] text-[#38BDF8] tracking-[1em] uppercase font-black italic">
        Real Estate Progress Tracker
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </main>
  )
}