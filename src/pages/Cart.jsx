import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { getCart, updateQty, removeFromCart, cartTotal } from '../lib/cart'

export default function Cart() {
  const { lang, t } = useLang()
  const [items, setItems] = useState(() => getCart())

  const total = cartTotal(items)

  function changeQty(id, qty) {
    setItems(updateQty(id, qty))
  }
  function remove(id) {
    setItems(removeFromCart(id))
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t('shop.cart')}</h1>
      <p className="mt-1 text-sm text-slate-500">{lang === 'en' ? 'Review your items before checkout.' : 'Checkout se pehle apni cheezein dekh lein.'}</p>

      {items.length === 0 && (
        <p className="card mt-6 text-sm text-slate-500">
          {t('shop.cartEmpty')} <Link to="/shop" className="font-semibold text-teal-700 underline">{t('acc.shopNow')}</Link>
        </p>
      )}

      {items.length > 0 && (
        <div className="card mt-6 !p-0 overflow-hidden">
          {items.map(i => (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-0">
              <div>
                <p className="font-semibold text-slate-900">{i.name}</p>
                <p className="mt-1 text-xs text-slate-500">Rs. {i.price} {lang === 'en' ? 'each' : 'har aik'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => changeQty(i.id, i.qty - 1)}>−</button>
                <span className="w-6 text-center font-bold text-slate-900">{i.qty}</span>
                <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => changeQty(i.id, i.qty + 1)}>+</button>
                <span className="ml-2 w-20 text-right font-semibold text-slate-900">Rs. {Number(i.price) * i.qty}</span>
                <button type="button" onClick={() => remove(i.id)} className="btn-danger !px-3 !py-1.5 !text-xs">{t('common.delete')}</button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="font-bold text-slate-900">{t('shop.total')}</span>
            <span className="text-lg font-bold text-teal-700">Rs. {total}</span>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/checkout" className="btn-primary">{lang === 'en' ? 'Proceed to Checkout →' : 'Checkout →'}</Link>
          <Link to="/shop" className="btn-outline">{lang === 'en' ? 'Continue Shopping' : 'Shop Jari Rakhein'}</Link>
        </div>
      )}
    </div>
  )
}
