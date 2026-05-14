# Mas Emas

**Kalkulator investasi emas Indonesia dengan harga Logam Mulia real-time, simulasi DCA, dan analisis Gemini AI yang lebih decisif.**

Mas Emas membantu pengguna menjawab pertanyaan utama: **"lebih masuk akal beli emas sekarang, lanjut DCA rutin, atau tunggu harga turun?"**

Aplikasi ini menggunakan Next.js 16 App Router, harga emas lokal Indonesia dari self-hosted API, dan Gemini AI untuk membuat rekomendasi `BUY` / `HOLD` / `SELL` berbasis harga IDR/gram, spread, histori harga, dan target finansial pengguna.

---

## Fitur Terbaru

- **Harga Emas Lokal IDR/gram** – Mengambil harga dari self-hosted Mas Emas API, default source `logammulia`.
- **Buy vs Buyback Spread** – Menampilkan harga jual, harga buyback, spread Rupiah, dan spread persen.
- **Chart Harga Historis** – Menggunakan endpoint `/history` jika database API sudah memiliki snapshot harian.
- **Quick Decision Card** – Ringkasan keputusan langsung: `BUY`, `HOLD`, atau `SELL`, plus trigger harga beli.
- **Analisis AI Gemini** – Prompt sudah dibuat lebih konkret: wajib menyebut rata-rata 7/30 hari, high/low, trigger beli, dan aksi praktis.
- **Kalkulator Progress Target** – Menghitung kebutuhan gram, budget dapat beli, status on-track, dan estimasi target tercapai.
- **Simulasi DCA** – Slider budget, durasi, dan asumsi kenaikan harga untuk estimasi akumulasi gram.
- **Share Card** – Preview card + tombol salin/bagikan untuk membagikan ringkasan analisis.
- **Dip Alert** – Alert berbasis histori harga ketika harga mendekati area menarik.
- **Mobile-first Tab UX** – Setelah hasil muncul, pengguna bisa berpindah tab `Analisis`, `DCA`, dan `Share` tanpa scroll panjang.
- **Fallback Aman** – Jika API emas atau Gemini gagal, app tetap berjalan dengan fallback lokal.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | [Next.js](https://nextjs.org/) 16.2.6 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + PostCSS |
| Fonts | Playfair Display (heading), DM Sans (body) |
| Chart | [Recharts](https://recharts.org/) 3.8 |
| AI | Google Generative AI SDK (`@google/generative-ai`) |
| Price API | Self-hosted Mas Emas API |

> **Catatan penting:** Project ini memakai Next.js 16 yang punya breaking changes. Sebelum menulis kode baru, baca guide relevan di `node_modules/next/dist/docs/`.

---

## Struktur Folder

```
mas-emas-app/
├── app/
│   ├── api/analyze/route.ts      # POST /api/analyze
│   ├── globals.css               # Global styles + Tailwind
│   ├── layout.tsx                # Root layout & fonts
│   └── page.tsx                  # Homepage, result tabs, quick decision card
├── components/
│   ├── DCASimulator.tsx          # Simulasi Dollar Cost Averaging emas
│   ├── DipAlertBanner.tsx        # Banner alert ketika harga turun menarik
│   ├── GoalForm.tsx              # Form input target investasi
│   ├── GoldDashboard.tsx         # Harga emas, spread, chart historis
│   ├── MasEmasCard.tsx           # Render hasil analisis AI
│   ├── ProgressTracker.tsx       # Progress target tabungan emas
│   ├── ShareCard.tsx             # Preview + tombol salin/bagikan
│   └── ui/
│       └── GoldChart.tsx         # Chart Recharts IDR/gram
├── lib/
│   ├── calculations.ts           # Progress math dan helper tanggal
│   ├── emas-api.ts               # Server-only self-hosted API client
│   ├── gemini.ts                 # Gemini prompt, validation, fallback
│   ├── gold-data.ts              # Aggregation current + history + dip alert
│   └── types.ts                  # TypeScript interfaces
├── .env.example                  # Template environment variables
├── next.config.ts
├── postcss.config.mjs
└── package.json
```

---

## Setup & Instalasi

### 1. Clone & Install

```bash
git clone <repo-url>
cd mas-emas-app
npm install
```

### 2. Environment Variables

Copy `.env.example` ke `.env` dan isi:

```env
# Optional, default production API
SELF_HOSTED_API_URL=https://api-mas-emas.mangwahyu.tech/api

# Required untuk fetch harga real dari API self-hosted
SELF_HOSTED_API_KEY=your_api_key_here

# Optional, fallback ke template lokal jika kosong
GEMINI_API_KEY=your_gemini_api_key_here

# Default model
AI_MODEL=gemini-2.5-flash-lite
```

**Catatan security:**
- Jangan commit `.env`.
- `SELF_HOSTED_API_KEY` hanya dipakai server-side di `lib/emas-api.ts`.
- Browser tidak pernah memanggil self-hosted API langsung.
- Semua request harga lewat Next.js server route atau server-only module.

### 3. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### 4. Build Production

```bash
npm run build
npm start
```

Jika shell memakai Node lama, gunakan Node 20+ atau Node 22. Next.js 16 membutuhkan runtime modern.

---

## Self-Hosted API

Base URL default:

```txt
https://api-mas-emas.mangwahyu.tech/api
```

Semua endpoint di bawah `/api/*` butuh header:

```txt
x-api-key: <SELF_HOSTED_API_KEY>
```

### Current Price

```txt
GET /api/prices/logammulia
```

Response sukses:

```json
{
  "success": true,
  "data": [
    {
      "source": "logammulia",
      "material": "gold",
      "materialType": "Emas Batangan",
      "weight": 1,
      "weightUnit": "gr",
      "sellPrice": 2839000,
      "buybackPrice": 0,
      "currency": "IDR",
      "recordedDate": "2026-05-13",
      "lineKey": "gold-2-tr4"
    }
  ],
  "count": 23,
  "timestamp": "2026-05-13T03:44:54.553Z",
  "cached": true
}
```

### History

```txt
GET /api/prices/logammulia/history?page=1&length=900
```

App mengambil raw rows lalu normalisasi lokal. Jangan filter `materialType=antam` di query karena Logam Mulia memakai nilai seperti `Emas Batangan`.

Response sukses:

```json
{
  "success": true,
  "data": [
    {
      "source": "logammulia",
      "material": "gold",
      "materialType": "Emas Batangan",
      "weight": 1,
      "weightUnit": "gr",
      "sellPrice": 2839000,
      "buybackPrice": 0,
      "currency": "IDR",
      "recordedDate": "2026-05-13",
      "createdAt": "2026-05-13T03:44:54.553Z",
      "lineKey": "gold-2-tr4"
    }
  ],
  "pagination": {
    "page": 1,
    "length": 900,
    "total": 23,
    "totalPages": 1
  }
}
```

### Normalisasi Harga

`lib/emas-api.ts` memilih harga canonical dengan aturan:

1. Filter `material === "gold"`.
2. Filter `currency === "IDR"`.
3. Filter `weightUnit === "gr"`.
4. Prefer produk standar: `materialType === "antam"` atau `materialType === "Emas Batangan"`.
5. Prefer `weight === 1`.
6. Jika ada duplicate `weight=1`, pilih harga per gram tertinggi untuk menghindari row pecahan yang salah terlabel 1 gram.
7. Jika tidak ada 1 gram, pakai `sellPrice / weight`.
8. Jika `buybackPrice` kosong atau `0`, app mengestimasi buyback di 93% dari harga jual agar spread tetap bisa ditampilkan.

### Catatan History

Endpoint `/history` membaca snapshot yang tersimpan di database API. Jika database baru punya data satu hari, chart akan menampilkan satu titik saja. Agar chart 30 hari penuh, API perlu cron/scheduler harian atau backfill data historis.

---

## Alur Data & Arsitektur

```
┌─────────────┐      POST /api/analyze      ┌────────────────────┐
│   Browser   │ ──────────────────────────> │ Next.js API Route  │
│  (User)     │                             │ app/api/analyze    │
└─────────────┘                             └─────────┬──────────┘
      ^                                               │
      │                                               │ 1. Validasi input goal
      │                                               │ 2. getGoldData()
      │                                               │ 3. fetch current Logam Mulia
      │                                               │ 4. fetch history Logam Mulia
      │                                               │ 5. normalize IDR/gram
      │                                               │ 6. calculateGoalProgress()
      │                                               │ 7. generateAnalysis() Gemini
      │                                               │
      └───────────────────────────────────────────────┘
                         JSON Response:
                         - goldData IDR-native
                         - currentPriceIdrPerGram
                         - progress
                         - dipAlert
                         - aiResponse
                         - recommendation
```

Tidak ada lagi konversi `USD/oz -> IDR/gram`. Harga dari API sudah IDR-native.

---

## API Internal

### `POST /api/analyze`

Menerima target pengguna dan mengembalikan analisis lengkap.

Request:

```json
{
  "goal": {
    "goalName": "darurat",
    "targetGrams": 10,
    "currentGrams": 5,
    "monthlyBudget": 3000000,
    "deadline": "2028-10"
  }
}
```

Response ringkas:

```json
{
  "goldData": {
    "currentPrice": 2839000,
    "buybackPrice": 2640270,
    "spread": 198730,
    "spreadPercent": 7,
    "changePercent7d": 0,
    "changePercent30d": 0,
    "trend": "sideways",
    "priceZone": "low",
    "historicalPrices": [
      { "date": "2026-05-13", "price": 2839000 }
    ],
    "source": "logammulia"
  },
  "currentPriceIdrPerGram": 2839000,
  "progress": {
    "monthsLeft": 29,
    "gramsNeeded": 5,
    "gramsPerMonth": 0.17,
    "budgetCanBuy": 1.06,
    "isOnTrack": true,
    "estimatedAchieveDate": "Agustus 2027"
  },
  "aiResponse": "👋 Halo! ...",
  "recommendation": "HOLD",
  "timestamp": "2026-05-13T13:45:31.000Z"
}
```

---

## UX Terbaru

Setelah user submit goal, hasil ditampilkan dengan pola hybrid:

1. **Quick Decision Card**
   - Rekomendasi utama.
   - Harga sekarang.
   - Trigger harga beli.
   - Alasan singkat yang actionable.

2. **Summary Dashboard**
   - GoldDashboard: harga, buyback, spread, chart.
   - ProgressTracker: target, sisa gram, budget dapat beli, status on-track.

3. **Sticky Tabs Mobile-first**
   - `Analisis`: hasil Gemini AI.
   - `DCA`: simulasi investasi rutin.
   - `Share`: preview dan tombol bagikan.

Pendekatan ini mencegah mobile page menjadi terlalu panjang, tetapi tetap menampilkan ringkasan penting di awal.

---

## Logic & Kalkulasi

### Progress Target

```typescript
monthsLeft     = (targetYear - currentYear) * 12 + (targetMonth - currentMonth)
gramsNeeded    = max(0, targetGrams - currentGrams)
gramsPerMonth  = gramsNeeded / monthsLeft
budgetCanBuy   = monthlyBudget / currentPriceIdrPerGram
isOnTrack      = budgetCanBuy >= gramsPerMonth
shortfall      = max(0, gramsPerMonth - budgetCanBuy)
```

### Spread

```typescript
spread        = sellPrice - buybackPrice
spreadPercent = (spread / sellPrice) * 100
```

Jika API mengembalikan `buybackPrice = 0`, app mengestimasi buyback sebagai `sellPrice * 0.93` untuk kebutuhan visual spread. Ini perlu diganti jika API sudah menyediakan buyback real.

### DCA Simulator

```typescript
monthlyGrowth = annualGrowth / 100 / 12
priceMonthN   = currentPrice * (1 + monthlyGrowth) ** month
gramsBought   = monthlyBudget / priceMonthN
totalGrams    = sum(gramsBought)
estimatedValue = totalGrams * finalPrice
```

Simulasi DCA bukan prediksi pasti. Ini hanya alat eksplorasi skenario.

---

## Gemini AI

### Model

Default:

```txt
gemini-2.5-flash-lite
```

Bisa diganti via:

```env
AI_MODEL=gemini-2.5-flash-lite
```

### Behavior Prompt

Gemini dipaksa memberi analisis yang lebih decisif, bukan sekadar informatif.

Prompt wajib meminta AI menyebut:

1. Harga sekarang vs rata-rata 7 hari dalam Rupiah dan persen.
2. Harga sekarang vs rata-rata 30 hari.
3. Posisi terhadap high/low 30 hari.
4. Harga ideal untuk beli ringan.
5. Harga beli agresif.
6. Selisih gram jika beli sekarang vs tunggu harga ideal.
7. Kalimat keputusan blunt, misalnya: “Dengan kondisi ini, tunggu dip lebih masuk akal karena ...”.
8. Trigger aksi konkret, misalnya: “Tambah beli jika turun ke RpX/gram”.

Aturan keras:

```txt
Jangan rekomendasikan BUY jika harga sekarang >5% di atas rata-rata 7 hari.
```

Jika Gemini tetap mengeluarkan `BUY` saat harga >5% di atas rata-rata 7 hari, response ditolak dan sistem fallback ke template lokal.

### Fallback Recommendation

Jika Gemini tidak tersedia, sistem memakai template lokal:

| Kondisi | Rekomendasi |
|---|---|
| Harga >5% di atas rata-rata 7 hari | **HOLD** |
| `priceZone === "low"` atau harga <2% di bawah rata-rata 7 hari | **BUY** |
| Harga tinggi dan user on-track | **HOLD** |
| User tidak on-track dan harga tidak mahal | **BUY** |
| Lainnya | **HOLD** |

### Fallback Chain

```txt
1. Gemini with Google Search grounding
2. Gemini without grounding
3. Template fallback lokal
```

---

## Troubleshooting

### `[emas-api] SELF_HOSTED_API_KEY not set`

- **Penyebab:** `.env` belum berisi `SELF_HOSTED_API_KEY`.
- **Solusi:** Isi token API di `.env`, lalu restart dev server.

### `[emas-api] HTTP 401 from logammulia`

- **Penyebab:** token salah atau header `x-api-key` ditolak.
- **Solusi:** Pastikan `SELF_HOSTED_API_KEY` valid.

### History cuma satu tanggal

- **Penyebab:** database API baru punya snapshot satu hari.
- **Solusi:** aktifkan cron/scheduler harian atau backfill data historis.

### Chart tidak tampil / cuma satu titik

- **Penyebab:** `historicalPrices` kosong atau hanya punya satu `recordedDate`.
- **Solusi:** tunggu data historis terkumpul. App tetap menampilkan current price dengan aman.

### Harga terlihat terlalu rendah

- **Penyebab umum:** API Logam Mulia punya duplicate `weight=1`; beberapa row bisa tampak seperti pecahan tetapi terlabel 1 gram.
- **Solusi app:** normalizer memilih canonical `Emas Batangan` dengan harga per gram tertinggi untuk duplicate 1 gram.

### AI selalu fallback/template

- **Penyebab:** `GEMINI_API_KEY` kosong, model tidak tersedia, safety stop, atau response tidak lengkap.
- **Solusi:** cek log `[Gemini]`, isi `GEMINI_API_KEY`, atau ganti `AI_MODEL`.

### Warning Next.js multiple lockfiles

Build bisa tetap sukses, tetapi Next.js mungkin salah infer workspace root. Solusi opsional:

- hapus lockfile parent yang tidak dipakai, atau
- set `turbopack.root` di `next.config.ts`.

---

## Catatan Developer

### Next.js v16 Breaking Changes

Sebelum mengubah route, page, atau data fetching:

1. Baca guide di `node_modules/next/dist/docs/`.
2. Perhatikan deprecation notices.
3. Jangan asumsikan API Next.js v14/v15 masih sama.

### Security

- Jangan commit `.env`.
- `.env.example` boleh di-commit.
- `SELF_HOSTED_API_KEY` tidak boleh dipakai di client component.
- Jangan expose `refresh=true` ke browser karena bisa memaksa scrape dan membebani API.

### Build

```bash
npm run build
```

Jika `npm` memakai Node lama, gunakan PATH Node 20+ atau Node 22.

### Git Best Practices

- Split commit per concern.
- Contoh pesan commit:
  - `feat: migrate gold prices to self-hosted API`
  - `feat: add decisive Gemini recommendation prompt`
  - `feat: add DCA and share result tabs`
  - `fix: normalize Logam Mulia duplicate one-gram rows`

---

## Lisensi

Private – Dibuat untuk investor emas Indonesia.

---

<p align="center">
  <strong>Mas Emas</strong> – Rencanakan investasi emas Anda dengan AI
</p>
