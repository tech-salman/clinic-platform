import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/i18n'

export default function Account() {
  const { user } = useAuth()
  const { lang, t } = useLang()
  const [appts, setAppts] = useState([])
  const [orders, setOrders] = useState([])
  const [records, setRecords] = useState([])
  const [invoices, setInvoices] = useState([])
  const [notifications, setNotifications] = useState([])
  const [msg, setMsg] = useState('')

  async function load() {
    if (!user) return
    try {
      const { data, error } = await supabase.from('appointments').select('*').eq('patient_id', user.id).order('appointment_date')
      if (error) setMsg(error.message)
      else setAppts(data || [])
    } catch { /* ignore */ }
    try {
      const { data } = await supabase.from('orders').select('*').eq('patient_id', user.id).order('created_at', { ascending: false })
      setOrders(data || [])
      // Invoices for my orders (client-side filter by order ids).
      if (data && data.length) {
        const { data: inv } = await supabase.from('invoices').select('*').in('order_id', data.map(o => o.id)).order('created_at', { ascending: false })
        setInvoices(inv || [])
      } else setInvoices([])
    } catch { /* ignore */ }
    try {
      const { data } = await supabase.from('patient_records').select('*').eq('patient_id', user.id).order('created_at', { ascending: false })
      setRecords(data || [])
    } catch { /* ignore */ }
    try {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setNotifications(data || [])
    } catch { /* ignore */ }
  }
  useEffect(() => { load() }, [user])

  async function markRead(n) {
    if (n.is_read) return
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    setNotifications(notifications.map(x => (x.id === n.id ? { ...x, is_read: true } : x)))
  }

  async function cancelAppt(a) {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', a.id)
    if (a.slot_id) await supabase.from('slots').update({ is_booked: false }).eq('id', a.slot_id)
    setMsg(t('acc.cancelledMsg'))
    load()
  }

  if (!user) return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">{t('acc.title')}</h1>
      <p className="msg-err mt-5">{t('acc.loginFirst')} — <a href="/login" className="font-semibold underline">{t('nav.login')}</a></p>
    </div>
  )

  const booked = appts.filter(a => a.status === 'booked').length

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t('acc.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{user.email}</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="card !p-4"><p className="text-2xl font-bold text-teal-700">{booked}</p><p className="text-sm text-slate-500">{t('acc.upcoming')}</p></div>
        <div className="card !p-4"><p className="text-2xl font-bold text-slate-900">{appts.length}</p><p className="text-sm text-slate-500">{t('acc.totalAppts')}</p></div>
        <div className="card !p-4"><p className="text-2xl font-bold text-slate-900">{orders.length}</p><p className="text-sm text-slate-500">{t('acc.orders')}</p></div>
      </div>

      <h2 className="mt-8 font-bold text-slate-900">{t('acc.myAppts')}</h2>
      {appts.length === 0 && <p className="card mt-3 text-sm text-slate-500">{t('acc.noAppts')} <a href="/book" className="font-semibold text-teal-700 underline">{t('acc.bookNow')}</a></p>}
      <div className="mt-3 space-y-3">
        {appts.map(a => (
          <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3 !py-4">
            <div>
              <p className="font-semibold text-slate-900">📅 {a.appointment_date} <span className="text-slate-400">·</span> {a.type === 'online' ? t('acc.online') : t('acc.clinicVisit')}</p>
              <p className="mt-1 text-xs text-slate-400">ID: {a.id.slice(0, 8)}…</p>
            </div>
            <div className="flex items-center gap-2">
              {a.status === 'booked' && <span className="badge-green">Booked</span>}
              {a.status === 'cancelled' && <span className="badge-slate">Cancelled</span>}
              {a.status === 'completed' && <span className="badge-green">Completed</span>}
              {a.status === 'booked' && a.type === 'online' && a.meeting_link && (
                <a href={a.meeting_link} target="_blank" rel="noreferrer" className="btn-primary !px-3 !py-1.5 !text-xs">Join</a>
              )}
              {a.status === 'booked' && <button onClick={() => cancelAppt(a)} className="btn-danger">{t('common.cancel')}</button>}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-bold text-slate-900">{t('acc.myOrders')}</h2>
      {orders.length === 0 && <p className="card mt-3 text-sm text-slate-500">{t('acc.noOrders')} <a href="/shop" className="font-semibold text-teal-700 underline">{t('acc.shopNow')}</a></p>}
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

      <h2 className="mt-8 font-bold text-slate-900">{lang === 'en' ? 'Prescriptions & Reports' : 'Prescriptions aur Reports'}</h2>
      {records.length === 0 && <p className="card mt-3 text-sm text-slate-500">{lang === 'en' ? 'No prescriptions or reports yet.' : 'Abhi koi prescription ya report nahi hai.'}</p>}
      <div className="mt-3 space-y-3">
        {records.map(r => (
          <div key={r.id} className="card !py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">{r.title}</p>
              <span className={r.type === 'prescription' ? 'badge-green' : 'badge-amber'}>{r.type}</span>
            </div>
            {r.content && <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.content}</p>}
            <p className="mt-2 text-xs text-slate-400">{(r.created_at || '').slice(0, 10)}</p>
            {r.file_url && <a href={r.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-teal-700 hover:underline">{lang === 'en' ? 'Download file' : 'File download karein'}</a>}
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-bold text-slate-900">{lang === 'en' ? 'My Invoices' : 'Mere Invoices'}</h2>
      {invoices.length === 0 && <p className="card mt-3 text-sm text-slate-500">{lang === 'en' ? 'No invoices yet.' : 'Abhi koi invoice nahi hai.'}</p>}
      <div className="mt-3 space-y-3">
        {invoices.map(inv => (
          <div key={inv.id} className="card flex flex-wrap items-center justify-between gap-3 !py-4">
            <div>
              <p className="font-semibold text-slate-900">{inv.invoice_number}</p>
              <p className="mt-1 text-xs text-slate-400">Rs. {inv.total} · {(inv.created_at || '').slice(0, 10)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={inv.status === 'paid' ? 'badge-green' : 'badge-amber'}>{inv.status}</span>
              <a href={`/order/${inv.order_id}`} className="btn-outline !px-3 !py-1.5 !text-xs">{lang === 'en' ? 'Track Order' : 'Order Track Karein'}</a>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-bold text-slate-900">{lang === 'en' ? 'My Notifications' : 'Meri Notifications'}</h2>
      {notifications.length === 0 && <p className="card mt-3 text-sm text-slate-500">{lang === 'en' ? 'No notifications yet.' : 'Abhi koi notification nahi hai.'}</p>}
      <div className="mt-3 space-y-3">
        {notifications.map(n => (
          <div key={n.id} onClick={() => markRead(n)} className="card cursor-pointer !py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`text-sm ${n.is_read ? 'text-slate-600' : 'font-bold text-slate-900'}`}>{n.title}</p>
              {!n.is_read && <span className="badge-green">New</span>}
            </div>
            {n.message && <p className="mt-1 text-sm text-slate-500">{n.message}</p>}
            <p className="mt-1 text-xs text-slate-400">{(n.created_at || '').slice(0, 10)}</p>
          </div>
        ))}
      </div>

      {msg && <p className="msg-ok mt-5">{msg}</p>}
    </div>
  )
}
