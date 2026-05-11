# Mas Emas

**Kalkulator investasi emas cerdas dengan analisis AI untuk membantu Anda mencapai tujuan finansial.**

Aplikasi web Next.js yang menghitung progres tabungan emas Anda, mengkonversi harga emas dunia (USD/oz) ke Rupiah per gram, dan menghasilkan rekomendasi investasi personal menggunakan Google Gemini AI dengan data pasar real-time.

---

## Fitur

- **Harga Emas Real-Time** – Mengambil data harga emas dunia dari [GoldAPI.io](https://www.goldapi.io/) dengan konversi otomatis ke IDR/gram
- **Kalkulator Tabungan Emas** – Hitung berapa gram yang bisa dibeli per bulan, estimasi kapan target tercapai, dan apakah Anda on-track
- **Analisis AI (Gemini)** – Rekomendasi `BUY` / `HOLD` / `SELL` berdasarkan kondisi pasar & profil tujuan Anda
- **Analisis Kondisi Dunia** – AI membahas faktor global (Fed Rate, DXY, inflasi, geopolitik) yang mempengaruhi harga emas
- **Chart Harga Historis** – Visualisasi tren 7 hari terakhir dalam Rupiah per gram
- **Fallback Otomatis** – Kalau API emas atau AI gagal, sistem tetap berjalan dengan data mock & template lokal
- **Responsive Design** – Mobile-first dengan Tailwind CSS dan glassmorphism UI

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | [Next.js](https://nextjs.org/) 16.2.6 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + PostCSS |
| Fonts | Playfair Display (heading), DM Sans (body) |
| Chart | [Recharts](https://recharts.org/) 3.8 |
| Animation | Framer Motion |
| AI | Google Generative AI SDK (`@google/generative-ai`) |
| External API | GoldAPI.io |

> **Catatan:** Ini Next.js v16 yang memiliki breaking changes dari versi sebelumnya. Baca `node_modules/next/dist/docs/` jika menulis kode baru.

---

## Struktur Folder

```
mas-emas-app/
├── app/
│   ├── api/analyze/route.ts      # API route POST /api/analyze
│   ├── globals.css               # Global styles + Tailwind
│   ├── layout.tsx                # Root layout & fonts
│   └── page.tsx                  # Homepage (GoalForm + Results)
├── components/
│   ├── GoalForm.tsx              # Form input tujuan investasi
│   ├── GoldDashboard.tsx         # Card harga emas & chart
│   ├── MasEmasCard.tsx           # Card analisis AI
│   ├── ProgressTracker.tsx       # Card progres tabungan
│   └── ui/
│       └── GoldChart.tsx         # Line chart harga historis
├── lib/
│   ├── calculations.ts           # Konversi USD/oz → IDR/gram + progress math
│   ├── gemini.ts                 # Gemini AI integration & prompt engineering
│   ├── goldapi.ts                # GoldAPI.io client + caching
│   └── types.ts                  # TypeScript interfaces
├── .env                          # Environment variables (jangan di-commit!)
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

Copy `.env.example` ke `.env` (atau buat file `.env` baru) dan isi:

```env
# GoldAPI.io API Key (opsional – fallback ke mock data jika kosong)
GOLDAPI_KEY=your_goldapi_key_here

# Google Gemini API Key (opsional – fallback ke template jika kosong)
GEMINI_API_KEY=your_gemini_api_key_here

# Model Gemini (default: gemini-2.5-flash-lite)
AI_MODEL=gemini-2.5-flash-lite

# Kurs USD ke IDR (default: 16500)
USD_TO_IDR=16500
```

**Dapatkan API Key:**
- **GoldAPI.io** – [goldapi.io](https://www.goldapi.io/) (free tier: 10 req/hari)
- **Gemini** – [Google AI Studio](https://aistudio.google.com/app/apikey)

### 3. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### 4. Build untuk Production

```bash
npm run build
npm start
```

---

## Alur Data & Arsitektur

```
┌─────────────┐     POST /api/analyze     ┌─────────────────┐
│   Browser   │ ─────────────────────────> │  Next.js API    │
│  (User)     │                            │  (app/api/)     │
└─────────────┘                            └────────┬────────┘
     ^                                              │
     │                                              │ 1. Validasi input
     │                                              │ 2. getGoldData() → GoldAPI.io
     │                                              │ 3. usdOzToIdrGram() → IDR/gram
     │                                              │ 4. calculateGoalProgress()
     │                                              │ 5. generateAnalysis() → Gemini AI
     │                                              │
     └──────────────────────────────────────────────┘
                        JSON Response:
                        - goldData (USD/oz + historis)
                        - currentPriceIdrPerGram (konversi)
                        - progress (progres tabungan)
                        - aiResponse (analisis AI)
                        - recommendation (BUY/HOLD/SELL)
```

### Konversi Harga Emas

```
USD/oz → IDR/gram

IDR per gram = (USD per oz / 31.1035) × USD_TO_IDR
Hasil dibulatkan ke kelipatan 1.000
```

**Contoh:**
- Harga emas: $3,200 USD/oz
- Kurs: Rp 16,500
- Perhitungan: `(3200 / 31.1035) × 16500` ≈ **Rp 1.697.000/gram**

---

## API Endpoint

### `POST /api/analyze`

Menerima data tujuan investasi dan mengembalikan analisis lengkap.

**Request Body:**

```json
{
  "goal": {
    "goalName": "nikah",
    "targetGrams": 40,
    "currentGrams": 2,
    "monthlyBudget": 5000000,
    "deadline": "2028-01"
  }
}
```

**Response:**

```json
{
  "goldData": {
    "currentPrice": 4685.66,
    "changePercent7d": 2.57,
    "trend": "up",
    "priceZone": "mid",
    "historicalPrices": [...],
    "source": "live"
  },
  "currentPriceIdrPerGram": 2488000,
  "progress": {
    "monthsLeft": 20,
    "gramsNeeded": 38,
    "budgetCanBuy": 2.01,
    "isOnTrack": true,
    "estimatedAchieveDate": "Januari 2028"
  },
  "aiResponse": "👋 Halo! ...",
  "recommendation": "HOLD",
  "timestamp": "2026-05-11T00:23:58.256Z"
}
```

---

## Komponen UI

| Komponen | Deskripsi |
|---|---|
| **GoalForm** | Form input: tujuan (nikah, rumah, pendidikan, darurat, lainnya), target gram, tabungan saat ini, budget bulanan, deadline |
| **GoldDashboard** | Menampilkan harga emas IDR/gram hari ini, persen perubahan 7 hari, dan chart historis |
| **GoldChart** | Line chart Recharts dengan konversi data historis ke IDR/gram |
| **ProgressTracker** | Progress bar, statistik progres (gram per bulan, estimasi tercapai, on-track status) |
| **MasEmasCard** | Card analisis AI dengan section parsing (Analisis Pasar, Progres Tabungan, Rekomendasi, Risiko & Tips) |

---

## Logic & Kalkulasi

### Progres Tabungan

```typescript
monthsLeft     = (targetYear - currentYear) × 12 + (targetMonth - currentMonth)
gramsNeeded    = max(0, targetGrams - currentGrams)
gramsPerMonth  = gramsNeeded / monthsLeft
budgetCanBuy   = monthlyBudget / currentPriceIdrPerGram
isOnTrack      = budgetCanBuy >= gramsPerMonth
shortfall      = max(0, gramsPerMonth - budgetCanBuy)
```

### Rekomendasi AI Fallback

Jika Gemini tidak tersedia, sistem menggunakan template lokal:

| Kondisi | Rekomendasi |
|---|---|
| `priceZone === "low"` & tidak on-track | **BUY** |
| `priceZone === "high"` & `changePercent7d > 2%` | **SELL** |
| Lainnya | **HOLD** |

---

## AI Integration (Gemini)

### Model

Default: `gemini-2.5-flash-lite` (dapat di-overwrite via env `AI_MODEL`)

### Fitur

- **Google Search Grounding** – AI mencari data pasar & berita terkini via Google Search tool (best-effort, fallback otomatis kalau gagal)
- **Prompt Engineering** – System prompt terstruktur dengan section emoji, instruksi format, dan larangan markdown
- **Response Validation** – Validasi ketat: panjang minimal, section lengkap, rekomendasi valid, kalimat terakhir selesai
- **Debug Logging** – Log model, finishReason, safety ratings, dan preview response ke console

### Fallback Chain

```
1. Gemini with grounding    → kalau gagal →
2. Gemini without grounding → kalau gagal →
3. Template fallback lokal
```

---

## Troubleshooting

### Harga emas menunjukkan "Data Mock"

- **Penyebab:** GoldAPI key tidak valid atau rate limit tercapai (10 req/hari di free tier)
- **Solusi:** Cek `GOLDAPI_KEY` di `.env`, atau tunggu reset rate limit

### AI selalu menunjukkan fallback/template

- **Penyebab:** Gemini API key tidak valid, model tidak tersedia, atau response AI terpotong
- **Solusi:**
  1. Cek `GEMINI_API_KEY` di `.env`
  2. Cek console log `[Gemini]` untuk error detail
  3. Ganti `AI_MODEL` ke model yang tersedia di project Anda

### Chart tidak tampil / error `width(-1) height(-1)`

- **Solusi:** Sudah di-fix dengan `minHeight` dan `minWidth` di container. Kalau masih terjadi, refresh halaman.

### TypeScript compile error

```bash
npx tsc --noEmit
```

Periksa apakah ada type mismatch setelah update dependency.

---

## Catatan Developer

### Next.js v16 Breaking Changes

Project ini menggunakan Next.js 16 yang memiliki breaking changes dari versi sebelumnya. Sebelum menulis kode baru:

1. Baca guide di `node_modules/next/dist/docs/`
2. Perhatikan deprecation notices
3. Jangan asumsikan API dari Next.js v14/v15 masih sama

### Git Best Practices

- Jangan commit file `.env` (sudah di `.gitignore`)
- Split commit per concern (fitur, fix, chore)
- Contoh pesan commit:
  - `feat: pipe IDR-converted gold price through API response`
  - `fix: improve gold API data integrity and handle weekends`
  - `chore: clean up debug logs and fix parseInt radix`

---

## Lisensi

Private – Dibuat dengan ❤️ untuk investor emas Indonesia.

---

<p align="center">
  <strong>Mas Emas</strong> – Rencanakan investasi emas Anda dengan AI
</p>
