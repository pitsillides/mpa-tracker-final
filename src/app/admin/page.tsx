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
      // 1. Φέρνουμε το ποσό (Όπως ήταν)
      const { data } = await supabase.from('progress_data').select('*').single()
      if (data) setCurrent(data.current_amount)

      // 2. Μετρητής Επισκέψεων (Λειτουργεί στο παρασκήνιο)
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

  if (!mounted) return <div className="min-h-screen bg-[#0a0b1e]"></div>

  const percentage = Math.min((current / target) * 100, 100)

  return (
    <main className="min-h-screen bg-[#0a0b1e] flex flex-col items-center justify-center p-6 font-sans">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#38BDF8]/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0EA5E9]/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-4xl bg-white/5 backdrop-blur-2xl rounded-[3rem] p-12 border border-white/10 shadow-2xl z-10">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-16">
          <img src="/logo.png" alt="Logo" className="h-24 mb-8 drop-shadow-2xl" />
          <h1 className="text-[#38BDF8] text-sm font-black tracking-[0.4em] uppercase italic text-center leading-loose">
            MPA PROPERTY PROMOTERS & CONSULTANTS LTD
          </h1>
        </div>

        {/* Progress Bar Section */}
        <div className="relative mb-12">
          <div className="flex justify-between items-end mb-4 px-2">
            <span className="text-[#38BDF8] text-[10px] font-black tracking-widest uppercase italic">ΠΡΟΟΔΟΣ ΣΤΟΧΟΥ</span>
            <span className="text-white font-black text-5xl italic tracking-tighter drop-shadow-md">
              {percentage.toFixed(1)}%
            </span>
          </div>

          <div className="relative h-24 bg-black/40 rounded-full p-2 border border-white/10 shadow-inner overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9] rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_30px_rgba(56,189,248,0.4)]"
              style={{ width: `${percentage}%` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:30px_30px] animate-[pulse_2s_linear_infinite] opacity-20"></div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-8 text-center font-bold">
          <div className="bg-black/20 p-8 rounded-[2rem] border border-white/5 backdrop-blur-sm">
            <p className="text-[#38BDF8] text-[10px] tracking-widest uppercase mb-2">ΠΟΣΟ ΠΡΟΟΔΟΥ</p>
            <p className="text-4xl text-white font-mono tracking-tighter italic">€{current.toLocaleString('el-GR')}</p>
          </div>
          <div className="bg-black/20 p-8 rounded-[2rem] border border-white/5 backdrop-blur-sm">
            <p className="text-slate-500 text-[10px] tracking-widest uppercase mb-2">ΣΤΟΧΟΣ</p>
            <p className="text-4xl text-white font-mono tracking-tighter italic opacity-40">€{target.toLocaleString('el-GR')}</p>
          </div>
        </div>
      </div>
    </main>
  )
}