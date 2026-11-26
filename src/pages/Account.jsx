import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Account() {
  const { user } = useAuth()
  const [appts, setAppts] = useState([])
  const [orders, setOrders] = useState([])
  const [msg, setMsg] = useState('')

  function load() {
    if (!user) return
    supabase.from('appointments').select('*').eq('patient_id', user.id)
      .order('appointment_date').then(({ data, error }) => {
        if (error) setMsg(error.message)
        else setAppts(data || [])
      })
    supabase.from('orders').select('*').eq('patient_id', user.id)
      .order('created_at', { ascending: false }).then(({ data, error }) => {
        if (error) setMsg(error.message)
        else setOrders(data || [])
      })
  }
  useEffect(load, [user])

  async function cancelAppt(a) {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', a.id)
    if (a.slot_id) await supabase.from('slots').update({ is_booked: false }).eq('id', a.slot_id)
    setMsg('Appointment cancel ho gaya, slot dobara free hai')
    load()
  }

  if (!user) return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
      <p className="msg-err mt-5">Pehle login karo — <a href="/login" className="font-semibold underline">Login</a></p>
    </div>
  )

  const booked = appts.filter(a => a.status === 'booked').length

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">My Account</h1>
      <p className="mt-1 text-sm text-slate-500">{user.email}</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="card !p-4"><p className="text-2xl font-bold text-teal-700">{booked}</p><p className="text-sm text-slate-500">Upcoming appointments</p></div>
        <div className="card !p-4"><p className="text-2xl font-bold text-slate-900">{appts.length}</p><p className="text-sm text-slate-500">Total appointments</p></div>
        <div className="card !p-4"><p className="text-2xl font-bold text-slate-900">{orders.length}</p><p className="text-sm text-slate-500">My orders</p></div>
      </div>

      <h2 className="mt-8 font-bold text-slate-900">Meri appointments</h2>
      {appts.length === 0 && <p className="card mt-3 text-sm text-slate-500">Koi appointment nahi — <a href="/book" className="font-semibold text-teal-700 underline">Book karo →</a></p>}
      <div className="mt-3 space-y-3">
        {appts.map(a => (
          <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3 !py-4">
            <div>
              <p className="font-semibold text-slate-900">📅 {a.appointment_date} <span className="text-slate-400">·</span> {a.type === 'online' ? 'Online' : 'Clinic visit'}</p>
              <p className="mt-1 text-xs text-slate-400">ID: {a.id.slice(0, 8)}…</p>
            </div>
            <div className="flex items-center gap-2">
              {a.status === 'booked' && <span className="badge-green">Booked</span>}
              {a.status === 'cancelled' && <span className="badge-slate">Cancelled</span>}
              {a.status === 'completed' && <span className="badge-green">Completed</span>}
              {a.status === 'booked' && <button onClick={() => cancelAppt(a)} className="btn-danger">Cancel</button>}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-bold text-slate-900">Mere orders</h2>
      {orders.length === 0 && <p className="card mt-3 text-sm text-slate-500">Koi order nahi — <a href="/shop" className="font-semibold text-teal-700 underline">Shop karo →</a></p>}
      <div className="mt-3 space-y-3">
        {orders.map(o => (
          <div key={o.id} className="card flex flex-wrap items-center justify-between gap-3 !py-4">
            <div>
              <p className="font-semibold text-slate-900">Rs. {o.total}</p>
              <p className="mt-1 text-xs text-slate-400">ID: {o.id.slice(0, 8)}…</p>
            </div>
            <div>
              {o.status === 'paid' ? <span className="badge-green">Paid</span>
                : o.status === 'pending_payment' ? <span className="badge-amber">Pending payment</span>
                : <span className="badge-slate">{o.status}</span>}
            </div>
          </div>
        ))}
      </div>

      {msg && <p className="msg-ok mt-5">{msg}</p>}
    </div>
  )
}