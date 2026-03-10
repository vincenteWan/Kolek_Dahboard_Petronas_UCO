# Kolek Dashboard API Sharing

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
