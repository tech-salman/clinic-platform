import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Book() {
  const { user } = useAuth()
  const [branches, setBranches] = useState([])
  const [doctors, setDoctors] = useState([])
  const [slots, setSlots] = useState([])
  const [branchId, setBranchId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('2026-11-27')
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)

  useEffect(() => {
    supabase.from('branches').select('*').then(({ data }) => setBranches(data || []))
    supabase.from('doctors').select('*').then(({ data }) => setDoctors(data || []))
  }, [])

  async function loadSlots() {
    setMsg(''); setIsErr(false)
    if (!doctorId || !date) { setMsg('Pehle doctor aur date chuno'); setIsErr(true); return }
    const { data, error } = await supabase.from('slots').select('*')
      .eq('doctor_id', doctorId).eq('slot_date', date).eq('is_booked', false)
      .order('start_time')
    if (error) { setMsg(error.message); setIsErr(true); return }
    setSlots(data || [])
    if (!data?.length) setMsg('Is din koi free slot nahi')
  }

  async function bookSlot(slot) {
    if (!user) { setMsg('Pehle /login se login karo'); setIsErr(true); return }
    const { data: appt, error } = await supabase.from('appointments').insert({
      patient_id: user.id, doctor_id: doctorId, branch_id: branchId || null,
      slot_id: slot.id, type: 'physical', appointment_date: date, status: 'booked'
    }).select().single()
    if (error) { setMsg(error.message); setIsErr(true); return }
    await supabase.from('slots').update({ is_booked: true }).eq('id', slot.id)
    setMsg('Booked! Appointment ID: ' + appt.id)
    loadSlots()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Book Appointment</h1>
      <p className="mt-1 text-sm text-slate-500">Branch, doctor aur date chuno — sirf khaali slot dikhenge.</p>

      {!user && (
        <p className="msg-err mt-5">Pehle login karo — <a href="/login" className="font-semibold underline">Login</a></p>
      )}

      <div className="card mt-6 space-y-4">
        <div>
          <label className="label">1. Branch</label>
          <select className="input" value={branchId} onChange={e => setBranchId(e.target.value)}>
            <option value="">Branch chuno</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">2. Doctor</label>
          <select className="input" value={doctorId} onChange={e => setDoctorId(e.target.value)}>
            <option value="">Doctor chuno</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.specialties || 'Doctor'} — {d.id.slice(0, 8)}</option>)}
          </select>
          <p className="mt-1 text-xs text-slate-400">Doctor ka naam Day 3 mein profiles se join karke dikhana hai — abhi specialty + ID dikh raha hai.</p>
        </div>
        <div>
          <label className="label">3. Date</label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          <p className="mt-1 text-xs text-slate-400">Test data 27 Nov 2026 ki hai — wahi date use karo.</p>
        </div>
        <button onClick={loadSlots} className="btn-primary w-full !py-3">Free Slots Dekho</button>
      </div>

      {slots.length > 0 && (
        <div className="card mt-5">
          <h2 className="font-bold text-slate-900">Free slots — {date}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {slots.map(s => (
              <div key={s.id} className="rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-lg font-bold text-slate-900">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</p>
                <span className="badge-green mt-2">Available</span>
                <button onClick={() => bookSlot(s)} className="btn-primary mt-3 w-full !py-2">Book</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {msg && <p className={`mt-5 ${isErr ? 'msg-err' : 'msg-ok'}`}>{msg}</p>}
    </div>
  )
}