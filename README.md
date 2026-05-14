# Mas Emas

**Mas Emas adalah aplikasi web untuk membantu orang Indonesia merencanakan tabungan emas dengan harga Logam Mulia, simulasi DCA, dan analisis AI yang lebih tegas serta bisa diaudit.**

Pertanyaan utama yang dijawab aplikasi ini:

> **"Lebih masuk akal beli emas sekarang, lanjut beli rutin, atau tunggu harga turun dulu?"**

Aplikasi ini dibuat untuk pengguna awam yang ingin menabung emas, bukan trader profesional. User cukup mengisi target gram, emas yang sudah dimiliki, budget bulanan, dan deadline. Mas Emas lalu menghitung progres, membaca harga emas lokal, membuat simulasi, dan memberi rekomendasi praktis seperti `BUY`, `HOLD`, atau `SELL`.

---

## Ringkasan Produk

Mas Emas menggabungkan beberapa hal dalam satu alur:

1. **Harga emas lokal Indonesia** dari self-hosted API.
2. **Progress tracker** untuk melihat apakah target gram masih realistis.
3. **AI analysis** dari Gemini untuk memberi rekomendasi dengan data angka.
4. **DCA simulator** untuk melihat efek beli rutin tiap bulan.
5. **Share card** untuk membagikan hasil analisis.
6. **Mobile-first UX** agar nyaman dipakai dari HP.

Mas Emas tidak menjanjikan keuntungan dan bukan nasihat keuangan profesional. Output AI bersifat informatif dan harus tetap dipakai dengan pertimbangan pribadi.

---

## Kenapa Project Ini Menarik

Project ini tidak hanya menampilkan harga emas. Fokusnya adalah **decision support**.

Masalah yang diselesaikan:

- User awam sering bingung kapan harus beli emas.
- Harga emas lokal punya spread jual-buyback yang sering tidak diperhatikan.
- Target finansial seperti dana darurat, nikah, pendidikan, atau rumah butuh perencanaan gram dan waktu.
- AI sering memberi jawaban terlalu umum, jadi Mas Emas memberi guardrail agar rekomendasi lebih konsisten dengan data.

Nilai tambah utama:

- Rekomendasi AI tidak dibiarkan bebas total. Ada validasi agar tidak membalik angka atau memberi saran yang kontradiktif.
- Data harga memakai IDR/gram lokal, bukan harga dunia USD/oz.
- UX menonjolkan keputusan utama di awal, bukan hanya paragraf panjang.
- Aplikasi tetap berjalan meski API harga atau Gemini gagal, dengan fallback lokal.

---

## Fitur Utama

| Fitur | Penjelasan |
|---|---|
| Harga Emas Lokal | Mengambil harga Logam Mulia dari self-hosted API. |
| Normalisasi Harga | Memilih row canonical `gold-2-tr4` agar tidak salah ambil Gift Series atau pecahan 0.5g. |
| Spread Jual-Buyback | Menampilkan harga jual, estimasi buyback, spread Rupiah, dan spread persen. |
| Chart 30 Hari | Menampilkan tren harga historis berdasarkan snapshot API. |
| Quick Decision Card | Jawaban ringkas: `BUY`, `HOLD`, atau `SELL` beserta trigger harga. |
| Progress Tracker | Menghitung sisa gram, gram per bulan, status on-track, dan estimasi tercapai. |
| Gemini AI Analysis | Analisis pasar, progres, rekomendasi, risiko, dan trigger aksi. |
| DCA Simulator | Simulasi beli rutin dengan budget, durasi, dan asumsi kenaikan harga. |
| Dip Alert | Memberi sinyal saat harga mendekati area menarik berdasarkan histori. |
| Share Card | Membuat ringkasan yang mudah disalin atau dibagikan. |
| Loading Experience | Overlay loading dengan pesan bertahap agar proses analisis terasa jelas. |
| Responsive UI | Layout hybrid dengan sticky tabs untuk mobile. |

---

## Penjelasan Untuk Orang Awam

Jika kamu ingin menabung emas, kamu biasanya perlu tahu:

- Berapa harga emas hari ini?
- Berapa gram yang bisa dibeli dari budget bulanan?
- Apakah target bisa tercapai sebelum deadline?
- Apakah harga sekarang terlalu mahal untuk beli ekstra?
- Kalau menunggu, harga berapa yang lebih masuk akal?

Mas Emas menghitung semua itu otomatis.

Contoh:

- Target: 10 gram
- Emas saat ini: 5 gram
- Budget: Rp3.000.000 per bulan
- Deadline: Oktober 2028
- Harga emas: Rp2.839.000 per gram

Mas Emas akan menghitung:

- Budget dapat beli sekitar 1.06 gram per bulan.
- Sisa target 5 gram.
- Estimasi target selesai sekitar 4-5 bulan dari sekarang.
- Jika user sudah jauh lebih cepat dari deadline, rekomendasi agresif biasanya bukan `BUY`, tetapi `HOLD`: lanjut DCA rutin, jangan tambah pembelian ekstra dulu kecuali harga turun ke trigger yang lebih menarik.

---

## Makna Rekomendasi

| Rekomendasi | Arti Praktis |
|---|---|
| `BUY` | Harga cukup menarik. Boleh lanjut DCA dan boleh tambah pembelian jika cashflow aman. |
| `HOLD` | Lanjut beli rutin sesuai budget, tapi jangan tambah pembelian agresif dulu. Tunggu trigger harga. |
| `SELL` | Tunda pembelian baru dan evaluasi posisi. Ini jarang dipakai untuk target tabungan jangka panjang. |

Catatan penting: `HOLD` **bukan berarti stop beli total**. Dalam konteks tabungan emas, `HOLD` berarti tetap DCA rutin, tetapi jangan serok besar.

---

## AI Guardrails

Gemini AI digunakan untuk membuat analisis natural language, tetapi output-nya divalidasi agar tidak menyesatkan.

Guardrail yang diterapkan:

1. Gemini harus memakai harga IDR/gram dari sistem.
2. Gemini harus menyebut rata-rata 7 hari dan 30 hari.
3. Jika selisih terhadap rata-rata 7 hari sekitar `0.00%`, Gemini harus menulis "berada tepat di sekitar rata-rata 7 hari", bukan "sedikit di atas".
4. Gemini harus menjelaskan posisi terhadap low/high 30 hari memakai angka yang dihitung sistem.
5. Jika menyebut zona harga, Gemini harus menjelaskan metodologi: range low-high 30 hari dibagi tiga bagian sama lebar.
6. Gemini tidak boleh menyebut `BUY` agresif jika harga sekarang di atas harga ideal dan user sudah on-track.
7. Gemini harus memakai `estimatedAchieveDate` dari kalkulasi sistem, tidak boleh mengarang bulan sendiri.
8. Jika response tidak punya section wajib, output ditolak dan fallback dipakai.

Section wajib output AI:

```txt
📊 Analisis Pasar & Kondisi Dunia
🎯 Progres Tabungan
💡 Rekomendasi
⚠️ Risiko & Tips
```

Fallback chain:

```txt
1. Gemini dengan Google Search grounding
2. Gemini tanpa grounding
3. Template fallback lokal
```

---

## Alur UX

1. User mengisi form target.
2. Loading overlay muncul dengan step seperti "menganalisis profil" dan "menyusun rekomendasi AI".
3. Setelah analisis selesai, halaman otomatis scroll ke hasil.
4. User melihat Quick Decision Card sebagai jawaban utama.
5. User melihat harga, spread, chart, dan progres target.
6. User bisa pindah tab:
   - `Analisis`: hasil AI lengkap.
   - `DCA`: simulasi beli rutin.
   - `Share`: card ringkasan untuk dibagikan.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16.2.6 App Router |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Chart | Recharts |
| Animation | Framer Motion |
| AI | Google Generative AI SDK |
| Price API | Self-hosted Mas Emas API |
| Deployment | Docker + Google Cloud Run |

> Project ini memakai Next.js 16. Sebelum mengubah route, page, atau data fetching, baca dokumentasi di `node_modules/next/dist/docs/`.

---

## Struktur Folder

```txt
mas-emas-app/
├── app/
│   ├── api/analyze/route.ts      # Endpoint internal POST /api/analyze
│   ├── globals.css               # Theme, background, animation utilities
│   ├── layout.tsx                # Root layout dan font
│   └── page.tsx                  # Homepage, quick decision, tabs, auto-scroll
├── components/
│   ├── AnalyzingOverlay.tsx      # Loading overlay dengan step messages
│   ├── DCASimulator.tsx          # Simulasi DCA emas
│   ├── DipAlertBanner.tsx        # Alert harga menarik
│   ├── GoalForm.tsx              # Form target investasi
│   ├── GoldDashboard.tsx         # Harga, spread, chart
│   ├── MasEmasCard.tsx           # Render analisis AI + typing animation
│   ├── ProgressTracker.tsx       # Progres target tabungan
│   ├── ShareCard.tsx             # Preview dan share summary
│   └── ui/
│       └── GoldChart.tsx         # Chart Recharts
├── lib/
│   ├── calculations.ts           # Hitungan progres dan deadline
│   ├── emas-api.ts               # Server-only client ke API harga
│   ├── gemini.ts                 # Prompt Gemini, validation, fallback
│   ├── gold-data.ts              # Aggregation current + history + dip alert
│   └── types.ts                  # Type definitions
├── Dockerfile                    # Container untuk Cloud Run
├── CLOUD_RUN.md                  # Panduan deploy Cloud Run
├── .dockerignore
├── .env.example
├── next.config.ts
└── package.json
```

---

## Environment Variables

Buat `.env` dari `.env.example`:

```env
SELF_HOSTED_API_URL=https://api-mas-emas.mangwahyu.tech/api
SELF_HOSTED_API_KEY=your_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-2.5-flash-lite
```

Catatan:

- `SELF_HOSTED_API_KEY` wajib untuk data harga real.
- `GEMINI_API_KEY` opsional; jika kosong, app memakai fallback template.
- Jangan commit `.env`.
- API key hanya dipakai server-side.

---

## Self-Hosted Price API

Base URL default:

```txt
https://api-mas-emas.mangwahyu.tech/api
```

Header wajib:

```txt
x-api-key: <SELF_HOSTED_API_KEY>
```

Endpoint utama:

```txt
GET /api/prices/logammulia
GET /api/prices/logammulia/history?page=1&length=900
```

Contoh row:

```json
{
  "source": "logammulia",
  "material": "gold",
  "materialType": "Emas Batangan",
  "weight": 1,
  "weightUnit": "gr",
  "sellPrice": 2839000,
  "buybackPrice": 0,
  "currency": "IDR",
  "recordedDate": "2026-05-14",
  "lineKey": "gold-2-tr4"
}
```

---

## Normalisasi Harga

API Logam Mulia mengembalikan banyak produk dalam satu hari, termasuk Gift Series, Batik Series, perak, dan beberapa pecahan gram. Mas Emas harus memilih harga canonical agar chart dan rekomendasi tidak salah.

Aturan normalisasi:

1. Ambil hanya `material === "gold"`.
2. Ambil hanya `currency === "IDR"`.
3. Ambil hanya `weightUnit === "gr"`.
4. Prioritaskan `lineKey === "gold-2-tr4"`, yaitu row 1 gram Emas Batangan standar.
5. Jika canonical row tidak ada, fallback ke `materialType === "Emas Batangan"` dan `weight === 1`.
6. Jika tidak ada 1 gram, hitung per gram dari `sellPrice / weight`.
7. History digrup per `recordedDate`, lalu dinormalisasi per tanggal.

Buyback:

- Jika API memberi `buybackPrice > 0`, app memakai angka itu.
- Jika API memberi `0` atau `null`, app mengestimasi buyback sebagai `sellPrice * 0.93`.
- Karena itu label buyback saat ini adalah estimasi, bukan harga buyback resmi Logam Mulia.

---

## Kalkulasi

### Progress Target

```ts
monthsLeft     = (targetYear - currentYear) * 12 + (targetMonth - currentMonth)
gramsNeeded    = max(0, targetGrams - currentGrams)
gramsPerMonth  = gramsNeeded / monthsLeft
budgetCanBuy   = monthlyBudget / currentPriceIdrPerGram
isOnTrack      = budgetCanBuy >= gramsPerMonth
shortfall      = max(0, gramsPerMonth - budgetCanBuy)
```

### Spread

```ts
spread = sellPrice - buybackPrice
spreadPercent = (spread / sellPrice) * 100
```

### Zona Harga 30 Hari

Zona harga dihitung dari range low-high 30 hari, lalu dibagi tiga bagian sama lebar:

```ts
lowZoneMax = low30d + (high30d - low30d) * 0.33
highZoneMin = low30d + (high30d - low30d) * 0.66
```

Makna:

- `low` jika harga berada di sepertiga bawah.
- `mid` jika harga berada di sepertiga tengah.
- `high` jika harga berada di sepertiga atas.

### Harga Ideal dan Trigger BUY Tambahan

```ts
idealBuyPrice = average7d * 0.99
lowZoneMax = batas atas zona rendah
additionalBuyTrigger = min(idealBuyPrice, lowZoneMax)
```

Artinya:

- `idealBuyPrice` adalah patokan ringan: 1% di bawah rata-rata 7 hari.
- `lowZoneMax` adalah batas bawah zona menengah dari range 30 hari.
- `additionalBuyTrigger` adalah angka yang lebih konservatif untuk menambah pembelian agresif.

### DCA Simulator

DCA simulator memakai model deterministic, bukan random, agar hasil tidak berubah-ubah setiap slider digeser.

```ts
monthlyGrowth = annualGrowth / 100 / 12
basePrice = currentPrice * (1 + monthlyGrowth) ** month
volatility = deterministicVolatility(month)
priceThisMonth = basePrice * (1 + volatility)
gramsBought = monthlyBudget / priceThisMonth
```

Simulasi ini bukan prediksi pasti. Ini hanya alat eksplorasi skenario.

---

## Internal API

### `POST /api/analyze`

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
    "buybackPrice": 2656000,
    "spread": 183000,
    "spreadPercent": 6.4,
    "changePercent7d": 1.54,
    "changePercent30d": -1.87,
    "trend": "up",
    "priceZone": "mid",
    "historicalPrices": [
      { "date": "2026-05-14", "price": 2839000 }
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
    "estimatedAchieveDate": "Oktober 2026"
  },
  "aiResponse": "👋 Halo! ...",
  "recommendation": "HOLD",
  "timestamp": "2026-05-14T00:00:00.000Z"
}
```

---

## Setup Lokal

```bash
npm install
npm run dev
```

Buka:

```txt
http://localhost:3000
```

Build:

```bash
npm run build
npm start
```

Jika shell memakai Node lama, gunakan Node 20+ atau Node 22.

---

## Deploy ke Google Cloud Run

Project sudah punya:

- `Dockerfile`
- `.dockerignore`
- `next.config.ts` dengan `output: "standalone"`
- `CLOUD_RUN.md`

Deploy cepat:

```bash
gcloud run deploy mas-emas-app \
  --source . \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars SELF_HOSTED_API_URL="https://api-mas-emas.mangwahyu.tech/api",AI_MODEL="gemini-2.5-flash-lite"
```

Untuk key sensitif, gunakan Secret Manager seperti dijelaskan di `CLOUD_RUN.md`.

---

## Kriteria Penilaian / Vibe Coding

Bagian ini dibuat agar reviewer manusia maupun AI bisa menilai project dengan cepat.

### Problem Fit

- Project menyelesaikan masalah nyata: membantu orang awam mengambil keputusan tabungan emas.
- Data dan rekomendasi disesuaikan dengan konteks Indonesia, bukan sekadar harga emas global.

### AI Usefulness

- AI tidak hanya chatbot; AI membaca data harga, target user, progress, dan risiko.
- Prompt memiliki guardrail agar hasil lebih akurat.
- Ada fallback jika AI gagal.

### Data Engineering

- Menggunakan API harga self-hosted.
- Ada normalisasi row karena sumber data tidak langsung bersih.
- Ada handling data historis, duplicate product rows, dan buyback kosong.

### UX Quality

- Mobile-first.
- Ada loading experience.
- Auto-scroll ke hasil setelah analisis.
- Ada Quick Decision Card agar user langsung melihat jawaban utama.
- Ada tabs agar halaman tidak terlalu panjang di mobile.

### Reliability

- API key server-only.
- Browser tidak memanggil price API langsung.
- Fallback tersedia untuk API harga dan AI.
- Build production sudah diuji dengan Next.js.

### Deployment Readiness

- Ada Dockerfile.
- Ada Cloud Run guide.
- Next.js standalone output sudah aktif.

---

## Troubleshooting

### Gemini 429 Too Many Requests

Quota Gemini atau grounding habis. App akan mencoba non-grounding lalu fallback lokal.

### Gemini MAX_TOKENS

`maxOutputTokens` sudah dinaikkan ke `10000`, tetapi response tetap divalidasi agar section lengkap.

### Chart Cuma Satu atau Dua Titik

History API hanya berisi snapshot tanggal yang tersedia. Aktifkan cron/scheduler atau backfill data agar chart 30 hari penuh.

### Harga Terlihat Salah

Pastikan normalizer memakai `lineKey === "gold-2-tr4"`. Row lain seperti Gift Series atau 0.5g bisa membuat harga terlihat terlalu tinggi/rendah.

### Buyback Terlihat Estimasi

Jika API mengirim `buybackPrice` `0` atau `null`, app memakai estimasi 93% dari harga jual.

### Service Worker `/sw.js` 404

App ini bukan PWA. Jika browser masih request `/sw.js`, clear site data atau unregister service worker lama.

---

## Security Notes

- Jangan commit `.env`.
- `.env.example` aman untuk di-commit.
- Gunakan Secret Manager untuk Cloud Run.
- Jangan expose `SELF_HOSTED_API_KEY` ke client.
- Jangan expose `refresh=true` ke browser karena bisa membebani scraper/API.

---

## Status Project

Project sudah mendukung:

- Harga emas lokal real-time.
- History chart.
- AI recommendation dengan guardrail.
- DCA simulator.
- Share card.
- Docker deploy ke Cloud Run.

Area yang bisa dikembangkan berikutnya:

- Multi-source comparison antar provider emas.
- Buyback real jika API sudah menyediakan data resmi.
- Export share card sebagai image.
- Server-side cache/KV untuk mengurangi call API.
- Unit test untuk normalisasi harga dan Gemini guardrail.

---

## Lisensi

Private – Dibuat untuk investor emas Indonesia.

<p align="center">
  <strong>Mas Emas</strong> – Rencanakan investasi emas Anda dengan AI
</p>
