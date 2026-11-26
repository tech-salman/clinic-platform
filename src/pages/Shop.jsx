import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Shop() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [method, setMethod] = useState('jazzcash')
  const [txnId, setTxnId] = useState('')
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true)
      .then(({ data }) => setProducts(data || []))
  }, [])

  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0)

  function addToCart(p) {
    const found = cart.find(i => i.id === p.id)
    if (found) setCart(cart.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i))
    else setCart([...cart, { ...p, qty: 1 }])
  }

  async function checkout() {
    setMsg(''); setIsErr(false)
    if (!user) { setMsg('Pehle login karo'); setIsErr(true); return }
    if (!cart.length) { setMsg('Cart khali hai'); setIsErr(true); return }
    if (!txnId.trim()) { setMsg('Transaction ID likho (payment ke baad milta hai)'); setIsErr(true); return }
    const { data: order, error } = await supabase.from('orders').insert({
      patient_id: user.id, total, status: 'pending_payment'
    }).select().single()
    if (error) { setMsg(error.message); setIsErr(true); return }
    await supabase.from('order_items').insert(
      cart.map(i => ({ order_id: order.id, product_id: i.id, quantity: i.qty, price: i.price }))
    )
    await supabase.from('payments').insert({
      order_id: order.id, method, transaction_id: txnId, amount: total, status: 'pending'
    })
    setMsg('Order ban gaya (pending payment). Admin verify karega to status paid hoga. Order ID: ' + order.id)
    setCart([]); setTxnId('')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Pharmacy Shop</h1>
      <p className="mt-1 text-sm text-slate-500">Dawaai aur health products — manual payment: JazzCash / Easypaisa / Bank / Cash.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {products.length === 0 && (
            <p className="card text-sm text-slate-500 sm:col-span-2">Abhi koi product nahi — Day 2 SQL wale 3 test products insert karo to yahan dikhenge.</p>
          )}
          {products.map(p => (
            <div key={p.id} className="card flex flex-col">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl">💊</span>
              <h3 className="mt-3 font-bold text-slate-900">{p.name}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500">{p.description || p.category || 'Pharmacy product'}</p>
              <p className="mt-3 text-lg font-bold text-teal-700">Rs. {p.price}</p>
              <p className="text-xs text-slate-400">Stock: {p.stock}</p>
              <button onClick={() => addToCart(p)} className="btn-primary mt-4 w-full !py-2" disabled={p.stock <= 0}>
                {p.stock <= 0 ? 'Out of stock' : 'Add to Cart'}
              </button>
            </div>
          ))}
        </div>

        <div className="card h-fit lg:sticky lg:top-24">
          <h2 className="font-bold text-slate-900">Cart — Total Rs. {total}</h2>
          {cart.length === 0 && <p className="mt-3 text-sm text-slate-500">Cart khali hai.</p>}
          <div className="mt-3 space-y-2">
            {cart.map((i, idx) => (
              <div key={idx} className="flex justify-between gap-2 text-sm">
                <span className="text-slate-700">{i.name} × {i.qty}</span>
                <span className="font-semibold">Rs. {Number(i.price) * i.qty}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-900">Manual payment</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              JazzCash / Easypaisa / Bank Transfer se payment karo, phir neeche Transaction ID likho.
              Clinic ka asal JazzCash/Easypaisa number aur bank account abhi placeholder hai — client se milte hi yahan likhna hai.
              Gateway Saturday tak live nahi hoga, manual flow hi delivery hai.
            </p>
            <label className="label mt-4">Payment method</label>
            <select className="input" value={method} onChange={e => setMethod(e.target.value)}>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash (clinic par)</option>
            </select>
            <label className="label mt-3">Transaction ID</label>
            <input className="input" placeholder="e.g. TXN-TEST-001" value={txnId} onChange={e => setTxnId(e.target.value)} />
            <button onClick={checkout} className="btn-primary mt-4 w-full !py-3">Place Order — Rs. {total}</button>
          </div>
          {msg && <p className={`mt-4 ${isErr ? 'msg-err' : 'msg-ok'}`}>{msg}</p>}
        </div>
      </div>
    </div>
  )
}