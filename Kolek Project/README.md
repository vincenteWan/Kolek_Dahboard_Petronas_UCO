# Kolek Dashboard API Sharing

## Demo in Repository (GitHub Pages)

This repository now includes a static demo landing page at `docs/index.html`.

After you push to `main`, GitHub Actions deploys it automatically via:
- `.github/workflows/deploy-demo-pages.yml`

Enable GitHub Pages once in repository settings:
1) Open `Settings` -> `Pages`
2) Under `Build and deployment`, set `Source` to `GitHub Actions`

Your demo URL will be:
`https://vincenteWan.github.io/Kolek_Dahboard_Petronas_UCO/`

Note: GitHub Pages is static hosting only. Full backend features still require local Node + MySQL.

## Quick start

1) Set env vars (copy `.env.example` to `.env` and fill in values).
2) Run the server:

```bash
npm start
```

## API key protection

When `API_KEY` or `API_KEYS` is set, all `/api/*` routes require a key.

Header:
- `x-api-key: YOUR_KEY`

Query string (optional):
- `?api_key=YOUR_KEY`

## Health check

```bash
curl http://localhost:3001/api/health
```

## CRUD endpoints

Available entities:
- `household`
- `collector`
- `application`
- `reward`
- `accidentreport`
- `collectionreport`
- `manualreport`

Examples:

```bash
# list
curl -H "x-api-key: YOUR_KEY" http://localhost:3001/api/crud/household

# get one
curl -H "x-api-key: YOUR_KEY" http://localhost:3001/api/crud/collector/C-001

# create
curl -X POST -H "Content-Type: application/json" -H "x-api-key: YOUR_KEY" \
  -d '{"collectorName":"Test","emailAddress":"t@example.com"}' \
  http://localhost:3001/api/crud/collector

# update
curl -X PUT -H "Content-Type: application/json" -H "x-api-key: YOUR_KEY" \
  -d '{"status":"Active"}' \
  http://localhost:3001/api/crud/collector/C-001

# delete
curl -X DELETE -H "x-api-key: YOUR_KEY" \
  http://localhost:3001/api/crud/collector/C-001
```
