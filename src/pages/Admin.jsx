import { useState } from 'react'
import { useDB, save, rupiah, tgl, now, nextId, setStatus, stars } from '../store.js'

export function Events() {
  const db = useDB()
  const [form, setForm] = useState({ nama:'', kategori:'Seminar', tanggal:'', waktu:'', lokasi:'', harga:'', kuota:'', warna:'#1F4FE0', deskripsi:'' })
  const [msg, setMsg] = useState('')
  const add = (e) => {
    e.preventDefault()
    if (!form.nama || !form.tanggal || !form.lokasi || !form.harga || !form.kuota) return setMsg('Lengkapi data event terlebih dahulu.')
    save(d => { d.events.push({ ...form, id: nextId(d.events), harga:Number(form.harga), kuota:Number(form.kuota) }); return d })
    setForm({ nama:'', kategori:'Seminar', tanggal:'', waktu:'', lokasi:'', harga:'', kuota:'', warna:'#1F4FE0', deskripsi:'' }); setMsg('Event berhasil ditambahkan.')
  }
  return <>
    <h1>Kelola event</h1>
    <form className="card form" onSubmit={add}>
      <h2>Tambah event</h2>
      <label>Nama event<input value={form.nama} onChange={e=>setForm({...form,nama:e.target.value})}/></label>
      <div className="grid3"><label>Kategori<select value={form.kategori} onChange={e=>setForm({...form,kategori:e.target.value})}><option>Seminar</option><option>Workshop</option><option>Tech Talk</option></select></label><label>Tanggal<input type="date" value={form.tanggal} onChange={e=>setForm({...form,tanggal:e.target.value})}/></label><label>Waktu<input value={form.waktu} onChange={e=>setForm({...form,waktu:e.target.value})} placeholder="09.00 - 15.00"/></label></div>
      <div className="grid3"><label>Lokasi<input value={form.lokasi} onChange={e=>setForm({...form,lokasi:e.target.value})}/></label><label>Harga<input type="number" value={form.harga} onChange={e=>setForm({...form,harga:e.target.value})}/></label><label>Kuota<input type="number" value={form.kuota} onChange={e=>setForm({...form,kuota:e.target.value})}/></label></div>
      <label>Deskripsi<textarea rows="3" value={form.deskripsi} onChange={e=>setForm({...form,deskripsi:e.target.value})}/></label>
      {msg && <div className="ok">{msg}</div>}<button className="btn">Tambah event</button>
    </form>
    <div className="grid3">{db.events.map(e=><div className="card" key={e.id}><h3>{e.nama}</h3><p className="m">{tgl(e.tanggal)} · {e.lokasi}</p><p>{rupiah(e.harga)} · {e.kuota} kuota</p></div>)}</div>
  </>
}

export function Kuota() {
  const db=useDB()
  return <><h1>Kelola kuota</h1><div className="grid3">{db.events.map(e=>{const used=db.orders.filter(o=>o.eventId===e.id&&o.status!=='Ditolak').reduce((a,o)=>a+o.jumlah,0); return <div className="card" key={e.id}><h3>{e.nama}</h3><p>{used} terpakai dari {e.kuota}</p><div className="bar-k"><i style={{width:Math.min(100,used/e.kuota*100)+'%'}}/></div></div>})}</div></>
}

export function Verifikasi() {
  const db=useDB(); const pending=db.orders.filter(o=>o.status==='Menunggu Verifikasi')
  return <><h1>Verifikasi pesanan</h1>{pending.length===0&&<p className="m">Tidak ada pengajuan yang menunggu verifikasi.</p>}{pending.map(o=><div className="card order" key={o.id}><h3>Pesanan #{o.id}</h3><p>{o.nama} · {o.jumlah} tiket · {o.email}</p><div className="row"><button className="btn" onClick={()=>setStatus(o.id,'Diverifikasi')}>Verifikasi</button><button className="btn o" onClick={()=>setStatus(o.id,'Ditolak')}>Tolak</button></div></div>)}</>
}

export function Status() {
  const db=useDB(); const active=db.orders.filter(o=>!['Selesai','Ditolak'].includes(o.status)); const statuses=['Menunggu Verifikasi','Diverifikasi','Diproses','Terlambat','Selesai','Ditolak']
  return <><h1>Update status</h1>{active.length===0&&<p className="m">Tidak ada pesanan aktif.</p>}{active.map(o=><div className="card order" key={o.id}><h3>Pesanan #{o.id}</h3><p>{o.nama}</p><select value={o.status} onChange={e=>setStatus(o.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></div>)}</>
}

export function Data() {
  const db=useDB();
  return <><h1>Data & feedback</h1><div className="grid3"><div className="stat card"><span className="m">Total event</span><b>{db.events.length}</b></div><div className="stat card"><span className="m">Total pesanan</span><b>{db.orders.length}</b></div><div className="stat card"><span className="m">Total feedback</span><b>{db.feedbacks.length}</b></div></div>{db.feedbacks.length===0?<p className="m">Belum ada feedback.</p>:db.feedbacks.map(f=><div className="card" key={f.id}><b>{f.user}</b> · {stars(f.rating)}<p>{f.komentar||'Tanpa komentar'}</p><small>{f.t}</small></div>)}</>
}
