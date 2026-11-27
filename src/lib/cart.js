// Cart helpers — localStorage only, no React dependency.
// Shared by Shop, ProductDetail, Cart and Checkout so the cart is the
// same everywhere. Key: 'clinic-cart'.
const KEY = 'clinic-cart'

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function write(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* ignore */ }
}

export function getCart() {
  return read()
}

export function addToCart(product, qty = 1) {
  const items = read()
  const found = items.find(i => i.id === product.id)
  const stock = Number(product.stock ?? 0)
  if (found) {
    const next = Math.min(stock > 0 ? stock : found.qty + qty, found.qty + qty)
    found.qty = next
  } else {
    items.push({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      qty: Math.max(1, Math.min(qty, stock > 0 ? stock : qty)),
    })
  }
  write(items)
  return items
}

export function updateQty(id, qty) {
  let items = read()
  if (qty <= 0) items = items.filter(i => i.id !== id)
  else items = items.map(i => (i.id === id ? { ...i, qty } : i))
  write(items)
  return items
}

export function removeFromCart(id) {
  const items = read().filter(i => i.id !== id)
  write(items)
  return items
}

export function clearCart() {
  write([])
  return []
}

export function cartTotal(items) {
  const list = items || read()
  return list.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0)
}

export function cartCount(items) {
  const list = items || read()
  return list.reduce((s, i) => s + Number(i.qty || 0), 0)
}
