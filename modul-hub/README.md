# Modul Hub

Website 2 halaman untuk berbagi modul:

- `/` — halaman publik: daftar modul, pencarian, filter tipe. PDF dibuka sebagai flipbook (seperti contoh), gambar/video/audio langsung diputar, Word/PowerPoint/Excel dibuka lewat Office viewer.
- `/admin` — halaman admin (tanpa login): upload, lihat, dan hapus modul.

Penyimpanan memakai **Vercel Blob**, jadi file dan data tetap ada di Vercel.

## Jalan di lokal

```bash
npm install
cp .env.example .env.local   # isi BLOB_READ_WRITE_TOKEN
npm run dev
```

Buka http://localhost:3000 dan http://localhost:3000/admin

## Deploy ke Vercel

1. Upload project ke GitHub (atau pakai `npx vercel` dari folder ini).
2. Di Vercel: **Add New → Project**, pilih repo, lalu **Deploy**.
3. Buka project → tab **Storage** → **Create** → **Blob** → hubungkan ke project ini.
   `BLOB_READ_WRITE_TOKEN` akan terisi otomatis.
4. **Redeploy** sekali agar token terbaca.
5. Selesai. Admin ada di `https://domain-kamu.vercel.app/admin`.

## Catatan

- Halaman admin **tidak dikunci**: siapa pun yang tahu URL `/admin` bisa upload dan menghapus. Pakai URL ini secara terbatas, atau tambahkan password sederhana nanti.
- Ukuran maksimal per file 500 MB (ubah di `app/api/upload/route.js`).
- Preview Word/PPT/Excel memakai Microsoft Office viewer, yang hanya bisa membuka file dari URL publik (tidak bisa saat dicoba di localhost).
- Flipbook PDF memuat halaman secara bertahap, jadi PDF 160 halaman tetap ringan.
