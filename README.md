# Audit Crucible Tracker

Website tracker internal untuk program **Audit Crucible** (Bulan 4-6 CEM) —
mencakup checklist audit (MQAA, 6S, Visual Management, HSE, PS), ritme
mingguan, dan audit report builder (Root Cause / Action Plan / Lesson
Learned).

Stack: Next.js (App Router) + Drizzle ORM + PostgreSQL (Neon), dirancang
untuk deploy ke Vercel.

---

## 1. Persiapan Database (Neon)

1. Buat project baru di [neon.tech](https://neon.tech) (atau gunakan project
   Postgres yang sudah ada).
2. Salin **Connection String**-nya. Formatnya kira-kira:
   ```
   postgresql://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
   ```

## 2. Environment Variables

Buat file `.env` di root project (untuk development lokal):

```bash
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
APP_PASSWORD="ganti-dengan-password-kamu-sendiri"
```

| Variable | Wajib? | Keterangan |
|---|---|---|
| `DATABASE_URL` | Ya | Connection string dari Neon (atau Postgres lain) |
| `APP_PASSWORD` | Ya | Password untuk login ke dashboard. Kalau tidak diset, fallback ke `crucible2026` — **wajib diganti sebelum deploy production**. |

> ⚠️ Jangan commit file `.env` ke Git. Pastikan `.env` ada di `.gitignore`.

## 3. Install & Migrasi Database (Lokal)

```bash
npm install

# Push schema ke database (membuat tabel: audit_checklists, 
# weekly_cadence, audit_reports, login_attempts)
npx drizzle-kit push
```

Data awal (checklist Agustus/Oktober) akan otomatis ter-seed sendiri saat
pertama kali aplikasi dibuka — tidak perlu seed manual.

## 4. Jalankan Lokal

```bash
npm run dev
```

Buka `http://localhost:3000` → akan redirect ke `/login` → masukkan
`APP_PASSWORD` yang sudah kamu set di `.env`.

## 5. Deploy ke Vercel

### a. Push ke GitHub
```bash
git init
git add .
git commit -m "Initial commit: Audit Crucible Tracker"
git remote add origin <url-repo-github-kamu>
git push -u origin main
```

### b. Import ke Vercel
1. Buka [vercel.com/new](https://vercel.com/new), pilih repo GitHub ini.
2. Sebelum klik Deploy, buka **Settings → Environment Variables**, tambahkan:
   - `DATABASE_URL` → connection string Neon kamu
   - `APP_PASSWORD` → password production (jangan pakai yang sama dengan
     password lokal/testing)
3. Klik **Deploy**.

### c. Push Schema ke Database Production

Jalankan ini **dari lokal komputer kamu**, arahkan ke database production
(bisa pakai flag `--environment=production` di Vercel CLI kalau
`DATABASE_URL` ke-mask, atau langsung copy connection string dari Neon
dashboard):

```bash
DATABASE_URL="<connection-string-production>" npx drizzle-kit push
```

> Catatan dari pengalaman project sebelumnya (Kaizen PDCA app): kalau
> Vercel CLI mask `DATABASE_URL` saat `vercel env pull`, gunakan flag
> `--environment=production`, atau ambil connection string langsung dari
> Neon dashboard sebagai workaround.

## 6. Verifikasi Setelah Deploy

- [ ] Buka domain Vercel kamu → harus redirect ke `/login`
- [ ] Login pakai `APP_PASSWORD` production → berhasil masuk dashboard
- [ ] Coba salah password 5x → harus muncul pesan lockout (rate limit
      tersimpan di database, jadi tetap akurat walau serverless function
      restart)
- [ ] Checklist Agustus & Oktober muncul otomatis (auto-seeded)
- [ ] Coba centang salah satu checklist → refresh halaman → status
      tercentang harus tetap tersimpan

---

## Struktur Fitur Keamanan

| Fitur | Implementasi |
|---|---|
| Login | Cookie session `httpOnly`, signed HMAC-SHA256 |
| Perbandingan password | Constant-time comparison (tahan timing attack) |
| Rate limiting | Disimpan di database (`login_attempts` table) — konsisten walau berjalan di banyak instance serverless Vercel |
| Sanitasi input | Strip `<script>`, `<iframe>`, `<object>`, `<embed>`, `javascript:`, `data:text/html`, dengan batas panjang teks (default 2000 karakter) |
| Middleware | Proteksi semua route kecuali `/login` dan `/api/login`, redirect otomatis jika belum login |

## Struktur Data

- **audit_checklists** — item checklist per bulan (Agustus/September/Oktober) dan domain (MQAA, 6S, Visual Management, HSE, PS)
- **weekly_cadence** — jadwal mingguan Senin-Jumat dengan status per hari
- **audit_reports** — laporan audit (Root Cause, Action Plan, Lesson Learned)
- **login_attempts** — tracking percobaan login gagal untuk rate limiting

## Troubleshooting

**Build gagal dengan error "DATABASE_URL is required"**
→ Pastikan `DATABASE_URL` sudah di-set di Environment Variables Vercel
  (bukan cuma di `.env` lokal).

**Data checklist tidak muncul setelah deploy**
→ Cek apakah `npx drizzle-kit push` sudah dijalankan ke database
  production. Tabel harus ada dulu sebelum auto-seed bisa jalan.

**Lupa password production**
→ Update `APP_PASSWORD` di Vercel Environment Variables, lalu redeploy
  (atau trigger redeploy manual dari dashboard Vercel).
