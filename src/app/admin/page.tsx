'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AdminPage() {
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [current, setCurrent] = useState<number>(0)
  const [visits, setVisits] = useState<number>(0)
  const [val, setVal] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [lang, setLang] = useState<'EL' | 'EN'>('EL')

  // Ο ΚΩΔΙΚΟΣ ΣΟΥ
  const SECRET_PIN = "2024" 

  useEffect(() => {
    setMounted(true)
    document.title = "MPA PROPERTY PROMOTERS & CONSULTANTS LTD | Admin";
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    // Φόρτωση Ποσού
    const { data: progress } = await supabase.from('progress_data').select('*').single()
    if (progress) setCurrent(progress.current_amount)

    // Φόρτωση Ιστορικού (τελευταία 15)
    const { data: history } = await supabase
      .from('history_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15)
    if (history) setLogs(history)

    // Φόρτωση Επισκέψεων
    const { data: stats } = await supabase.from('page_stats').select('visit_count').single()
    if (stats) setVisits(stats.visit_count)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === SECRET_PIN) {
      setIsAuthenticated(true)
    } else {
      alert("Λάθος κωδικός! / Wrong PIN!")
      setPin('')
    }
  }

  const formatInput = (input: string) => {
    const digits = input.replace(/\D/g, '')
    if (!digits) return ''
    return parseInt(digits).toLocaleString(lang === 'EL' ? 'el-GR' : 'en-US')
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanNum = parseInt(val.replace(/\./g, '').replace(/,/g, ''))
    if (isNaN(cleanNum)) return alert("Βάλε αριθμό / Enter number")
    
    setLoading(true)
    const { error } = await supabase.from('progress_data').update({ current_amount: cleanNum }).eq('id', 1)
    if (!error) {
      await supabase.from('history_logs').insert([{ old_amount: current, new_amount: cleanNum }])
      setCurrent(cleanNum)
      setVal('')
      fetchInitialData()
    }
    setLoading(false)
  }

  const clearHistory = async () => {
    if (!confirm(lang === 'EL' ? "Σίγουρη διαγραφή ιστορικού;" : "Clear history?")) return;
    setLoading(true)
    await supabase.from('history_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setLogs([])
    setLoading(false)
  }

  if (!mounted) return null

  // ΟΘΟΝΗ ΕΙΣΟΔΟΥ (LOGIN)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020410] flex items-center justify-center p-6 font-sans">
        <form onSubmit={handleLogin} className="bg-white/5 p-10 rounded-[3rem] border border-white/10 w-full max-w-sm text-center shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex justify-center">
             <img src="/logo.png" alt="Logo" className="h-20 opacity-80" />
          </div>
          <h2 className="text-[#38BDF8] font-black mb-2 italic tracking-widest uppercase text-sm">Admin Access</h2>
          <p className="text-white/30 text-[10px] mb-8 tracking-[0.2em]">ENTER SECURITY PIN</p>
          <input 
            type="password" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-white text-center text-3xl mb-6 outline-none focus:border-[#38BDF8] transition-all"
            placeholder="****"
            autoFocus
          />
          <button className="w-full bg-[#38BDF8] text-[#020410] p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#7dd3fc] transition-colors">
            Unlock
          </button>
        </form>
      </div>
    )
  }

  // ΚΥΡΙΩΣ ADMIN PANEL
  return (
    <div className="min-h-screen bg-[#020410] text-white p-6 font-sans relative">
      {/* Lang Switcher */}
      <div className="absolute top-6 right-6 flex gap-2">
        {['EL', 'EN'].map(l => (
          <button key={l} onClick={() => setLang(l as 'EL' | 'EN')} className={`px-4 py-2 rounded-xl font-bold transition-all ${lang === l ? 'bg-[#38BDF8] text-[#020410]' : 'bg-white/5 text-white/40'}`}>{l}</button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 pt-16">
        
        {/* ΑΡΙΣΤΕΡΗ ΠΛΕΥΡΑ: ΕΝΗΜΕΡΩΣΗ */}
        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-2xl h-fit">
          <div className="flex items-center gap-4 mb-10">
             <img src="/logo.png" alt="Logo" className="h-12" />
             <h2 className="text-[#38BDF8] font-black italic uppercase tracking-widest text-xs">Management Panel</h2>
          </div>
          
          <div className="mb-8 p-8 bg-black/40 rounded-[2rem] border border-[#38BDF8]/20 text-center relative overflow-hidden text-pretty">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.3em] mb-3 italic">CURRENT PROGRESS</p>
            <p className="text-6xl font-mono font-bold text-white tracking-tighter">€{current.toLocaleString('el-GR')}</p>
            {/* Target Indicator */}
            <p className="text-[10px] text-[#38BDF8]/50 mt-4 font-bold tracking-widest uppercase italic">Target: €1.000.000</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 text-pretty">
            <div className="relative">
              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl text-[#38BDF8] font-bold">€</span>
              <input 
                type="text" 
                value={val} 
                onChange={(e) => setVal(formatInput(e.target.value))}
                className="w-full p-8 pl-16 bg-black/40 border border-white/10 rounded-3xl text-white text-3xl font-mono outline-none focus:border-[#38BDF8] text-center transition-all" 
                placeholder="0" 
              />
            </div>
            <button disabled={loading} className="w-full bg-[#38BDF8] text-[#020410] p-8 rounded-3xl font-black text-2xl shadow-xl uppercase transition-all active:scale-95 hover:shadow-[#38BDF8]/20">
              {loading ? '...' : (lang === 'EL' ? 'ΕΝΗΜΕΡΩΣΗ' : 'UPDATE')}
            </button>
          </form>
        </div>

        {/* ΔΕΞΙΑ ΠΛΕΥΡΑ: ΙΣΤΟΡΙΚΟ & VISITS */}
        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-2xl flex flex-col max-h-[750px] text-pretty">
          <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6">
            <div className="flex flex-col">
              <h2 className="text-yellow-500 font-black italic uppercase tracking-widest text-sm">{lang === 'EL' ? 'ΙΣΤΟΡΙΚΟ' : 'HISTORY LOGS'}</h2>
              <div className="flex items-center gap-2 mt-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 w-fit">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                <p className="text-[10px] text-blue-300 font-bold uppercase tracking-tighter">
                  {lang === 'EL' ? 'Επισκέψεις:' : 'Visits:'} <span className="text-white ml-1">{visits}</span>
                </p>
              </div>
            </div>
            <button onClick={clearHistory} className="text-[10px] font-bold text-red-400/60 uppercase underline hover:text-red-400 transition-colors">{lang === 'EL' ? 'ΚΑΘΑΡΙΣΜΟΣ' : 'CLEAR'}</button>
          </div>
          
          <div className="overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {logs.length === 0 && <p className="text-center text-white/20 py-10 italic">No logs yet...</p>}
            {logs.map((log) => (
              <div key={log.id} className="p-5 bg-black/30 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                <div className="text-[10px] text-slate-500 font-bold mb-3 flex items-center gap-2">
                   <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                   {new Date(log.created_at).toLocaleString('el-GR')}
                </div>
                <div className="flex items-center justify-between px-2">
                  <span className="text-slate-500 line-through opacity-40 text-sm font-mono italic">€{log.old_amount.toLocaleString('el-GR')}</span>
                  <span className="text-[#38BDF8] animate-lateral group-hover:translate-x-1 transition-transform">→</span>
                  <span className="text-white text-xl font-mono font-bold italic drop-shadow-sm">€{log.new_amount.toLocaleString('el-GR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}