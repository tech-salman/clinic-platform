import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Admin() {
  const { role, loading } = useAuth()
  const [appts, setAppts] = useState([])
  const [orders, setOrders] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (role !== 'admin') return
    supabase.from('appointments').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setAppts(data || []))
    supabase.from('orders').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []))
  }, [role])

  async function markPaid(orderId) {
    // 1. Is order ki items lao
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId)

    // 2. Har product ka stock kam karo
    for (const it of items || []) {
      const { data: prod } = await supabase.from('products').select('stock').eq('id', it.product_id).single()
      if (prod) {
        const newStock = Math.max(0, (prod.stock || 0) - (it.quantity || 1))
        await supabase.from('products').update({ stock: newStock }).eq('id', it.product_id)
      }
    }

    // 3. Phir order aur payment Paid karo
    await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId)
    await supabase.from('payments').update({ status: 'verified' }).eq('order_id', orderId)
    setMsg('Order paid mark ho gaya, stock kam ho gaya')
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'paid' } : o))
  }

  if (loading) {
    return <p className="card text-sm text-slate-500">Loading...</p>
  }

  if (role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center">
          <h1 className="text-xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-2 text-sm text-slate-500">Ye page sirf admin ke liye hai. Patient account se Admin nahi khul sakta.</p>
        </div>
      </div>
    )
  }

  const pendingOrders = orders.filter(o => o.status === 'pending_payment').length

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Appointments aur orders — payment verify yahin se hoti hai.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card !p-4"><p className="text-2xl font-bold text-slate-900">{appts.length}</p><p className="text-sm text-slate-500">Appointments</p></div>
        <div className="card !p-4"><p className="text-2xl font-bold text-slate-900">{orders.length}</p><p className="text-sm text-slate-500">Orders</p></div>
        <div className="card !p-4"><p className="text-2xl font-bold text-amber-600">{pendingOrders}</p><p className="text-sm text-slate-500">Pending payments</p></div>
      </div>

      <h2 className="mt-8 font-bold text-slate-900">Appointments ({appts.length})</h2>
      <div className="card mt-3 !p-0 overflow-hidden">
        {appts.length === 0 && <p className="p-5 text-sm text-slate-500">Koi appointment nahi.</p>}
        {appts.map(a => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <span className="text-slate-700">📅 {a.appointment_date} <span className="text-slate-400">·</span> {a.type}</span>
            {a.status === 'booked' && <span className="badge-green">Booked</span>}
            {a.status === 'cancelled' && <span className="badge-slate">Cancelled</span>}
            {a.status === 'completed' && <span className="badge-green">Completed</span>}
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-bold text-slate-900">Orders ({orders.length})</h2>
      <div className="card mt-3 !p-0 overflow-hidden">
        {orders.length === 0 && <p className="p-5 text-sm text-slate-500">Koi order nahi.</p>}
        {orders.map(o => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <span className="text-slate-700">Rs. {o.total} <span className="text-slate-400">·</span> {o.id.slice(0, 8)}…</span>
            <span className="flex items-center gap-2">
              {o.status === 'paid' ? <span className="badge-green">Paid</span>
                : o.status === 'pending_payment' ? <span className="badge-amber">Pending payment</span>
                : <span className="badge-slate">{o.status}</span>}
              {o.status === 'pending_payment' && <button onClick={() => markPaid(o.id)} className="btn-primary !px-3 !py-1.5 !text-xs">Verify Payment</button>}
            </span>
          </div>
        ))}
      </div>
      {msg && <p className="msg-ok mt-5">{msg}</p>}
    </div>
  )
}