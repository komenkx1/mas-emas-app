# Deploy ke Google Cloud Run

Project ini sudah disiapkan untuk Cloud Run dengan `Dockerfile` dan Next.js `output: "standalone"`.

## 1. Build Docker Lokal

```bash
docker build -t mas-emas-app .
docker run --rm -p 8080:8080 \
  -e SELF_HOSTED_API_KEY="your_api_key" \
  -e GEMINI_API_KEY="your_gemini_key" \
  -e AI_MODEL="gemini-2.5-flash-lite" \
  mas-emas-app
```

Buka `http://localhost:8080`.

## 2. Deploy Langsung dari Source

Cara paling sederhana:

```bash
gcloud run deploy mas-emas-app \
  --source . \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars SELF_HOSTED_API_URL="https://api-mas-emas.mangwahyu.tech/api",AI_MODEL="gemini-2.5-flash-lite"
```

Setelah service jadi, tambahkan secret env vars untuk key sensitif lewat Console atau CLI.

## 3. Set Secret Environment Variables

Direkomendasikan pakai Secret Manager untuk key sensitif.

```bash
printf "your_self_hosted_api_key" | gcloud secrets create mas-emas-self-hosted-api-key --data-file=-
printf "your_gemini_api_key" | gcloud secrets create mas-emas-gemini-api-key --data-file=-

gcloud run services update mas-emas-app \
  --region asia-southeast2 \
  --set-secrets SELF_HOSTED_API_KEY=mas-emas-self-hosted-api-key:latest,GEMINI_API_KEY=mas-emas-gemini-api-key:latest
```

## 4. Deploy dengan Image Manual

```bash
PROJECT_ID="your-gcp-project-id"
REGION="asia-southeast2"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/mas-emas/mas-emas-app:latest"

gcloud artifacts repositories create mas-emas \
  --repository-format=docker \
  --location=$REGION

gcloud builds submit --tag "$IMAGE" .

gcloud run deploy mas-emas-app \
  --image "$IMAGE" \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars SELF_HOSTED_API_URL="https://api-mas-emas.mangwahyu.tech/api",AI_MODEL="gemini-2.5-flash-lite" \
  --set-secrets SELF_HOSTED_API_KEY=mas-emas-self-hosted-api-key:latest,GEMINI_API_KEY=mas-emas-gemini-api-key:latest
```

## Env Vars

| Name | Required | Notes |
|---|---:|---|
| `SELF_HOSTED_API_URL` | No | Default: `https://api-mas-emas.mangwahyu.tech/api` |
| `SELF_HOSTED_API_KEY` | Yes | Key self-hosted price API, pakai Secret Manager |
| `GEMINI_API_KEY` | No | Jika kosong, app pakai fallback lokal |
| `AI_MODEL` | No | Default: `gemini-2.5-flash-lite` |

Cloud Run otomatis menyediakan `PORT`; Dockerfile memakai default `8080`.
