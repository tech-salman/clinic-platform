import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Home from './pages/Home'
import Book from './pages/Book'
import Shop from './pages/Shop'
import Login from './pages/Login'
import Account from './pages/Account'
import Admin from './pages/Admin'

function Navbar() {
  const { user, role, signOut } = useAuth()
  const linkCls = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-xl font-bold text-white">+</span>
          <span className="leading-tight">
            <span className="block text-base font-bold text-slate-900">Sehat Clinic</span>
            <span className="block text-xs text-slate-500">Care you can trust</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkCls}>Home</NavLink>
          <NavLink to="/book" className={linkCls}>Book Appointment</NavLink>
          <NavLink to="/shop" className={linkCls}>Shop</NavLink>
          <NavLink to="/account" className={linkCls}>My Account</NavLink>
          {role === 'admin' && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-44 truncate text-sm text-slate-600 sm:block">{user.email}</span>
              <button onClick={signOut} className="btn-outline !px-4 !py-2">Logout</button>
            </>
          ) : (
            <Link to="/login" className="btn-outline !px-4 !py-2">Login</Link>
          )}
          <Link to="/book" className="btn-primary !px-4 !py-2">Book Now</Link>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-base font-bold text-slate-900">Sehat Clinic</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            General checkup, online consultation aur pharmacy — sab ek jagah. Appointment online book karo, ya clinic par cash payment karo.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Quick Links</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link className="hover:text-teal-700" to="/book">Book Appointment</Link></li>
            <li><Link className="hover:text-teal-700" to="/shop">Pharmacy Shop</Link></li>
            <li><Link className="hover:text-teal-700" to="/account">My Account</Link></li>
            <li><Link className="hover:text-teal-700" to="/login">Login / Sign Up</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Contact</p>
          <p className="mt-3 text-sm text-slate-600">Phone: 0300-0000000 (placeholder)</p>
          <p className="mt-1 text-sm text-slate-600">Address: Main Branch — client se confirm hone par yahan likhna hai</p>
          <a href="https://wa.me/923000000000" target="_blank" rel="noreferrer" className="btn-primary mt-4 !bg-emerald-600 hover:!bg-emerald-700">
            WhatsApp par rabta karo
          </a>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © 2026 Sehat Clinic — All rights reserved.
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