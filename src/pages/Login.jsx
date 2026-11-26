import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { user, signOut } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)

  if (user) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card text-center">
          <span className="text-4xl">✅</span>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Logged in</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          <button onClick={signOut} className="btn-outline mt-5 w-full">Logout</button>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMsg(''); setIsErr(false)
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setMsg(error.message); setIsErr(true); return }
      const newUser = data.user
      if (newUser) {
        const { error: pErr } = await supabase.from('profiles').insert({
          id: newUser.id, full_name: fullName, phone, role: 'patient'
        })
        if (pErr) { setMsg('Auth ho gaya, profile mein error: ' + pErr.message); setIsErr(true); return }
      }
      setMsg('Account ban gaya. Ab Login karo.')
      setMode('login')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMsg(error.message); setIsErr(true) }
      else setMsg('Login ho gaya.')
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-bold text-slate-900">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'login' ? 'Apni appointment aur orders dekhne ke liye login karo.' : 'Patient account banao — 1 minute lagta hai.'}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <>
              <div><label className="label">Full name</label>
                <input className="input" placeholder="Muhammad Salman" value={fullName} onChange={e => setFullName(e.target.value)} required /></div>
              <div><label className="label">Phone</label>
                <input className="input" placeholder="03XX-XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            </>
          )}
          <div><label className="label">Email</label>
            <input type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div><label className="label">Password</label>
            <input type="password" className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <button type="submit" className="btn-primary w-full !py-3">{mode === 'login' ? 'Login' : 'Sign Up'}</button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-4 w-full text-center text-sm font-semibold text-teal-700 hover:underline">
          {mode === 'login' ? 'Naya account banao →' : 'Pehle se account hai? Login karo →'}
        </button>
        {msg && <p className={`mt-4 ${isErr ? 'msg-err' : 'msg-ok'}`}>{msg}</p>}
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500">
          Test account: <b>patient@test.com</b> / <b>Test123456</b> (Day 1 wala)
        </p>
      </div>
    </div>
  )
}