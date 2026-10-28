import { useSyncExternalStore } from 'react'

// Data disimpan di localStorage sebagai pengganti backend (sementara).
// Nanti cukup ganti fungsi-fungsi di file ini dengan pemanggilan API.
const KEY = 'eventhub-db'

const seed = {
  session: null,
  users: [
    { id: 1, username: 'customer', password: 'customer123', role: 'customer', nama: 'Ahmad Fauzi' },
    { id: 2, username: 'admin', password: 'admin123', role: 'admin', nama: 'Rizky Pratama' },
  ],
  events: [
    { id: 1, nama: 'Seminar Digital Marketing 2025', kategori: 'Seminar', tanggal: '2025-05-12', waktu: '08.00 - 16.00', lokasi: 'Hotel Grand Inna, Pekanbaru', harga: 150000, kuota: 120, warna: '#1F4FE0', deskripsi: 'Membahas strategi digital marketing terkini, mulai dari social media, SEO, hingga branding online. Cocok untuk pelaku bisnis dan mahasiswa.' },
    { id: 2, nama: 'UI/UX Design Workshop', kategori: 'Workshop', tanggal: '2025-05-20', waktu: '09.00 - 15.00', lokasi: 'Aula Universitas', harga: 100000, kuota: 80, warna: '#0A1F5C', deskripsi: 'Praktik langsung merancang antarmuka aplikasi: riset pengguna, wireframe, hingga prototipe di Figma.' },
    { id: 3, nama: 'Tech Talk: AI for Future', kategori: 'Tech Talk', tanggal: '2025-05-28', waktu: '13.00 - 16.00', lokasi: 'The Zuri Hotel, Pekanbaru', harga: 75000, kuota: 200, warna: '#3B6BFF', deskripsi: 'Diskusi bersama praktisi tentang tren kecerdasan buatan dan dampaknya pada dunia kerja.' },
  ],
  orders: [
    { id: 1, eventId: 1, userId: 1, nama: 'Ahmad Fauzi', wa: '081234567890', email: 'ahmad@email.com', jumlah: 2, status: 'Menunggu Verifikasi', riwayat: [{ s: 'Pengajuan masuk', t: '10/5/2025 09.12' }] },
  ],
  feedbacks: [],
}

let db = JSON.parse(localStorage.getItem(KEY) || 'null') || seed
const subs = new Set()

export const save = (fn) => {
  db = fn(structuredClone(db))
  localStorage.setItem(KEY, JSON.stringify(db))
  subs.forEach((f) => f())
}
export const useDB = () =>
  useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => db)

// ---------- helper ----------
export const STATUS = ['Menunggu Verifikasi', 'Diverifikasi', 'Diproses', 'Terlambat', 'Selesai', 'Ditolak']
export const pillCls = (s) => ({ 'Menunggu Verifikasi': 'y', Diverifikasi: 'p', Diproses: 'p', Terlambat: 'r', Selesai: 'g', Ditolak: 'r' })[s]
export const rupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID')
export const tgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
export const now = () => new Date().toLocaleString('id-ID')
export const nextId = (a) => Math.max(0, ...a.map((x) => x.id)) + 1
export const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)
export const getEvent = (d, id) => d.events.find((e) => e.id === Number(id))

// Cek ketersediaan kuota (use case: include dari Melihat Detail Event & Kuota)
export const terpakai = (d, eventId) =>
  d.orders.filter((o) => o.eventId === eventId && o.status !== 'Ditolak').reduce((a, o) => a + o.jumlah, 0)
export const sisaKuota = (d, eventId) => getEvent(d, eventId).kuota - terpakai(d, eventId)

// ---------- aksi ----------
export const login = (username, password) => {
  const u = db.users.find((x) => x.username === username.trim() && x.password === password)
  if (u) save((d) => ({ ...d, session: u }))
  return u || null
}
export const logout = () => save((d) => ({ ...d, session: null }))
export const setStatus = (id, status, extra = {}) =>
  save((d) => {
    const o = d.orders.find((x) => x.id === id)
    Object.assign(o, extra, { status })
    o.riwayat.push({ s: status, t: now() })
    return d
  })
export const resetDB = () => save(() => structuredClone(seed))
