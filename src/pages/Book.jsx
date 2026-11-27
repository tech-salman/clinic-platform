import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/i18n'

export default function Book() {
  const { user } = useAuth()
  const { t } = useLang()
  const [searchParams] = useSearchParams()
  const [branches, setBranches] = useState([])
  const [doctors, setDoctors] = useState([])
  const [slots, setSlots] = useState([])
  const [branchId, setBranchId] = useState('')
  const [doctorId, setDoctorId] = useState(searchParams.get('doctor') || '')
  const [date, setDate] = useState('2026-11-27')
  const [apptType, setApptType] = useState('physical')
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: br } = await supabase.from('branches').select('*')
      setBranches(br || [])
      const { data: dr } = await supabase.from('doctors').select('*')
      setDoctors(dr || [])
      const preDoctor = searchParams.get('doctor')
      if (preDoctor) {
        const { data: sl } = await supabase.from('slots').select('branch_id').eq('doctor_id', preDoctor).limit(1)
        if (sl?.[0]?.branch_id) setBranchId(sl[0].branch_id)
        else if (br?.[0]?.id) setBranchId(br[0].id)
      }
    })()
  }, [])

  async function loadSlots() {
    setMsg(''); setIsErr(false)
    if (!doctorId || !date) { setMsg(t('book.pickFirst')); setIsErr(true); return }
    const { data, error } = await supabase.from('slots').select('*')
      .eq('doctor_id', doctorId).eq('slot_date', date).eq('is_booked', false)
      .order('start_time')
    if (error) { setMsg(error.message); setIsErr(true); return }
    setSlots(data || [])
    if (!data?.length) setMsg(t('book.noSlot'))
  }

  async function bookSlot(slot) {
    if (!user) { setMsg(t('book.loginFirst')); setIsErr(true); return }
    const { data: appt, error } = await supabase.from('appointments').insert({
      patient_id: user.id, doctor_id: doctorId, branch_id: branchId || null,
      slot_id: slot.id, type: apptType, appointment_date: date, status: 'booked'
    }).select().single()
    if (error) { setMsg(error.message); setIsErr(true); return }
    await supabase.from('slots').update({ is_booked: true }).eq('id', slot.id)
    await loadSlots()
    setMsg(t('book.booked') + ' ' + appt.id)
    setIsErr(false)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t('book.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('book.sub')}</p>

      {!user && (
        <p className="msg-err mt-5">{t('book.loginFirst')} — <a href="/login" className="font-semibold underline">{t('nav.login')}</a></p>
      )}

      <div className="card mt-6 space-y-4">
        <div>
          <label className="label">1. {t('book.branch')}</label>
          <select className="input" value={branchId} onChange={e => setBranchId(e.target.value)}>
            <option value="">{t('book.chooseBranch')}</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">2. {t('book.doctor')}</label>
          <select className="input" value={doctorId} onChange={e => setDoctorId(e.target.value)}>
            <option value="">{t('book.chooseDoctor')}</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name || 'Doctor'} — {d.specialties || 'General'}</option>)}
          </select>
        </div>
        <div>
          <label className="label">3. {t('book.date')}</label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          <p className="mt-1 text-xs text-slate-400">{t('book.chooseDate')}</p>
        </div>
        <div>
          <label className="label">4. {t('book.type') || 'Type'}</label>
          <select className="input" value={apptType} onChange={e => setApptType(e.target.value)}>
            <option value="physical">{t('acc.clinicVisit')}</option>
            <option value="online">{t('acc.online')}</option>
          </select>
          {apptType === 'online' && (
            <p className="mt-1 text-xs text-slate-400">Meeting link appointment ke baad My Account me milega.</p>
          )}
        </div>
        <button onClick={loadSlots} className="btn-primary w-full !py-3">{t('book.freeSlots')}</button>
      </div>

      {slots.length > 0 && (
        <div className="card mt-5">
          <h2 className="font-bold text-slate-900">{t('book.freeSlotsFor')} — {date}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {slots.map(s => (
              <div key={s.id} className="rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-lg font-bold text-slate-900">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</p>
                <span className="badge-green mt-2">{t('book.available')}</span>
                <button onClick={() => bookSlot(s)} className="btn-primary mt-3 w-full !py-2">{t('book.book')}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {msg && <p className={`mt-5 ${isErr ? 'msg-err' : 'msg-ok'}`}>{msg}</p>}
    </div>
  )
}
