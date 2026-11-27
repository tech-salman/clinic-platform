import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n'

export default function Home() {
  const { t } = useLang()
  const [branches, setBranches] = useState([])
  const [doctors, setDoctors] = useState([])

  const services = [
    { title: t('svc.checkup'), desc: t('svc.checkupDesc'), icon: '🩺' },
    { title: t('svc.online'), desc: t('svc.onlineDesc'), icon: '💻' },
    { title: t('svc.pharmacy'), desc: t('svc.pharmacyDesc'), icon: '💊' },
    { title: t('svc.booking'), desc: t('svc.bookingDesc'), icon: '📅' },
  ]

  useEffect(() => {
    supabase.from('branches').select('*').eq('is_active', true).then(({ data }) => setBranches(data || []))
    supabase.from('doctors').select('*').then(({ data }) => setDoctors(data || []))
  }, [])

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="grid items-center gap-8 rounded-3xl bg-teal-700 p-6 text-white sm:p-10 lg:grid-cols-2">
        <div>
          <span className="badge-green !bg-teal-600 !text-teal-50 !ring-teal-500">✓ {t('hero.badge')}</span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-teal-100">
            {t('hero.sub')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/book" className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-teal-800 shadow transition hover:bg-teal-50">
              {t('hero.book')} →
            </Link>
            <Link to="/shop" className="rounded-lg border border-teal-300 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-600">
              {t('hero.shop')}
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <div><p className="text-2xl font-bold">{branches.length || '—'}</p><p className="text-teal-200">{t('hero.branches')}</p></div>
            <div><p className="text-2xl font-bold">{doctors.length || '—'}</p><p className="text-teal-200">{t('hero.doctors')}</p></div>
            <div><p className="text-2xl font-bold">7 days</p><p className="text-teal-200">{t('hero.open')}</p></div>
          </div>
        </div>
        <div className="card !bg-white/95 !p-6 text-slate-800">
          <p className="text-sm font-bold text-slate-900">{t('hero.steps')}</p>
          <ol className="mt-4 space-y-4 text-sm">
            <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">1</span><span>{t('hero.step1')}</span></li>
            <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">2</span><span>{t('hero.step2')}</span></li>
            <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">3</span><span>{t('hero.step3')}</span></li>
          </ol>
          <Link to="/book" className="btn-primary mt-6 w-full">{t('hero.bookNow')}</Link>
          <p className="mt-3 text-center text-xs text-slate-500">{t('hero.loginNote')}</p>
        </div>
      </section>

      {/* Services */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900">{t('home.services')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('home.servicesSub')}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(s => (
            <div key={s.title} className="card">
              <span className="text-3xl">{s.icon}</span>
              <h3 className="mt-3 font-bold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Branches — live */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">{t('home.branches')}</h2>
          <Link to="/book" className="text-sm font-semibold text-teal-700 hover:underline">{t('home.bookArrow')}</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {branches.length === 0 && (
            <p className="card text-sm text-slate-500">{t('home.noBranches')}</p>
          )}
          {branches.map(b => (
            <div key={b.id} className="card">
              <h3 className="font-bold text-slate-900">{b.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{b.address || '—'}</p>
              <p className="mt-2 text-sm text-slate-600">🕐 {b.working_hours || '9 AM – 9 PM'} &nbsp;·&nbsp; 📞 {b.phone || '—'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Doctors — live */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900">{t('home.doctors')}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.length === 0 && (
            <p className="card text-sm text-slate-500">{t('home.noDoctors')}</p>
          )}
          {doctors.map(d => (
            <div key={d.id} className="card">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-2xl">👨‍⚕️</span>
              <h3 className="mt-3 font-bold text-slate-900">{d.name || 'Doctor'}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{d.specialties || 'General Physician'} — {d.bio || '—'}</p>
              <Link to={`/book?doctor=${d.id}`} className="btn-outline mt-4 w-full">{t('home.book')}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl bg-slate-900 p-6 text-center text-white sm:p-10">
        <h2 className="text-2xl font-bold sm:text-3xl">{t('home.ctaTitle')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">{t('home.ctaSub')}</p>
        <Link to="/book" className="btn-primary mt-6 !bg-teal-600 hover:!bg-teal-500 !px-8 !py-3 !text-base">{t('home.book')} →</Link>
      </section>
    </div>
  )
}
