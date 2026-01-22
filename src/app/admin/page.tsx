'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AdminPage() {
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [current, setCurrent] = useState<number>(0)
  const [visits, setVisits] = useState<number>(0) // Νέο state για επισκέψεις
  const [val, setVal] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [lang, setLang] = useState<'EL' | 'EN'>('EL')

  const SECRET_PIN = "1234" 

  useEffect(() => {
    setMounted(true)
    document.title = "MPA PROPERTY PROMOTERS & CONSULTANTS LTD | Admin";
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    // 1. Φόρτωση ποσού
    const { data: progress } = await supabase.from('progress_data').select('*').single()
    if (progress) setCurrent(progress.current_amount)

    // 2. Φόρτωση ιστορικού
    const { data: history } = await supabase
      .from('history_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    if (history) setLogs(history)

    // 3. Φόρτωση επισκέψεων
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
    if (!confirm(lang === 'EL' ? "Διαγραφή ιστορικού;" : "Clear history?")) return;
    setLoading(true)
    await supabase.from('history_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setLogs([])
    setLoading(false)
  }

  if (!mounted) return null

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] flex items-center justify-center p-6 font-sans">
        <form onSubmit={handleLogin} className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 w-full max-w-sm text-center shadow-2xl backdrop-blur-md">
          <h2 className="text-[#38BDF8] font-black mb-6 italic tracking-widest uppercase">Admin Access</h2>
          <input 
            type="password" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-white text-center text-3xl mb-6 outline-none focus:border-[#38BDF8]"
            placeholder="****"
            autoFocus
          />
          <button className="w-full bg-[#38BDF8] text-[#12133c] p-5 rounded-2xl font-black uppercase">Unlock</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white p-6 font-sans relative">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 flex gap-2">
        {['EL', 'EN'].map(l => (
          <button key={l} onClick={() => setLang(l as 'EL' | 'EN')} className={`px-4 py-2 rounded-xl font-bold transition-all ${lang === l ? 'bg-[#38BDF8] text-[#12133c]' : 'bg-white/10'}`}>{l}</button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 pt-16">
        <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl h-fit">
          <div className="flex items-center gap-4 mb-8 text-[#38BDF8] font-black uppercase tracking-wider text-xs italic">
             <img src="/logo.png" alt="Logo" className="h-10" />
             <span>ADMIN PANEL</span>
          </div>
          
          <div className="mb-6 p-6 bg-black/40 rounded-2xl border border-[#38BDF8]/20 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2 italic">{lang === 'EL' ? 'ΤΡΕΧΟΝ ΠΟΣΟ' : 'CURRENT AMOUNT'}</p>
            <p className="text-5xl font-mono font-bold text-white tracking-tighter">€{current.toLocaleString(lang === 'EL' ? 'el-GR' : 'en-US')}</p>
          </div>

          {/* Visits Counter - Μόνο για εσένα */}
          <div className="mb-8 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex justify-between items-center">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{lang === 'EL' ? 'ΕΠΙΣΚΕΨΕΙΣ SITE' : 'SITE VISITS'}</span>
            <span className="text-2xl font-mono font-bold text-white tracking-widest">{visits}</span>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl text-[#38BDF8] font-bold">€</span>
              <input 
                type="text" 
                value={val} 
                onChange={(e) => setVal(formatInput(e.target.value))}
                className="w-full p-6 pl-12 bg-black/40 border border-white/10 rounded-2xl text-white text-2xl font-mono outline-none focus:border-[#38BDF8] text-center" 
                placeholder="0" 
              />
            </div>
            <button disabled={loading} className="w-full bg-[#38BDF8] text-[#12133c] p-6 rounded-2xl font-black text-xl shadow-xl uppercase transition-all">
              {loading ? '...' : (lang === 'EL' ? 'ΕΝΗΜΕΡΩΣΗ' : 'UPDATE')}
            </button>
          </form>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl flex flex-col max-h-[650px]">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="text-yellow-500 font-black italic uppercase tracking-widest text-xs">{lang === 'EL' ? 'ΙΣΤΟΡΙΚΟ' : 'HISTORY LOGS'}</h2>
            <button onClick={clearHistory} className="text-[10px] font-bold text-red-400 uppercase underline">{lang === 'EL' ? 'ΚΑΘΑΡΙΣΜΟΣ' : 'CLEAR'}</button>
          </div>
          <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="p-4 bg-black/30 rounded-2xl border border-white/5 flex flex-col gap-2">
                <div className="text-[11px] text-slate-500 font-bold">{new Date(log.created_at).toLocaleString(lang === 'EL' ? 'el-GR' : 'en-US')}</div>
                <div className="flex items-center justify-between px-2 text-xl font-mono font-bold">
                  <span className="text-slate-500 line-through opacity-50">€{log.old_amount.toLocaleString(lang === 'EL' ? 'el-GR' : 'en-US')}</span>
                  <span className="text-[#38BDF8]">→</span>
                  <span className="text-white">€{log.new_amount.toLocaleString(lang === 'EL' ? 'el-GR' : 'en-US')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}