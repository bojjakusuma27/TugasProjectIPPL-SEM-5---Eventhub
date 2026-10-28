import { useState } from 'react'
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { useDB, login, logout } from './store.js'
import { Katalog, Detail, Pesan, Pesanan, Feedback } from './pages/Customer.jsx'
import { Events, Kuota, Verifikasi, Status, Data } from './pages/Admin.jsx'

const Logo = ({ s = 32 }) => (
  <span className="lg">
    <svg width={s} height={s} viewBox="0 0 96 96" aria-hidden="true">
      <rect width="96" height="96" rx="24" fill="#1F4FE0" />
      <rect x="22" y="28" width="52" height="46" rx="10" fill="#fff" />
      <rect x="34" y="19" width="6" height="16" rx="3" fill="#0A1F5C" />
      <rect x="56" y="19" width="6" height="16" rx="3" fill="#0A1F5C" />
      <path d="M48 54L38 46M48 54L58 46M48 54V66" stroke="#1F4FE0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="37" cy="45" r="3.5" fill="#1F4FE0" /><circle cx="59" cy="45" r="3.5" fill="#1F4FE0" />
      <circle cx="48" cy="67" r="3.5" fill="#1F4FE0" /><circle cx="48" cy="54" r="6" fill="#FFB020" />
    </svg>
    Event<b>Hub</b>
  </span>
)

// Use case: Login
function Login() {
  const nav = useNavigate()
  const [f, setF] = useState({ u: '', p: '' })
  const [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (!f.u || !f.p) return setErr('Username dan password wajib diisi.')
    const s = login(f.u, f.p)
    if (!s) return setErr('Username atau password salah.')
    nav(s.role === 'admin' ? '/admin' : '/')
  }
  return (
    <div className="login">
      <div className="hero-l">
        <Logo s={40} />
        <div>
          <h1>Temukan event terbaik, lebih mudah.</h1>
          <p>Sistem Pemesanan & Etalase Event/Seminar</p>
        </div>
      </div>
      <form className="form" onSubmit={submit}>
        <h2>Selamat datang</h2>
        <p className="m">Masuk untuk melanjutkan ke EventHub.</p>
        <label>Username<input value={f.u} onChange={(e) => setF({ ...f, u: e.target.value })} placeholder="customer atau admin" /></label>
        <label>Password<input type="password" value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })} placeholder="Masukkan password" /></label>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn" type="submit">Masuk</button>
        <p className="m demo">Akun demo: customer / customer123 dan admin / admin123</p>
      </form>
    </div>
  )
}

// Penjaga rute + kerangka halaman (navbar + Logout)
function Guard({ role, children }) {
  const { session } = useDB()
  if (!session) return <Navigate to="/login" replace />
  if (session.role !== role) return <Navigate to={session.role === 'admin' ? '/admin' : '/'} replace />
  const links = role === 'admin'
    ? [['/admin', 'Kelola event'], ['/admin/kuota', 'Kelola kuota'], ['/admin/verifikasi', 'Verifikasi'], ['/admin/status', 'Update status'], ['/admin/data', 'Data & feedback']]
    : [['/', 'Katalog event'], ['/pesanan', 'Pesanan saya']]
  return (
    <>
      <header className="top">
        <div className="w bar">
          <Logo />
          <nav>{links.map(([to, l]) => <NavLink key={to} to={to} end>{l}</NavLink>)}</nav>
          <span className="me">{session.nama}<small>{role}</small></span>
          <button className="btn o s" onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="w">{children}</main>
    </>
  )
}

const customer = [['/', Katalog], ['/event/:id', Detail], ['/event/:id/pesan', Pesan], ['/pesanan', Pesanan], ['/feedback/:orderId', Feedback]]
const admin = [['/admin', Events], ['/admin/kuota', Kuota], ['/admin/verifikasi', Verifikasi], ['/admin/status', Status], ['/admin/data', Data]]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {customer.map(([p, C]) => <Route key={p} path={p} element={<Guard role="customer"><C /></Guard>} />)}
      {admin.map(([p, C]) => <Route key={p} path={p} element={<Guard role="admin"><C /></Guard>} />)}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
