import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import { useLang, LangToggle } from './lib/i18n'
import { ThemeToggle } from './lib/theme'
import Home from './pages/Home'
import Book from './pages/Book'
import Shop from './pages/Shop'
import Login from './pages/Login'
import Account from './pages/Account'
import Admin from './pages/Admin'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderTracking from './pages/OrderTracking'

function Navbar() {
  const { user, role, signOut } = useAuth()
  const { t } = useLang()
  const linkCls = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'}`

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-xl font-bold text-white">+</span>
          <span className="leading-tight">
            <span className="block text-base font-bold text-slate-900">Sehat Clinic</span>
            <span className="block text-xs text-slate-500">{t('nav.tagline')}</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkCls}>{t('nav.home')}</NavLink>
          <NavLink to="/book" className={linkCls}>{t('nav.book')}</NavLink>
          <NavLink to="/shop" className={linkCls}>{t('nav.shop')}</NavLink>
          <NavLink to="/blog" className={linkCls}>Blog</NavLink>
          <NavLink to="/cart" className={linkCls}>{t('shop.cart')}</NavLink>
          <NavLink to="/account" className={linkCls}>{t('nav.account')}</NavLink>
          {role === 'admin' && <NavLink to="/admin" className={linkCls}>{t('nav.admin')}</NavLink>}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden max-w-44 truncate text-sm text-slate-600 sm:block">{user.email}</span>
              <button onClick={signOut} className="btn-outline !px-4 !py-2">{t('nav.logout')}</button>
            </>
          ) : (
            <Link to="/login" className="btn-outline !px-4 !py-2">{t('nav.login')}</Link>
          )}
          <Link to="/book" className="btn-primary !px-4 !py-2">{t('nav.bookNow')}</Link>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const { t } = useLang()
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-base font-bold text-slate-900">Sehat Clinic</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{t('footer.about')}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{t('footer.quick')}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link className="hover:text-teal-700" to="/book">{t('nav.book')}</Link></li>
            <li><Link className="hover:text-teal-700" to="/shop">{t('shop.title')}</Link></li>
            <li><Link className="hover:text-teal-700" to="/blog">Blog</Link></li>
            <li><Link className="hover:text-teal-700" to="/account">{t('nav.account')}</Link></li>
            <li><Link className="hover:text-teal-700" to="/login">{t('nav.login')} / Sign Up</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{t('footer.contact')}</p>
          <p className="mt-3 text-sm text-slate-600">{t('footer.phone')}</p>
          <p className="mt-1 text-sm text-slate-600">{t('footer.address')}</p>
          <a href="https://wa.me/923000000000" target="_blank" rel="noreferrer" className="btn-primary mt-4 !bg-emerald-600 hover:!bg-emerald-700">
            {t('footer.whatsapp')}
          </a>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        {t('footer.rights')}
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<Book />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:slug" element={<ProductDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderTracking />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
