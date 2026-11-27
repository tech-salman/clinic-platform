import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n'
import { addToCart, cartCount } from '../lib/cart'

export default function Shop() {
  const { lang, t } = useLang()
  const [products, setProducts] = useState([])
  const [count, setCount] = useState(0)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true)
      .then(({ data }) => setProducts(data || []))
    setCount(cartCount())
  }, [])

  function add(p) {
    addToCart(p, 1)
    setCount(cartCount())
    setMsg((p.name || '') + ' — ' + (lang === 'en' ? 'added to cart.' : 'cart mein add ho gaya.'))
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t('shop.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('shop.sub')}</p>
        </div>
        <Link to="/cart" className="btn-primary !px-4 !py-2">
          {t('shop.cart')} ({count}) →
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 && (
          <p className="card text-sm text-slate-500 sm:col-span-2 lg:col-span-3">{t('shop.noProducts')}</p>
        )}
        {products.map(p => (
          <div key={p.id} className="card flex flex-col">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl">💊</span>
            {p.slug ? (
              <Link to={`/shop/${p.slug}`} className="mt-3 font-bold text-slate-900 hover:text-teal-700 hover:underline">{p.name}</Link>
            ) : (
              <h3 className="mt-3 font-bold text-slate-900">{p.name}</h3>
            )}
            <p className="mt-1 flex-1 text-sm text-slate-500">{p.description || p.category || 'Pharmacy product'}</p>
            <p className="mt-3 text-lg font-bold text-teal-700">Rs. {p.price}</p>
            <p className="text-xs text-slate-400">{t('shop.stock')} {p.stock}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => add(p)} className="btn-primary flex-1 !py-2" disabled={p.stock <= 0}>
                {p.stock <= 0 ? t('shop.outStock') : t('shop.addCart')}
              </button>
              {p.slug && (
                <Link to={`/shop/${p.slug}`} className="btn-outline !py-2">{lang === 'en' ? 'Details' : 'Details'}</Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {msg && <p className="msg-ok mt-5">{msg}</p>}
      <p className="mt-6 text-sm text-slate-500">{t('shop.manualPay')} — {t('shop.payNote')}</p>
    </div>
  )
}
