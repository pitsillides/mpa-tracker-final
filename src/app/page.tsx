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
      // 1. Φέρνουμε το ποσό προόδου
      const { data } = await supabase.from('progress_data').select('*').single()
      if (data) setCurrent(data.current_amount)

      // 2. ΜΕΤΡΗΤΗΣ ΕΠΙΣΚΕΨΕΩΝ: Αυξάνουμε κατά 1 κάθε φορά που φορτώνει η σελίδα
      const { data: stats } = await supabase.from('page_stats').select('visit_count').single()
      if (stats) {
        await supabase.from('page_stats').update({ visit_count: stats.visit_count + 1 }).eq('id', 1)
      }
    }
    
    fetchData()

    // Real-time ανανέωση αν αλλάξεις κάτι από το Admin
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
      <div className="w-full max-w-4xl bg-white/5 backdrop-blur-xl rounded-[3rem] p-12 border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center mb-16">
          <img src="/logo.png" alt="Logo" className="h-24 mb-8" />
          <h1 className="text-[#38BDF8] text-sm font-black tracking-[0.4em] uppercase italic text-center leading-loose">
            MPA PROPERTY PROMOTERS & CONSULTANTS LTD
          </h1>
        </div>

        <div className="relative h-24 bg-black/40 rounded-full p-2 border border-white/10 shadow-inner mb-12">
          <div 
            className="h-full bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9] rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:30px_30px]"></div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-black text-3xl italic tracking-tighter">
            {percentage.toFixed(1)}%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-center">
          <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
            <p className="text-[#38BDF8] text-[10px] font-bold tracking-widest uppercase mb-2">ΠΟΣΟ ΠΡΟΟΔΟΥ</p>
            <p className="text-4xl text-white font-mono font-bold tracking-tighter italic">€{current.toLocaleString('el-GR')}</p>
          </div>
          <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
            <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-2">ΣΤΟΧΟΣ</p>
            <p className="text-4xl text-white font-mono font-bold tracking-tighter italic opacity-60">€{target.toLocaleString('el-GR')}</p>
          </div>
        </div>
      </div>
    </main>
  )
}