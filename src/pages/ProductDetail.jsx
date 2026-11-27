import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n'
import { addToCart } from '../lib/cart'

export default function ProductDetail() {
  const { slug } = useParams()
  const { lang, t } = useLang()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('products').select('*').eq('slug', slug).single()
      .then(({ data }) => { setProduct(data || null); setLoading(false) })
  }, [slug])

  if (loading) return <p className="card text-sm text-slate-500">Loading...</p>
  if (!product) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center">
          <h1 className="text-xl font-bold text-slate-900">{lang === 'en' ? 'Product not found' : 'Product nahi mila'}</h1>
          <Link to="/shop" className="btn-outline mt-5">← {t('nav.shop')}</Link>
        </div>
      </div>
    )
  }

  function add() {
    addToCart(product, qty)
    setMsg(lang === 'en' ? 'Added to cart.' : 'Cart mein add ho gaya.')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/shop" className="text-sm font-semibold text-teal-700 hover:underline">← {t('nav.shop')}</Link>
      <div className="card mt-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 text-3xl">💊</span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{product.name}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{product.description || product.category || 'Pharmacy product'}</p>
        <p className="mt-4 text-2xl font-bold text-teal-700">Rs. {product.price}</p>
        <p className="mt-1 text-sm text-slate-500">{t('shop.stock')} {product.stock}</p>
        {product.stock > 0 ? <span className="badge-green mt-3">{t('book.available')}</span> : <span className="badge-slate mt-3">{t('shop.outStock')}</span>}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="label !mb-0">{lang === 'en' ? 'Quantity' : 'Miqdaar'}</label>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span className="w-8 text-center font-bold text-slate-900">{qty}</span>
            <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => setQty(q => Math.min(Number(product.stock || 99), q + 1))}>+</button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={add} className="btn-primary" disabled={product.stock <= 0}>{t('shop.addCart')}</button>
          <Link to="/cart" className="btn-outline">{lang === 'en' ? 'View Cart →' : 'Cart Dekho →'}</Link>
        </div>
        {msg && <p className="msg-ok mt-4">{msg}</p>}
      </div>
    </div>
  )
}
