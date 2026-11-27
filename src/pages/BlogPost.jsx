import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n'

export default function BlogPost() {
  const { slug } = useParams()
  const { lang } = useLang()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('slug', slug).eq('is_published', true).single()
      .then(({ data }) => { setPost(data || null); setLoading(false) })
  }, [slug])

  if (loading) return <p className="card text-sm text-slate-500">Loading...</p>
  if (!post) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center">
          <h1 className="text-xl font-bold text-slate-900">{lang === 'en' ? 'Article not found' : 'Article nahi mila'}</h1>
          <Link to="/blog" className="btn-outline mt-5">← Blog</Link>
        </div>
      </div>
    )
  }

  const paragraphs = String(post.content || '').split(/\n+/).filter(Boolean)

  return (
    <article className="mx-auto max-w-2xl">
      <Link to="/blog" className="text-sm font-semibold text-teal-700 hover:underline">← Blog</Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{post.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{(post.created_at || '').slice(0, 10)} · {post.author || 'Sehat Clinic'}</p>
      {post.excerpt && <p className="mt-4 text-base leading-relaxed text-slate-600">{post.excerpt}</p>}
      <div className="card mt-6 space-y-4">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-sm leading-relaxed text-slate-700 sm:text-base">{para}</p>
        ))}
        {paragraphs.length === 0 && <p className="text-sm text-slate-500">—</p>}
      </div>
      <Link to="/book" className="btn-primary mt-6">{lang === 'en' ? 'Book Appointment →' : 'Book Appointment →'}</Link>
    </article>
  )
}
