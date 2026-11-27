import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/i18n'
import { getCart, clearCart, cartTotal } from '../lib/cart'
import { PAYMENT_METHODS, getPaymentInstructions } from '../lib/payments'
import { createNotification } from '../lib/notify'

export default function Checkout() {
  const { user } = useAuth()
  const { lang, t } = useLang()
  const navigate = useNavigate()
  const [items] = useState(() => getCart())
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [method, setMethod] = useState('jazzcash')
  const [txnId, setTxnId] = useState('')
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)
  const [busy, setBusy] = useState(false)

  const total = cartTotal(items)
  const methodObj = PAYMENT_METHODS.find(m => m.id === method) || PAYMENT_METHODS[0]

  async function placeOrder(e) {
    e.preventDefault()
    setMsg(''); setIsErr(false)
    if (!user) { setMsg(t('shop.loginFirst')); setIsErr(true); return }
    if (!items.length) { setMsg(t('shop.cartEmptyErr')); setIsErr(true); return }
    if (!name.trim() || !phone.trim()) { setMsg(lang === 'en' ? 'Please enter your name and phone.' : 'Apna naam aur phone likhein.'); setIsErr(true); return }
    if (methodObj.requiresTxnId && !txnId.trim()) { setMsg(t('shop.txnErr')); setIsErr(true); return }
    setBusy(true)

    const { data: order, error } = await supabase.from('orders').insert({
      patient_id: user.id, total, status: 'pending_payment',
    }).select().single()
    if (error) { setMsg(error.message); setIsErr(true); setBusy(false); return }

    await supabase.from('order_items').insert(
      items.map(i => ({ order_id: order.id, product_id: i.id, quantity: i.qty, price: i.price }))
    )
    await supabase.from('payments').insert({
      order_id: order.id, method, transaction_id: txnId.trim() || null, amount: total, status: 'pending',
    })
    // Invoice for this order. Best-effort: if the invoices table is missing
    // the order itself is already saved, so a failure here must not block it.
    try {
      await supabase.from('invoices').insert({
        order_id: order.id, invoice_number: 'INV-' + order.id.slice(0, 8), total, status: 'unpaid',
      })
    } catch { /* invoices table may not exist yet — ignore */ }

    await createNotification(user.id, lang === 'en' ? 'Order placed' : 'Order mil gaya',
      (lang === 'en' ? 'Your order of Rs. ' : 'Aap ka Rs. ') + total + (lang === 'en' ? ' is pending payment.' : ' ka order pending payment hai.'), 'order')

    clearCart()
    navigate('/order/' + order.id)
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900">{lang === 'en' ? 'Checkout' : 'Checkout'}</h1>
        <p className="msg-err mt-5">{t('shop.loginFirst')} — <Link to="/login" className="font-semibold underline">{t('nav.login')}</Link></p>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900">{lang === 'en' ? 'Checkout' : 'Checkout'}</h1>
        <p className="card mt-6 text-sm text-slate-500">{t('shop.cartEmpty')} <Link to="/shop" className="font-semibold text-teal-700 underline">{t('acc.shopNow')}</Link></p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{lang === 'en' ? 'Checkout' : 'Checkout'}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('shop.manualPay')} — {t('shop.payNote')}</p>

      <div className="card mt-6">
        <h2 className="font-bold text-slate-900">{t('shop.cart')} — {t('shop.total')} {total}</h2>
        <div className="mt-3 space-y-2">
          {items.map(i => (
            <div key={i.id} className="flex justify-between gap-2 text-sm">
              <span className="text-slate-700">{i.name} × {i.qty}</span>
              <span className="font-semibold">Rs. {Number(i.price) * i.qty}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={placeOrder} className="card mt-5 space-y-4">
        <div>
          <label className="label">{lang === 'en' ? 'Full name' : 'Poora naam'}</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">{lang === 'en' ? 'Phone' : 'Phone'}</label>
          <input className="input" placeholder="03XX-XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>
        <div>
          <label className="label">{lang === 'en' ? 'Delivery address' : 'Delivery address'}</label>
          <input className="input" value={address} onChange={e => setAddress(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('shop.method')}</label>
          <select className="input" value={method} onChange={e => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{getPaymentInstructions(method)}</p>
        </div>
        {methodObj.requiresTxnId && (
          <div>
            <label className="label">{t('shop.txn')}</label>
            <input className="input" value={txnId} onChange={e => setTxnId(e.target.value)} required />
          </div>
        )}
        <button type="submit" className="btn-primary w-full !py-3" disabled={busy}>
          {t('shop.placeOrder')} — Rs. {total}
        </button>
      </form>
      {msg && <p className={`mt-5 ${isErr ? 'msg-err' : 'msg-ok'}`}>{msg}</p>}
    </div>
  )
}
