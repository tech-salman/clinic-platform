import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n'

export default function Blog() {
  const { lang } = useLang()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false) })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{lang === 'en' ? 'Blog' : 'Blog'}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {lang === 'en' ? 'Health tips and clinic news.' : 'Sehat ki maloomat aur clinic ki khabrein.'}
      </p>
      {loading && <p className="card mt-6 text-sm text-slate-500">Loading...</p>}
      {!loading && posts.length === 0 && (
        <p className="card mt-6 text-sm text-slate-500">
          {lang === 'en' ? 'No articles yet.' : 'Abhi koi article nahi hai.'}
        </p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map(p => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="card block transition hover:border-teal-600">
            <p className="text-xs text-slate-400">{(p.created_at || '').slice(0, 10)} · {p.author || 'Sehat Clinic'}</p>
            <h2 className="mt-2 font-bold text-slate-900">{p.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{p.excerpt || ''}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-teal-700">
              {lang === 'en' ? 'Read more →' : 'Poora parhein →'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
