# Resource Server

A minimal OAuth 2.0 Resource Server demo that exposes a Bearer-token-protected `/favorite-colors` endpoint.

## How to Run

Run from the parent `oauth/` directory (dependencies and `.env` live there):

```bash
node colors-resource/resources-server.js
```

Or with auto-reload:

```bash
npx nodemon colors-resource/resources-server.js
```

The server listens on **port 3001**.

> **Note:** There is no dedicated npm script; invoke the server directly via `node`.

## Features

### Endpoints

- **`GET /`** — Unprotected root endpoint; returns API info and a list of available endpoints
- **`GET /health`** — Unprotected health check; returns service status and timestamp
- **`GET /favorite-colors`** — Protected endpoint; returns static color data from `colors.json` (requires Bearer token)

### Bearer Token Enforcement

The `validateAccessToken` middleware:
- Extracts and validates the `Authorization: Bearer <token>` header
- Returns `401 Unauthorized` if the header is missing, malformed, or the token is empty
- Stores token info in the request for use by downstream handlers

### Token Validation (Stub)

Currently, any non-empty token is accepted. JWT signature verification and introspection using OAuth server endpoint 
are to be implemented.

### Static Resource Data

The protected endpoint returns five color objects from `colors.json`, each with:
- `id` — unique identifier
- `name` — human-readable color name
- `hex` — hex color code
- `description` — flavor text

### Shared Setup

The server loads `../init.js`, which:
- Runs `dotenv` from the parent `oauth/` directory
- Disables TLS certificate verification (development only)

## Testing

### Start the server

```bash
cd oauth
node colors-resource/resources-server.js
```

### Check health (unprotected)

```bash
curl http://localhost:3001/health
```

### Access protected endpoint without token (expect 401)

```bash
curl http://localhost:3001/favorite-colors
```

Expected response:
```json
{
  "error": "unauthorized",
  "error_description": "Missing or invalid authorization header"
}
```

### Access protected endpoint with Bearer token (expect 200)

```bash
curl -H "Authorization: Bearer anytoken" http://localhost:3001/favorite-colors
```

Expected response:
```json
{
  "message": "Successfully retrieved favorite colors",
  "data": [
    {
      "id": 1,
      "name": "Ocean Blue",
      "hex": "#006994",
      "description": "A deep, calming blue reminiscent of ocean depths"
    },
    ...
  ],
  "timestamp": "2026-03-06T12:34:56.789Z",
  "requestedBy": "demo-client"
}
```
