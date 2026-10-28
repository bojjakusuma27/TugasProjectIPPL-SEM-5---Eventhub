import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useDB, save, rupiah, tgl, now, nextId, pillCls, sisaKuota, getEvent } from '../store.js'

const Cover = ({ e, h = 130 }) => (
  <div className="cv" style={{ background: e.warna, height: h }}>
    <i style={{ width: h, height: h, background: '#ffffff26', right: -h / 5, top: -h / 3 }} />
    <i style={{ width: h / 3, height: h / 3, background: '#FFB020', left: 20, bottom: -h / 8 }} />
    <em>{e.kategori}</em>
  </div>
)

// Use case: Melihat Katalog Event
export function Katalog() {
  const db = useDB()
  const [q, setQ] = useState('')
  const [k, setK] = useState('Semua')
  const kats = ['Semua', ...new Set(db.events.map((e) => e.kategori))]
  const list = db.events.filter((e) => (k === 'Semua' || e.kategori === k) && (e.nama + e.lokasi).toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <section className="card dk banner">
        <h1>Halo, {db.session.nama}</h1>
        <p>Event apa yang mau kamu ikuti bulan ini?</p>
      </section>
      <input className="search" placeholder="Cari event atau lokasi" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari event" />
      <div className="chips">{kats.map((c) => <button key={c} className={c === k ? 'on' : ''} onClick={() => setK(c)}>{c}</button>)}</div>
      {list.length === 0 && <p className="m">Tidak ada event yang cocok. Coba kata kunci atau kategori lain.</p>}
      <div className="grid3">
        {list.map((e) => {
          const sisa = sisaKuota(db, e.id)
          return (
            <Link key={e.id} to={`/event/${e.id}`} className="card ev">
              <Cover e={e} />
              <h3>{e.nama}</h3>
              <p className="m">{tgl(e.tanggal)}<br />{e.lokasi}</p>
              <span className={'pill ' + (sisa > 0 ? 'p' : 'r')}>{sisa > 0 ? `${sisa} kuota tersisa` : 'Kuota habis'}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}

// Use case: Melihat Detail Event & Kuota (include: Cek Ketersediaan Kuota)
export function Detail() {
  const { id } = useParams()
  const db = useDB()
  const e = getEvent(db, id)
  if (!e) return <p>Event tidak ditemukan. <Link to="/">Kembali ke katalog</Link></p>
  const sisa = sisaKuota(db, e.id)
  const pct = Math.round(((e.kuota - sisa) / e.kuota) * 100)
  return (
    <div className="card">
      <Cover e={e} h={200} />
      <h1>{e.nama}</h1>
      <p className="m">{tgl(e.tanggal)}, {e.waktu} · {e.lokasi}</p>
      <h3>Deskripsi event</h3>
      <p className="m desc">{e.deskripsi}</p>
      <div className="grid3">
        <div className="stat"><span className="m">Harga tiket</span><b>{rupiah(e.harga)}</b></div>
        <div className="stat"><span className="m">Sisa kuota</span><b>{sisa} / {e.kuota}</b></div>
        <div className="stat"><span className="m">Kategori</span><b>{e.kategori}</b></div>
      </div>
      <div className="bar-k" aria-label={`Kuota terpakai ${pct} persen`}><i style={{ width: pct + '%' }} /></div>
      <div className="row">
        {sisa > 0 ? <Link className="btn" to={`/event/${e.id}/pesan`}>Ajukan pemesanan</Link> : <button className="btn" disabled>Kuota habis</button>}
        <Link className="btn o" to="/">Kembali</Link>
      </div>
    </div>
  )
}

// Use case: Mengajukan Pemesanan
export function Pesan() {
  const { id } = useParams()
  const db = useDB()
  const nav = useNavigate()
  const e = getEvent(db, id)
  const [f, setF] = useState({ jumlah: 1, nama: db.session.nama, wa: '', email: '' })
  const [err, setErr] = useState('')
  if (!e) return <p>Event tidak ditemukan.</p>
  const sisa = sisaKuota(db, e.id)
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value })
  const kirim = (ev) => {
    ev.preventDefault()
    const j = Number(f.jumlah)
    if (!f.nama.trim() || !/^08\d{8,12}$/.test(f.wa) || !/\S+@\S+\.\S+/.test(f.email)) return setErr('Lengkapi nama, nomor WhatsApp (format 08xxxxxxxxxx), dan email yang valid.')
    if (!Number.isInteger(j) || j < 1 || j > sisa) return setErr(`Jumlah tiket harus antara 1 sampai ${sisa}.`)
    save((d) => {
      d.orders.push({ id: nextId(d.orders), eventId: e.id, userId: d.session.id, nama: f.nama, wa: f.wa, email: f.email, jumlah: j, status: 'Menunggu Verifikasi', riwayat: [{ s: 'Pengajuan masuk', t: now() }] })
      return d
    })
    nav('/pesanan')
  }
  return (
    <div className="split">
      <form className="card form" onSubmit={kirim}>
        <h1>Pengajuan pemesanan</h1>
        <label>Jumlah tiket<input type="number" min="1" max={sisa} value={f.jumlah} onChange={set('jumlah')} /></label>
        <label>Nama lengkap<input value={f.nama} onChange={set('nama')} /></label>
        <label>Nomor WhatsApp<input value={f.wa} onChange={set('wa')} placeholder="08xx xxxx xxxx" /></label>
        <label>Email<input value={f.email} onChange={set('email')} placeholder="contoh@email.com" /></label>
        {err && <div className="err" role="alert">{err}</div>}
        <div className="row"><button className="btn" type="submit">Kirim pengajuan</button><Link className="btn o" to={`/event/${e.id}`}>Batal</Link></div>
      </form>
      <aside className="card dk">
        <p className="m">Event dipilih</p>
        <h3>{e.nama}</h3>
        <p className="m">{tgl(e.tanggal)}<br />{e.lokasi}</p>
        <h2>{rupiah(e.harga * (Number(f.jumlah) || 0))}</h2>
        <p className="m">{Number(f.jumlah) || 0} tiket x {rupiah(e.harga)}</p>
      </aside>
    </div>
  )
}

// Use case: Melihat Status Pemesanan
export function Pesanan() {
  const db = useDB()
  const mine = db.orders.filter((o) => o.userId === db.session.id).reverse()
  return (
    <>
      <h1>Pesanan saya</h1>
      {mine.length === 0 && <p className="m">Belum ada pesanan. <Link to="/">Jelajahi katalog event</Link></p>}
      {mine.map((o) => {
        const e = getEvent(db, o.eventId)
        const sudahFb = db.feedbacks.some((f) => f.orderId === o.id)
        return (
          <div className="card order" key={o.id}>
            <div className="row between">
              <div><h3>{e?.nama}</h3><p className="m">{e && tgl(e.tanggal)} · {o.jumlah} tiket · {e && rupiah(e.harga * o.jumlah)}</p></div>
              <span className={'pill ' + pillCls(o.status)}>{o.status}</span>
            </div>
            {o.status === 'Terlambat' && o.keterlambatan && (
              <div className="alert">
                <b>Terjadi keterlambatan pada acara ini</b>
                <p>Alasan: {o.keterlambatan.alasan} · Estimasi: {o.keterlambatan.estimasi}</p>
                <p>Solusi: {o.keterlambatan.solusi}</p>
              </div>
            )}
            <div className="tl">{o.riwayat.map((r, i) => <div key={i}><b>{r.s}</b><span className="m"> {r.t}</span></div>)}</div>
            {o.status === 'Selesai' && !sudahFb && <Link className="btn s" to={`/feedback/${o.id}`}>Beri feedback</Link>}
            {sudahFb && <span className="m">Feedback sudah terkirim. Terima kasih!</span>}
          </div>
        )
      })}
    </>
  )
}

// Use case: Memberikan Feedback
export function Feedback() {
  const { orderId } = useParams()
  const db = useDB()
  const nav = useNavigate()
  const o = db.orders.find((x) => x.id === Number(orderId) && x.userId === db.session.id)
  const [r, setR] = useState(0)
  const [k, setK] = useState('')
  const [err, setErr] = useState('')
  if (!o || o.status !== 'Selesai') return <p>Feedback hanya bisa diberikan untuk pesanan yang sudah selesai. <Link to="/pesanan">Kembali</Link></p>
  const e = getEvent(db, o.eventId)
  const kirim = (ev) => {
    ev.preventDefault()
    if (!r) return setErr('Pilih rating bintang terlebih dahulu.')
    save((d) => { d.feedbacks.push({ id: nextId(d.feedbacks), orderId: o.id, eventId: o.eventId, user: d.session.nama, rating: r, komentar: k.trim(), t: now() }); return d })
    nav('/pesanan')
  }
  return (
    <form className="card form narrow" onSubmit={kirim}>
      <h1>Berikan feedback</h1>
      <p className="m">Bagaimana pengalamanmu di {e.nama}?</p>
      <div className="stars" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} className={n <= r ? 'on' : ''} onClick={() => setR(n)} aria-label={`${n} bintang`}>★</button>)}
      </div>
      <label>Komentar<textarea rows="4" value={k} onChange={(e) => setK(e.target.value)} placeholder="Tulis komentarmu di sini" /></label>
      {err && <div className="err" role="alert">{err}</div>}
      <div className="row"><button className="btn" type="submit">Kirim feedback</button><Link className="btn o" to="/pesanan">Batal</Link></div>
    </form>
  )
}
