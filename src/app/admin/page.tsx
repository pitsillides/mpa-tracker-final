'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface Log {
  id: string;
  created_at: string;
  old_amount: number;
  new_amount: number;
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false) // Έλεγχος κωδικού
  const [pin, setPin] = useState('')
  const [current, setCurrent] = useState<number>(0)
  const [val, setVal] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [lang, setLang] = useState<'EL' | 'EN'>('EL')

  // --- ΟΡΙΣΕ ΤΟΝ ΚΩΔΙΚΟ ΣΟΥ ΕΔΩ ---
  const SECRET_PIN = "2486" 

  useEffect(() => {
    setMounted(true)
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    const { data: progress } = await supabase.from('progress_data').select('*').single()
    if (progress) setCurrent(progress.current_amount)

    const { data: history } = await supabase
      .from('history_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    if (history) setLogs(history)
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
    const numberValue = parseInt(digits)
    return numberValue.toLocaleString(lang === 'EL' ? 'el-GR' : 'en-US')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVal(formatInput(e.target.value))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanNum = parseInt(val.replace(/\./g, '').replace(/,/g, ''))
    if (isNaN(cleanNum)) return alert(lang === 'EL' ? "Βάλε έγκυρο αριθμό" : "Enter a valid number")
    
    setLoading(true)
    const { error: updateError } = await supabase.from('progress_data').update({ current_amount: cleanNum }).eq('id', 1)
    if (!updateError) {
      await supabase.from('history_logs').insert([{ old_amount: current, new_amount: cleanNum }])
      setCurrent(cleanNum)
      setVal('')
      fetchInitialData()
    }
    setLoading(false)
  }

  if (!mounted) return <div className="min-h-screen bg-[#0a0b1e]"></div>

  // --- ΟΘΟΝΗ LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 w-full max-w-sm text-center">
          <h2 className="text-[#38BDF8] font-black mb-6 italic tracking-widest">ENTER ADMIN PIN</h2>
          <input 
            type="password" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-center text-2xl mb-4 outline-none focus:border-[#38BDF8]"
            placeholder="****"
          />
          <button className="w-full bg-[#38BDF8] text-[#12133c] p-4 rounded-xl font-bold uppercase">Unlock</button>
        </form>
      </div>
    )
  }

  // --- ΚΑΝΟΝΙΚΟ ADMIN PANEL (ΕΜΦΑΝΙΖΕΤΑΙ ΜΟΝΟ ΜΕΤΑ ΤΟ LOGIN) ---
  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white p-6 font-sans relative">
        {/* ... (εδώ μπαίνει ο υπόλοιπος κώδικας του Admin που είχαμε φτιάξει) ... */}
        <div className="absolute top-6 right-6 flex gap-2">
            {['EL', 'EN'].map(l => (
                <button key={l} onClick={() => setLang(l as 'EL' | 'EN')} className={`px-4 py-2 rounded-xl font-bold transition-all ${lang === l ? 'bg-[#38BDF8] text-[#12133c]' : 'bg-white/10'}`}>{l}</button>
            ))}
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 pt-16">
            <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl h-fit">
                <div className="flex items-center gap-4 mb-8">
                    <img src="/logo.png" alt="Logo" className="h-12 w-auto opacity-80" />
                    <h2 className="text-[#38BDF8] font-black italic uppercase tracking-wider">{t[lang].panelTitle}</h2>
                </div>
                
                <div className="mb-8 p-6 bg-black/40 rounded-2xl border border-[#38BDF8]/20 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-2 italic">{t[lang].currentAmount}</p>
                    <p className="text-5xl font-mono font-bold text-white tracking-tighter italic">€{current.toLocaleString(lang === 'EL' ? 'el-GR' : 'en-US')}</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl text-[#38BDF8] font-bold">€</span>
                        <input 
                            type="text" 
                            value={val} 
                            onChange={handleInputChange}
                            className="w-full p-6 pl-12 bg-black/40 border border-white/10 rounded-2xl text-white text-2xl font-mono outline-none focus:border-[#38BDF8] text-center" 
                            placeholder="0" 
                        />
                    </div>
                    <button disabled={loading} className="w-full bg-[#38BDF8] text-[#12133c] p-6 rounded-2xl font-black text-xl shadow-xl uppercase transition-all active:scale-95">
                        {loading ? '...' : t[lang].updateBtn}
                    </button>
                </form>
            </div>
            
            {/* Logs Section */}
            <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl flex flex-col max-h-[650px]">
                <h2 className="text-yellow-500 font-black italic uppercase tracking-widest mb-6 border-b border-white/10 pb-4">{t[lang].historyTitle}</h2>
                <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {logs.map((log) => (
                        <div key={log.id} className="p-4 bg-black/30 rounded-2xl border border-white/5 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
                                <span>{new Date(log.created_at).toLocaleString(lang === 'EL' ? 'el-GR' : 'en-US')}</span>
                            </div>
                            <div className="flex items-center justify-between px-2">
                                <span className="text-slate-500 font-mono text-lg line-through opacity-50">€{log.old_amount.toLocaleString(lang === 'EL' ? 'el-GR' : 'en-US')}</span>
                                <span className="text-[#38BDF8] text-xl">→</span>
                                <span className="text-white font-mono font-bold text-xl">€{log.new_amount.toLocaleString(lang === 'EL' ? 'el-GR' : 'en-US')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  )
}

const t = {
  EL: { panelTitle: 'ΠΑΝΕΛ ΔΙΑΧΕΙΡΙΣΗΣ', currentAmount: 'CURRENT AMOUNT', updateBtn: 'ΕΝΗΜΕΡΩΣΗ', historyTitle: 'HISTORY LOGS' },
  EN: { panelTitle: 'ADMIN PANEL', currentAmount: 'CURRENT AMOUNT', updateBtn: 'UPDATE TRACKER', historyTitle: 'HISTORY LOGS' }
}