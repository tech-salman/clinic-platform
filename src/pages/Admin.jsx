// Admin control panel — full CRUD over the existing Supabase tables only.
// Tables used: profiles, branches, doctors, slots, appointments, products,
// orders, order_items, payments (+ audit_logs if it exists, best-effort only).
// NOTE: deleting a user here deletes ONLY the profile row. The Auth user
// itself is NOT deleted from the browser — delete it in Supabase
// Authentication > Users. Same for adding users: create the Auth user in
// Supabase first (or via Signup), then set the role here.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/i18n'

const ROLES = ['patient', 'doctor', 'receptionist', 'store_manager', 'admin']
const ORDER_STATUSES = ['pending_payment', 'paid', 'packed', 'shipped', 'delivered', 'cancelled']
const TABS = ['dashboard', 'appointments', 'users', 'doctors', 'branches', 'slots', 'products', 'orders', 'payments', 'blog', 'records', 'invoices', 'notifications', 'settings']

export default function Admin() {
  const { user, role, loading } = useAuth()
  const { t } = useLang()
  const [tab, setTab] = useState('dashboard')
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)
  const [appts, setAppts] = useState([])
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [users, setUsers] = useState([])
  const [doctors, setDoctors] = useState([])
  const [branches, setBranches] = useState([])
  const [slots, setSlots] = useState([])
  const [products, setProducts] = useState([])
  const [orderItems, setOrderItems] = useState([])
  const [blogPosts, setBlogPosts] = useState([])
  const [records, setRecords] = useState([])
  const [invoices, setInvoices] = useState([])
  const [notifications, setNotifications] = useState([])

  // Best-effort audit log: never breaks the main action if audit_logs is missing.
  async function logAudit(action, tableName, recordId) {
    try {
      await supabase.from('audit_logs').insert({
        actor_id: user?.id || null, action, table_name: tableName, record_id: String(recordId || ''),
      })
    } catch { /* audit_logs table may not exist yet — ignore */ }
  }

  function showMsg(text, err = false) { setMsg(text); setIsErr(err) }

  async function loadAll() {
    const [a, o, p, u, d, b, s, pr, oi, bl, rec, inv, notif] = await Promise.all([
      supabase.from('appointments').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('doctors').select('*').order('name'),
      supabase.from('branches').select('*').order('name'),
      supabase.from('slots').select('*').order('slot_date', { ascending: false }).order('start_time'),
      supabase.from('products').select('*').order('name'),
      supabase.from('order_items').select('*'),
      supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
      supabase.from('patient_records').select('*').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    ])
    if (a.data) setAppts(a.data)
    if (o.data) setOrders(o.data)
    if (p.data) setPayments(p.data)
    if (u.data) setUsers(u.data)
    if (d.data) setDoctors(d.data)
    if (b.data) setBranches(b.data)
    if (s.data) setSlots(s.data)
    if (pr.data) setProducts(pr.data)
    if (oi.data) setOrderItems(oi.data)
    if (bl.data) setBlogPosts(bl.data)
    if (rec.data) setRecords(rec.data)
    if (inv.data) setInvoices(inv.data)
    if (notif.data) setNotifications(notif.data)
  }

  useEffect(() => { if (role === 'admin') loadAll() }, [role])

  // ---- Orders: verify payment, EXACT original logic (stock decrement on Paid) ----
  async function markPaid(orderId) {
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId)
    for (const it of items || []) {
      const { data: prod } = await supabase.from('products').select('stock').eq('id', it.product_id).single()
      if (prod) {
        const newStock = Math.max(0, (prod.stock || 0) - (it.quantity || 1))
        await supabase.from('products').update({ stock: newStock }).eq('id', it.product_id)
      }
    }
    await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId)
    await supabase.from('payments').update({ status: 'verified' }).eq('order_id', orderId)
    await logAudit('verify_payment', 'orders', orderId)
    showMsg('Order paid mark ho gaya, stock kam ho gaya')
    loadAll()
  }

  async function updateOrderStatus(orderId, status) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (error) { showMsg(error.message, true); return }
    await logAudit('update_order_status:' + status, 'orders', orderId)
    showMsg('Order status updated')
    loadAll()
  }

  async function updateApptStatus(a, status) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', a.id)
    if (error) { showMsg(error.message, true); return }
    if (status === 'cancelled' && a.slot_id) {
      await supabase.from('slots').update({ is_booked: false }).eq('id', a.slot_id)
    }
    await logAudit('update_appointment:' + status, 'appointments', a.id)
    showMsg('Appointment ' + status)
    loadAll()
  }

  async function verifyPayment(paymentId) {
    const { error } = await supabase.from('payments').update({ status: 'verified' }).eq('id', paymentId)
    if (error) { showMsg(error.message, true); return }
    await logAudit('verify_payment', 'payments', paymentId)
    showMsg('Payment verified')
    loadAll()
  }

  async function changeRole(u, newRole) {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', u.id)
    if (error) { showMsg(error.message, true); return }
    await logAudit('change_role:' + newRole, 'profiles', u.id)
    showMsg((u.full_name || 'User') + ' — role ' + newRole)
    loadAll()
  }

  async function deleteRow(table, id, label) {
    if (!window.confirm(t('common.confirmDelete'))) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { showMsg(error.message, true); return }
    await logAudit('delete', table, id)
    showMsg((label || 'Record') + ' deleted')
    loadAll()
  }

  if (loading) return <p className="card text-sm text-slate-500">{t('common.loading')}</p>
  if (role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center">
          <h1 className="text-xl font-bold text-slate-900">{t('admin.denied')}</h1>
          <p className="mt-2 text-sm text-slate-500">{t('admin.deniedSub')}</p>
        </div>
      </div>
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const month = today.slice(0, 7)
  const todayBookings = appts.filter(a => a.appointment_date === today && a.status === 'booked').length
  const revToday = orders.filter(o => o.status === 'paid' && (o.created_at || '').startsWith(today)).reduce((s, o) => s + Number(o.total || 0), 0)
  const revMonth = orders.filter(o => o.status === 'paid' && (o.created_at || '').startsWith(month)).reduce((s, o) => s + Number(o.total || 0), 0)
  const lowStock = products.filter(p => Number(p.stock || 0) <= 5)
  const pendingOrders = orders.filter(o => o.status === 'pending_payment').length
  const nameOf = (id, list) => (list.find(x => x.id === id)?.full_name || list.find(x => x.id === id)?.name || (id || '').slice(0, 8))

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t('admin.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('admin.sub')}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={tab === tb ? 'btn-primary !px-3 !py-1.5 !text-xs' : 'btn-outline !px-3 !py-1.5 !text-xs'}>
            {tb === 'dashboard' ? 'Dashboard' : tb.charAt(0).toUpperCase() + tb.slice(1)}
          </button>
        ))}
      </div>

      {msg && <p className={`mt-4 ${isErr ? 'msg-err' : 'msg-ok'}`}>{msg}</p>}

      {tab === 'dashboard' && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div className="card !p-4"><p className="text-2xl font-bold text-slate-900">{todayBookings}</p><p className="text-sm text-slate-500">Today’s bookings</p></div>
            <div className="card !p-4"><p className="text-2xl font-bold text-slate-900">Rs. {revToday}</p><p className="text-sm text-slate-500">Revenue today</p></div>
            <div className="card !p-4"><p className="text-2xl font-bold text-slate-900">Rs. {revMonth}</p><p className="text-sm text-slate-500">Revenue this month</p></div>
            <div className="card !p-4"><p className="text-2xl font-bold text-amber-600">{pendingOrders}</p><p className="text-sm text-slate-500">Pending payments</p></div>
            <div className="card !p-4"><p className="text-2xl font-bold text-slate-900">{orders.length}</p><p className="text-sm text-slate-500">Total orders</p></div>
          </div>
          <h2 className="mt-8 font-bold text-slate-900">Low stock (5 or less)</h2>
          <div className="card mt-3 !p-0 overflow-hidden">
            {lowStock.length === 0 && <p className="p-5 text-sm text-slate-500">No low-stock products.</p>}
            {lowStock.map(p => (
              <div key={p.id} className="flex justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
                <span className="text-slate-700">{p.name}</span>
                <span className="badge-amber">Stock: {p.stock}</span>
              </div>
            ))}
          </div>
          <h2 className="mt-8 font-bold text-slate-900">Recent appointments</h2>
          <div className="card mt-3 !p-0 overflow-hidden">
            {appts.slice(0, 5).map(a => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
                <span className="text-slate-700">📅 {a.appointment_date} · {nameOf(a.patient_id, users)} · {nameOf(a.doctor_id, doctors)}</span>
                <span className={a.status === 'booked' ? 'badge-green' : 'badge-slate'}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'appointments' && <AppointmentsTab appts={appts} users={users} doctors={doctors} branches={branches} onStatus={updateApptStatus} onDone={loadAll} logAudit={logAudit} showMsg={showMsg} />}
      {tab === 'users' && <UsersTab users={users} onRole={changeRole} onDelete={(id) => deleteRow('profiles', id, 'User')} />}
      {tab === 'doctors' && <DoctorsTab doctors={doctors} onDone={loadAll} logAudit={logAudit} showMsg={showMsg} />}
      {tab === 'branches' && <BranchesTab branches={branches} onDone={loadAll} logAudit={logAudit} showMsg={showMsg} />}
      {tab === 'slots' && <SlotsTab slots={slots} doctors={doctors} branches={branches} onDone={loadAll} logAudit={logAudit} showMsg={showMsg} />}
      {tab === 'products' && <ProductsTab products={products} onDone={loadAll} logAudit={logAudit} showMsg={showMsg} />}
      {tab === 'orders' && <OrdersTab orders={orders} orderItems={orderItems} users={users} onStatus={updateOrderStatus} onPaid={markPaid} />}
      {tab === 'payments' && <PaymentsTab payments={payments} onVerify={verifyPayment} />}
      {tab === 'blog' && <BlogTab posts={blogPosts} onDone={loadAll} logAudit={logAudit} showMsg={showMsg} />}
      {tab === 'records' && <RecordsTab records={records} users={users} doctors={doctors} onDone={loadAll} logAudit={logAudit} showMsg={showMsg} />}
      {tab === 'invoices' && <InvoicesTab invoices={invoices} onDone={loadAll} logAudit={logAudit} showMsg={showMsg} />}
      {tab === 'notifications' && <NotificationsTab notifications={notifications} users={users} onDone={loadAll} logAudit={logAudit} showMsg={showMsg} />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  )
}

/* ---------- Appointments ---------- */
function AppointmentsTab({ appts, users, doctors, branches, onStatus, onDone, logAudit, showMsg }) {
  const [statusF, setStatusF] = useState('')
  const [dateF, setDateF] = useState('')
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [date, setDate] = useState('')
  const [slotId, setSlotId] = useState('')
  const [apptType, setApptType] = useState('physical')
  const [meetingLink, setMeetingLink] = useState('')
  const [linkMap, setLinkMap] = useState({})
  const [freeSlots, setFreeSlots] = useState([])

  async function loadFreeSlots() {
    if (!doctorId || !date) return
    const { data } = await supabase.from('slots').select('*').eq('doctor_id', doctorId).eq('slot_date', date).eq('is_booked', false).order('start_time')
    setFreeSlots(data || [])
  }
  useEffect(() => { loadFreeSlots() }, [doctorId, date])

  async function createAppt(e) {
    e.preventDefault()
    if (!patientId || !doctorId || !slotId) { showMsg('Patient, doctor and slot are required', true); return }
    const { data, error } = await supabase.from('appointments').insert({
      patient_id: patientId, doctor_id: doctorId, branch_id: branchId || null,
      slot_id: slotId, type: apptType, appointment_date: date, status: 'booked',
      meeting_link: meetingLink.trim() || null,
    }).select().single()
    if (error) { showMsg(error.message, true); return }
    await supabase.from('slots').update({ is_booked: true }).eq('id', slotId)
    await logAudit('create_appointment', 'appointments', data.id)
    showMsg('Appointment created')
    setSlotId('')
    onDone()
  }

  async function saveLink(a) {
    const link = (linkMap[a.id] ?? a.meeting_link ?? '').trim()
    const { error } = await supabase.from('appointments').update({ meeting_link: link || null }).eq('id', a.id)
    if (error) { showMsg(error.message, true); return }
    await logAudit('set_meeting_link', 'appointments', a.id)
    showMsg('Meeting link saved')
    onDone()
  }

  const filtered = appts.filter(a =>
    (!statusF || a.status === statusF) && (!dateF || a.appointment_date === dateF))
  const nameOf = (id, list) => (list.find(x => x.id === id)?.full_name || list.find(x => x.id === id)?.name || (id || '').slice(0, 8))

  return (
    <div className="mt-6">
      <form onSubmit={createAppt} className="card space-y-3">
        <h2 className="font-bold text-slate-900">Create appointment</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Patient</label>
            <select className="input" value={patientId} onChange={e => setPatientId(e.target.value)} required>
              <option value="">Select patient</option>
              {users.filter(u => u.role === 'patient').map(u => <option key={u.id} value={u.id}>{u.full_name || u.id.slice(0, 8)} — {u.phone || ''}</option>)}
            </select></div>
          <div><label className="label">Doctor</label>
            <select className="input" value={doctorId} onChange={e => setDoctorId(e.target.value)} required>
              <option value="">Select doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialties || ''}</option>)}
            </select></div>
          <div><label className="label">Branch</label>
            <select className="input" value={branchId} onChange={e => setBranchId(e.target.value)}>
              <option value="">Select branch</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select></div>
          <div><label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required /></div>
          <div><label className="label">Type</label>
            <select className="input" value={apptType} onChange={e => setApptType(e.target.value)}>
              <option value="physical">Physical (clinic visit)</option>
              <option value="online">Online</option>
            </select></div>
          <div><label className="label">Meeting link (for online)</label>
            <input className="input" placeholder="https://meet.google.com/xxx-yyyy-zzz" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} />
            <p className="mt-1 text-xs text-slate-400">Paste the Meet / Zoom link here. Auto link generation is not set up — the link is added manually.</p></div>
          <div><label className="label">Free slot</label>
            <select className="input" value={slotId} onChange={e => setSlotId(e.target.value)} required>
              <option value="">Select slot</option>
              {freeSlots.map(s => <option key={s.id} value={s.id}>{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</option>)}
            </select></div>
        </div>
        <button className="btn-primary">Create appointment</button>
      </form>

      <div className="mt-6 flex flex-wrap gap-3">
        <select className="input !w-auto" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All statuses</option>
          <option value="booked">Booked</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option>
        </select>
        <input type="date" className="input !w-auto" value={dateF} onChange={e => setDateF(e.target.value)} />
      </div>
      <div className="card mt-3 !p-0 overflow-hidden">
        {filtered.length === 0 && <p className="p-5 text-sm text-slate-500">No appointments.</p>}
        {filtered.map(a => (
          <div key={a.id} className="border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-700">📅 {a.appointment_date} · {nameOf(a.patient_id, users)} · {nameOf(a.doctor_id, doctors)} · {a.type}</span>
              <span className="flex items-center gap-2">
                <span className={a.status === 'booked' ? 'badge-green' : 'badge-slate'}>{a.status}</span>
                {a.status === 'booked' && <button onClick={() => onStatus(a, 'completed')} className="btn-outline !px-3 !py-1.5 !text-xs">Complete</button>}
                {a.status === 'booked' && <button onClick={() => onStatus(a, 'cancelled')} className="btn-danger !px-3 !py-1.5 !text-xs">Cancel</button>}
              </span>
            </div>
            {a.type === 'online' && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input className="input !w-72 !py-1.5" placeholder="Meeting link (Meet / Zoom URL)"
                  value={linkMap[a.id] ?? a.meeting_link ?? ''} onChange={e => setLinkMap({ ...linkMap, [a.id]: e.target.value })} />
                <button onClick={() => saveLink(a)} className="btn-outline !px-3 !py-1.5 !text-xs">Save link</button>
                {a.meeting_link && <a href={a.meeting_link} target="_blank" rel="noreferrer" className="text-xs font-semibold text-teal-700 hover:underline">Open link</a>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Users ---------- */
function UsersTab({ users, onRole, onDelete }) {
  const [q, setQ] = useState('')
  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(q.toLowerCase()) ||
    (u.phone || '').includes(q) || (u.id || '').includes(q))
  return (
    <div className="mt-6">
      <p className="card text-sm text-slate-500">
        Roles are set here. To add a new user, create their account via Signup first, then set the role here.
        Deleting here removes only the profile row — delete the Auth user in Supabase Authentication &gt; Users as well.
      </p>
      <input className="input mt-4" placeholder="Search by name, phone or ID" value={q} onChange={e => setQ(e.target.value)} />
      <div className="card mt-3 !p-0 overflow-hidden">
        {filtered.length === 0 && <p className="p-5 text-sm text-slate-500">No users found.</p>}
        {filtered.map(u => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <span className="text-slate-700">{u.full_name || '—'} · {u.phone || '—'} · <span className="text-slate-400">{u.id.slice(0, 8)}…</span></span>
            <span className="flex items-center gap-2">
              <select className="input !w-auto !py-1.5" value={u.role || 'patient'} onChange={e => onRole(u, e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => onDelete(u.id)} className="btn-danger !px-3 !py-1.5 !text-xs">Delete</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Doctors ---------- */
function DoctorsTab({ doctors, onDone, logAudit, showMsg }) {
  const [form, setForm] = useState({ id: '', name: '', specialties: '', bio: '' })
  async function save(e) {
    e.preventDefault()
    if (form.id) {
      const { error } = await supabase.from('doctors').update({ name: form.name, specialties: form.specialties, bio: form.bio }).eq('id', form.id)
      if (error) { showMsg(error.message, true); return }
      await logAudit('update_doctor', 'doctors', form.id)
    } else {
      const { data, error } = await supabase.from('doctors').insert({ name: form.name, specialties: form.specialties, bio: form.bio }).select().single()
      if (error) { showMsg(error.message, true); return }
      await logAudit('create_doctor', 'doctors', data.id)
    }
    setForm({ id: '', name: '', specialties: '', bio: '' })
    showMsg('Doctor saved')
    onDone()
  }
  async function del(id) {
    if (!window.confirm('Are you sure you want to delete this?')) return
    const { error } = await supabase.from('doctors').delete().eq('id', id)
    if (error) { showMsg(error.message, true); return }
    await logAudit('delete', 'doctors', id)
    showMsg('Doctor deleted')
    onDone()
  }
  return (
    <div className="mt-6">
      <form onSubmit={save} className="card space-y-3">
        <h2 className="font-bold text-slate-900">{form.id ? 'Edit doctor' : 'Add doctor'}</h2>
        <input className="input" placeholder="Name, e.g. Dr. Ahmed Khan" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Specialties, e.g. General Medicine" value={form.specialties} onChange={e => setForm({ ...form, specialties: e.target.value })} />
        <input className="input" placeholder="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
        <div className="flex gap-2">
          <button className="btn-primary">{form.id ? 'Save changes' : 'Add doctor'}</button>
          {form.id && <button type="button" className="btn-outline" onClick={() => setForm({ id: '', name: '', specialties: '', bio: '' })}>Cancel</button>}
        </div>
      </form>
      <div className="card mt-3 !p-0 overflow-hidden">
        {doctors.map(d => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <span className="text-slate-700">{d.name} · {d.specialties || ''}</span>
            <span className="flex gap-2">
              <button onClick={() => setForm({ id: d.id, name: d.name || '', specialties: d.specialties || '', bio: d.bio || '' })} className="btn-outline !px-3 !py-1.5 !text-xs">Edit</button>
              <button onClick={() => del(d.id)} className="btn-danger !px-3 !py-1.5 !text-xs">Delete</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Branches ---------- */
function BranchesTab({ branches, onDone, logAudit, showMsg }) {
  const [form, setForm] = useState({ id: '', name: '', address: '', phone: '', working_hours: '' })
  async function save(e) {
    e.preventDefault()
    const payload = { name: form.name, address: form.address, phone: form.phone, working_hours: form.working_hours }
    if (form.id) {
      const { error } = await supabase.from('branches').update(payload).eq('id', form.id)
      if (error) { showMsg(error.message, true); return }
      await logAudit('update_branch', 'branches', form.id)
    } else {
      const { data, error } = await supabase.from('branches').insert({ ...payload, is_active: true }).select().single()
      if (error) { showMsg(error.message, true); return }
      await logAudit('create_branch', 'branches', data.id)
    }
    setForm({ id: '', name: '', address: '', phone: '', working_hours: '' })
    showMsg('Branch saved')
    onDone()
  }
  async function del(id) {
    if (!window.confirm('Are you sure you want to delete this?')) return
    const { error } = await supabase.from('branches').delete().eq('id', id)
    if (error) { showMsg(error.message, true); return }
    await logAudit('delete', 'branches', id)
    showMsg('Branch deleted')
    onDone()
  }
  return (
    <div className="mt-6">
      <form onSubmit={save} className="card space-y-3">
        <h2 className="font-bold text-slate-900">{form.id ? 'Edit branch' : 'Add branch'}</h2>
        <input className="input" placeholder="Name, e.g. Main Branch" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        <input className="input" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input className="input" placeholder="Working hours, e.g. 9 AM – 9 PM" value={form.working_hours} onChange={e => setForm({ ...form, working_hours: e.target.value })} />
        <div className="flex gap-2">
          <button className="btn-primary">{form.id ? 'Save changes' : 'Add branch'}</button>
          {form.id && <button type="button" className="btn-outline" onClick={() => setForm({ id: '', name: '', address: '', phone: '', working_hours: '' })}>Cancel</button>}
        </div>
      </form>
      <div className="card mt-3 !p-0 overflow-hidden">
        {branches.map(b => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <span className="text-slate-700">{b.name} · {b.address || ''} · {b.phone || ''}</span>
            <span className="flex gap-2">
              <button onClick={() => setForm({ id: b.id, name: b.name || '', address: b.address || '', phone: b.phone || '', working_hours: b.working_hours || '' })} className="btn-outline !px-3 !py-1.5 !text-xs">Edit</button>
              <button onClick={() => del(b.id)} className="btn-danger !px-3 !py-1.5 !text-xs">Delete</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Slots ---------- */
function SlotsTab({ slots, doctors, branches, onDone, logAudit, showMsg }) {
  const [doctorId, setDoctorId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [date, setDate] = useState('')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('09:30')
  async function add(e) {
    e.preventDefault()
    const { data, error } = await supabase.from('slots').insert({
      doctor_id: doctorId, branch_id: branchId || null, slot_date: date,
      start_time: start, end_time: end, is_booked: false,
    }).select().single()
    if (error) { showMsg(error.message, true); return }
    await logAudit('create_slot', 'slots', data.id)
    showMsg('Slot added')
    onDone()
  }
  async function del(s) {
    if (s.is_booked) { showMsg('Booked slot cannot be deleted', true); return }
    if (!window.confirm('Are you sure you want to delete this?')) return
    const { error } = await supabase.from('slots').delete().eq('id', s.id)
    if (error) { showMsg(error.message, true); return }
    await logAudit('delete', 'slots', s.id)
    showMsg('Slot deleted')
    onDone()
  }
  const nameOf = (id, list) => (list.find(x => x.id === id)?.name || (id || '').slice(0, 8))
  return (
    <div className="mt-6">
      <form onSubmit={add} className="card space-y-3">
        <h2 className="font-bold text-slate-900">Add slot</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Doctor</label>
            <select className="input" value={doctorId} onChange={e => setDoctorId(e.target.value)} required>
              <option value="">Select doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div><label className="label">Branch</label>
            <select className="input" value={branchId} onChange={e => setBranchId(e.target.value)}>
              <option value="">Select branch</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select></div>
          <div><label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start</label><input type="time" className="input" value={start} onChange={e => setStart(e.target.value)} required /></div>
            <div><label className="label">End</label><input type="time" className="input" value={end} onChange={e => setEnd(e.target.value)} required /></div>
          </div>
        </div>
        <button className="btn-primary">Add slot</button>
      </form>
      <div className="card mt-3 !p-0 overflow-hidden">
        {slots.length === 0 && <p className="p-5 text-sm text-slate-500">No slots yet.</p>}
        {slots.slice(0, 100).map(s => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <span className="text-slate-700">{s.slot_date} · {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)} · {nameOf(s.doctor_id, doctors)} · {nameOf(s.branch_id, branches)}</span>
            <span className="flex items-center gap-2">
              <span className={s.is_booked ? 'badge-slate' : 'badge-green'}>{s.is_booked ? 'Booked' : 'Free'}</span>
              {!s.is_booked && <button onClick={() => del(s)} className="btn-danger !px-3 !py-1.5 !text-xs">Delete</button>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Products ---------- */
function ProductsTab({ products, onDone, logAudit, showMsg }) {
  const [form, setForm] = useState({ id: '', name: '', description: '', price: '', stock: '', category: '', is_active: true })
  async function save(e) {
    e.preventDefault()
    const payload = {
      name: form.name, description: form.description || null,
      price: Number(form.price), stock: Number(form.stock || 0),
      category: form.category || null, is_active: form.is_active,
    }
    if (form.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', form.id)
      if (error) { showMsg(error.message, true); return }
      await logAudit('update_product', 'products', form.id)
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select().single()
      if (error) { showMsg(error.message, true); return }
      await logAudit('create_product', 'products', data.id)
    }
    setForm({ id: '', name: '', description: '', price: '', stock: '', category: '', is_active: true })
    showMsg('Product saved')
    onDone()
  }
  async function del(id) {
    if (!window.confirm('Are you sure you want to delete this?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { showMsg(error.message, true); return }
    await logAudit('delete', 'products', id)
    showMsg('Product deleted')
    onDone()
  }
  return (
    <div className="mt-6">
      <form onSubmit={save} className="card space-y-3">
        <h2 className="font-bold text-slate-900">{form.id ? 'Edit product' : 'Add product'}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <input className="input" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input className="input" type="number" min="0" step="0.01" placeholder="Price (Rs.)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
          <input className="input" type="number" min="0" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active (shown in Shop)
          </label>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary">{form.id ? 'Save changes' : 'Add product'}</button>
          {form.id && <button type="button" className="btn-outline" onClick={() => setForm({ id: '', name: '', description: '', price: '', stock: '', category: '', is_active: true })}>Cancel</button>}
        </div>
      </form>
      <div className="card mt-3 !p-0 overflow-hidden">
        {products.map(p => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <span className="text-slate-700">{p.name} · Rs. {p.price} · Stock: {p.stock} · {p.is_active ? 'Active' : 'Hidden'}</span>
            <span className="flex gap-2">
              <button onClick={() => setForm({ id: p.id, name: p.name || '', description: p.description || '', price: String(p.price ?? ''), stock: String(p.stock ?? ''), category: p.category || '', is_active: p.is_active !== false })} className="btn-outline !px-3 !py-1.5 !text-xs">Edit</button>
              <button onClick={() => del(p.id)} className="btn-danger !px-3 !py-1.5 !text-xs">Delete</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Orders ---------- */
function OrdersTab({ orders, orderItems, users, onStatus, onPaid }) {
  const [statusF, setStatusF] = useState('')
  const filtered = orders.filter(o => !statusF || o.status === statusF)
  const nameOf = (id) => (users.find(u => u.id === id)?.full_name || (id || '').slice(0, 8))
  return (
    <div className="mt-6">
      <select className="input !w-auto" value={statusF} onChange={e => setStatusF(e.target.value)}>
        <option value="">All statuses</option>
        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <div className="card mt-3 !p-0 overflow-hidden">
        {filtered.length === 0 && <p className="p-5 text-sm text-slate-500">No orders.</p>}
        {filtered.map(o => {
          const items = orderItems.filter(i => i.order_id === o.id)
          return (
            <div key={o.id} className="border-b border-slate-100 px-5 py-3 text-sm last:border-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-700">Rs. {o.total} · {nameOf(o.patient_id)} · {o.id.slice(0, 8)}…</span>
                <span className="flex items-center gap-2">
                  <select className="input !w-auto !py-1.5" value={o.status} onChange={e => onStatus(o.id, e.target.value)}>
                    {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {o.status === 'pending_payment' && <button onClick={() => onPaid(o.id)} className="btn-primary !px-3 !py-1.5 !text-xs">Verify Payment</button>}
                </span>
              </div>
              {items.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">{items.length} item(s) · {items.map(i => `${i.quantity} × ${i.product_id.slice(0, 8)}`).join(', ')}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Payments ---------- */
function PaymentsTab({ payments, onVerify }) {
  return (
    <div className="mt-6">
      <div className="card !p-0 overflow-hidden">
        {payments.length === 0 && <p className="p-5 text-sm text-slate-500">No payments yet.</p>}
        {payments.map(p => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <span className="text-slate-700">Rs. {p.amount} · {p.method} · {p.transaction_id || '—'} · Order {String(p.order_id || '').slice(0, 8)}…</span>
            <span className="flex items-center gap-2">
              <span className={p.status === 'verified' ? 'badge-green' : 'badge-amber'}>{p.status}</span>
              {p.status !== 'verified' && <button onClick={() => onVerify(p.id)} className="btn-primary !px-3 !py-1.5 !text-xs">Mark verified</button>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Blog ---------- */
function BlogTab({ posts, onDone, logAudit, showMsg }) {
  const [form, setForm] = useState({ id: '', slug: '', title: '', excerpt: '', content: '', author: 'Sehat Clinic', is_published: true })
  async function save(e) {
    e.preventDefault()
    const payload = { slug: form.slug.trim(), title: form.title, excerpt: form.excerpt || null, content: form.content || null, author: form.author || 'Sehat Clinic', is_published: form.is_published, updated_at: new Date().toISOString() }
    if (form.id) {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', form.id)
      if (error) { showMsg(error.message, true); return }
      await logAudit('update_blog', 'blog_posts', form.id)
    } else {
      const { data, error } = await supabase.from('blog_posts').insert(payload).select().single()
      if (error) { showMsg(error.message, true); return }
      await logAudit('create_blog', 'blog_posts', data.id)
    }
    setForm({ id: '', slug: '', title: '', excerpt: '', content: '', author: 'Sehat Clinic', is_published: true })
    showMsg('Blog post saved')
    onDone()
  }
  async function del(id) {
    if (!window.confirm('Are you sure you want to delete this?')) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) { showMsg(error.message, true); return }
    await logAudit('delete', 'blog_posts', id)
    showMsg('Blog post deleted')
    onDone()
  }
  async function togglePublish(p) {
    const { error } = await supabase.from('blog_posts').update({ is_published: !p.is_published }).eq('id', p.id)
    if (error) { showMsg(error.message, true); return }
    await logAudit('toggle_blog_publish', 'blog_posts', p.id)
    onDone()
  }
  return (
    <div className="mt-6">
      <form onSubmit={save} className="card space-y-3">
        <h2 className="font-bold text-slate-900">{form.id ? 'Edit blog post' : 'New blog post'}</h2>
        <input className="input" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        <input className="input" placeholder="Slug, e.g. sehat-ka-khayal (used in the URL /blog/slug)" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required />
        <input className="input" placeholder="Excerpt (short summary)" value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} />
        <textarea className="input" rows="6" placeholder="Content — plain text, one paragraph per line" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
        <input className="input" placeholder="Author" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} /> Published (visible on /blog)
        </label>
        <div className="flex gap-2">
          <button className="btn-primary">{form.id ? 'Save changes' : 'Add post'}</button>
          {form.id && <button type="button" className="btn-outline" onClick={() => setForm({ id: '', slug: '', title: '', excerpt: '', content: '', author: 'Sehat Clinic', is_published: true })}>Cancel</button>}
        </div>
      </form>
      <div className="card mt-3 !p-0 overflow-hidden">
        {posts.length === 0 && <p className="p-5 text-sm text-slate-500">No blog posts yet.</p>}
        {posts.map(p => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <span className="text-slate-700">{p.title} · <span className="text-slate-400">/{p.slug}</span></span>
            <span className="flex items-center gap-2">
              <span className={p.is_published ? 'badge-green' : 'badge-slate'}>{p.is_published ? 'Published' : 'Draft'}</span>
              <button onClick={() => togglePublish(p)} className="btn-outline !px-3 !py-1.5 !text-xs">{p.is_published ? 'Unpublish' : 'Publish'}</button>
              <button onClick={() => setForm({ id: p.id, slug: p.slug || '', title: p.title || '', excerpt: p.excerpt || '', content: p.content || '', author: p.author || 'Sehat Clinic', is_published: p.is_published !== false })} className="btn-outline !px-3 !py-1.5 !text-xs">Edit</button>
              <button onClick={() => del(p.id)} className="btn-danger !px-3 !py-1.5 !text-xs">Delete</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Patient records (prescriptions / reports) ---------- */
function RecordsTab({ records, users, doctors, onDone, logAudit, showMsg }) {
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [type, setType] = useState('prescription')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  async function create(e) {
    e.preventDefault()
    const { data, error } = await supabase.from('patient_records').insert({
      patient_id: patientId, doctor_id: doctorId || null, type, title, content: content || null, file_url: fileUrl.trim() || null,
    }).select().single()
    if (error) { showMsg(error.message, true); return }
    await logAudit('create_record:' + type, 'patient_records', data.id)
    setTitle(''); setContent(''); setFileUrl('')
    showMsg('Record added — the patient can see it in My Account')
    onDone()
  }
  async function del(id) {
    if (!window.confirm('Are you sure you want to delete this?')) return
    const { error } = await supabase.from('patient_records').delete().eq('id', id)
    if (error) { showMsg(error.message, true); return }
    await logAudit('delete', 'patient_records', id)
    showMsg('Record deleted')
    onDone()
  }
  const nameOf = (id, list) => (list.find(x => x.id === id)?.full_name || list.find(x => x.id === id)?.name || (id || '').slice(0, 8))
  return (
    <div className="mt-6">
      <form onSubmit={create} className="card space-y-3">
        <h2 className="font-bold text-slate-900">Add prescription / report</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Patient</label>
            <select className="input" value={patientId} onChange={e => setPatientId(e.target.value)} required>
              <option value="">Select patient</option>
              {users.filter(u => u.role === 'patient').map(u => <option key={u.id} value={u.id}>{u.full_name || u.id.slice(0, 8)} — {u.phone || ''}</option>)}
            </select></div>
          <div><label className="label">Doctor</label>
            <select className="input" value={doctorId} onChange={e => setDoctorId(e.target.value)}>
              <option value="">Select doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div><label className="label">Type</label>
            <select className="input" value={type} onChange={e => setType(e.target.value)}>
              <option value="prescription">Prescription</option>
              <option value="report">Report</option>
            </select></div>
          <div><label className="label">File URL (optional, Supabase Storage link)</label>
            <input className="input" value={fileUrl} onChange={e => setFileUrl(e.target.value)} /></div>
        </div>
        <input className="input" placeholder="Title, e.g. Prescription — 27 Nov 2026" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea className="input" rows="4" placeholder="Details — medicines, dosage, notes" value={content} onChange={e => setContent(e.target.value)} />
        <button className="btn-primary">Add record</button>
      </form>
      <div className="card mt-3 !p-0 overflow-hidden">
        {records.length === 0 && <p className="p-5 text-sm text-slate-500">No records yet.</p>}
        {records.map(r => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <span className="text-slate-700">{r.title} · {nameOf(r.patient_id, users)} · {r.type} · {(r.created_at || '').slice(0, 10)}</span>
            <button onClick={() => del(r.id)} className="btn-danger !px-3 !py-1.5 !text-xs">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Invoices ---------- */
function InvoicesTab({ invoices, onDone, logAudit, showMsg }) {
  async function setStatus(inv, status) {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', inv.id)
    if (error) { showMsg(error.message, true); return }
    await logAudit('update_invoice:' + status, 'invoices', inv.id)
    showMsg('Invoice ' + status)
    onDone()
  }
  return (
    <div className="mt-6">
      <div className="card !p-0 overflow-hidden">
        {invoices.length === 0 && <p className="p-5 text-sm text-slate-500">No invoices yet. Invoices are created automatically at checkout.</p>}
        {invoices.map(inv => (
          <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <span className="text-slate-700">{inv.invoice_number} · Rs. {inv.total} · Order {String(inv.order_id || '').slice(0, 8)}… · {(inv.created_at || '').slice(0, 10)}</span>
            <span className="flex items-center gap-2">
              <span className={inv.status === 'paid' ? 'badge-green' : 'badge-amber'}>{inv.status}</span>
              {inv.status !== 'paid' && <button onClick={() => setStatus(inv, 'paid')} className="btn-primary !px-3 !py-1.5 !text-xs">Mark paid</button>}
              {inv.status === 'paid' && <button onClick={() => setStatus(inv, 'unpaid')} className="btn-outline !px-3 !py-1.5 !text-xs">Mark unpaid</button>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Notifications (in-app only; no email/SMS is sent) ---------- */
function NotificationsTab({ notifications, users, onDone, logAudit, showMsg }) {
  const [userId, setUserId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  async function send(e) {
    e.preventDefault()
    const { data, error } = await supabase.from('notifications').insert({
      user_id: userId, title, message: message || '', type: 'info',
    }).select().single()
    if (error) { showMsg(error.message, true); return }
    await logAudit('send_notification', 'notifications', data.id)
    setTitle(''); setMessage('')
    showMsg('Notification sent — the user sees it in My Account')
    onDone()
  }
  const nameOf = (id) => (users.find(u => u.id === id)?.full_name || (id || '').slice(0, 8))
  return (
    <div className="mt-6">
      <p className="card text-sm text-slate-500">
        In-app notifications only. No email or SMS is sent from here — that needs a provider key and is not set up yet.
      </p>
      <form onSubmit={send} className="card mt-4 space-y-3">
        <h2 className="font-bold text-slate-900">Send notification</h2>
        <div><label className="label">User</label>
          <select className="input" value={userId} onChange={e => setUserId(e.target.value)} required>
            <option value="">Select user</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.id.slice(0, 8)} — {u.role || 'patient'}</option>)}
          </select></div>
        <input className="input" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea className="input" rows="3" placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} />
        <button className="btn-primary">Send notification</button>
      </form>
      <div className="card mt-3 !p-0 overflow-hidden">
        {notifications.length === 0 && <p className="p-5 text-sm text-slate-500">No notifications yet.</p>}
        {notifications.slice(0, 100).map(n => (
          <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
            <span className="text-slate-700">{n.title} · {nameOf(n.user_id)} · {(n.created_at || '').slice(0, 10)}</span>
            <span className={n.is_read ? 'badge-slate' : 'badge-green'}>{n.is_read ? 'Read' : 'Unread'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Settings (local only, until the client supplies final details) ---------- */
function SettingsTab() {
  const [form, setForm] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('clinic-settings') || '{}')
    } catch { return {} }
  })
  const [saved, setSaved] = useState(false)
  const v = {
    clinic_name: form.clinic_name ?? 'Sehat Clinic',
    phone: form.phone ?? '0300-0000000',
    address: form.address ?? 'Main Branch, Multan',
    whatsapp: form.whatsapp ?? '923000000000',
  }
  function save(e) {
    e.preventDefault()
    try { localStorage.setItem('clinic-settings', JSON.stringify(v)) } catch { /* ignore */ }
    setSaved(true)
  }
  return (
    <div className="mt-6">
      <form onSubmit={save} className="card space-y-3">
        <h2 className="font-bold text-slate-900">Clinic settings</h2>
        <p className="text-sm text-slate-500">These details are saved in this browser. They will be shown on the site once the final information is supplied.</p>
        <div><label className="label">Clinic name</label>
          <input className="input" value={v.clinic_name} onChange={e => setForm({ ...v, clinic_name: e.target.value })} /></div>
        <div><label className="label">Phone</label>
          <input className="input" value={v.phone} onChange={e => setForm({ ...v, phone: e.target.value })} /></div>
        <div><label className="label">Address</label>
          <input className="input" value={v.address} onChange={e => setForm({ ...v, address: e.target.value })} /></div>
        <div><label className="label">WhatsApp number (without +)</label>
          <input className="input" value={v.whatsapp} onChange={e => setForm({ ...v, whatsapp: e.target.value })} /></div>
        <button className="btn-primary">Save settings</button>
        {saved && <p className="msg-ok">Settings saved.</p>}
      </form>
    </div>
  )
}
