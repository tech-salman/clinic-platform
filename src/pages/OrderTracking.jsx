import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n'

const STEPS = ['pending_payment', 'paid', 'packed', 'shipped', 'delivered']
const STEP_LABEL = {
  pending_payment: { ru: 'Pending payment', en: 'Pending payment' },
  paid: { ru: 'Paid', en: 'Paid' },
  packed: { ru: 'Packed', en: 'Packed' },
  shipped: { ru: 'Shipped', en: 'Shipped' },
  delivered: { ru: 'Delivered', en: 'Delivered' },
  cancelled: { ru: 'Cancelled', en: 'Cancelled' },
}

export default function OrderTracking() {
  const { id } = useParams()
  const { lang } = useLang()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [payments, setPayments] = useState([])
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: o } = await supabase.from('orders').select('*').eq('id', id).single()
      setOrder(o || null)
      if (o) {
        const [it, pay, inv] = await Promise.all([
          supabase.from('order_items').select('*').eq('order_id', id),
          supabase.from('payments').select('*').eq('order_id', id),
          supabase.from('invoices').select('*').eq('order_id', id).single(),
        ])
        setItems(it.data || [])
        setPayments(pay.data || [])
        setInvoice(inv.data || null)
      }
      setLoading(false)
    })()
  }, [id])

  if (loading) return <p className="card text-sm text-slate-500">Loading...</p>
  if (!order) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center">
          <h1 className="text-xl font-bold text-slate-900">{lang === 'en' ? 'Order not found' : 'Order nahi mila'}</h1>
          <Link to="/shop" className="btn-outline mt-5">← Shop</Link>
        </div>
      </div>
    )
  }

  const status = order.status
  const cancelled = status === 'cancelled'
  const currentIdx = cancelled ? -1 : STEPS.indexOf(status)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{lang === 'en' ? 'Track Order' : 'Order Track Karein'}</h1>
      <p className="mt-1 text-sm text-slate-500">ID: {order.id.slice(0, 8)}… · {lang === 'en' ? 'Total' : 'Total'} Rs. {order.total}</p>

      <div className="card mt-6">
        <h2 className="font-bold text-slate-900">{lang === 'en' ? 'Order status' : 'Order status'}</h2>
        {cancelled ? (
          <p className="mt-3"><span className="badge-slate">Cancelled</span></p>
        ) : (
          <ol className="mt-4 space-y-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i <= currentIdx ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {i + 1}
                </span>
                <span className={i <= currentIdx ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                  {STEP_LABEL[s][lang] || STEP_LABEL[s].en}
                </span>
                {i === currentIdx && <span className="badge-green">{lang === 'en' ? 'Current' : 'Maujooda'}</span>}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="card mt-5">
        <h2 className="font-bold text-slate-900">{lang === 'en' ? 'Items' : 'Cheezein'}</h2>
        {items.length === 0 && <p className="mt-3 text-sm text-slate-500">—</p>}
        <div className="mt-3 space-y-2">
          {items.map(i => (
            <div key={i.id} className="flex justify-between gap-2 text-sm">
              <span className="text-slate-700">× {i.quantity}</span>
              <span className="font-semibold">Rs. {Number(i.price || 0) * Number(i.quantity || 0)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
          {lang === 'en' ? 'Payment' : 'Payment'}: {payments[0]?.method || '—'} · {payments[0]?.status || order.status} {payments[0]?.transaction_id ? `· ${payments[0].transaction_id}` : ''}
        </p>
      </div>

      <div className="card mt-5">
        <h2 className="font-bold text-slate-900">{lang === 'en' ? 'Invoice' : 'Invoice'}</h2>
        {invoice ? (
          <div className="mt-3 text-sm text-slate-700">
            <p>{lang === 'en' ? 'Invoice no.' : 'Invoice no.'} <b>{invoice.invoice_number}</b></p>
            <p className="mt-1">{lang === 'en' ? 'Total' : 'Total'}: <b>Rs. {invoice.total}</b></p>
            <p className="mt-1">{lang === 'en' ? 'Status' : 'Status'}: <b>{invoice.status}</b></p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{lang === 'en' ? 'Invoice not issued yet.' : 'Invoice abhi nahi bana.'}</p>
        )}
        <button onClick={() => window.print()} className="btn-outline mt-4">
          {lang === 'en' ? 'Print invoice' : 'Invoice print karein'}
        </button>
      </div>
    </div>
  )
}
