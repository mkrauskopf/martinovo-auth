# Changelog

## 2026-03-19

- Personalities Resource Server (port 3004) — a protected API for famous-people data per language, with per-user
  filtering.
- Token Exchange grant type (RFC 8693) support in the shared access-token library.
- Languages RS calls Personalities RS via Token Exchange, preserving the user's identity (`sub`) through the
  RS-to-RS call — unlike the Libraries RS call which uses Client Credentials (no user context).
- Favorites App shows both libraries and personalities when clicking a language tile.
- Standalone Token Exchange grant script for CLI testing.

## 2026-03-18

- Mandatory audience (`aud`) validation in all Resource Servers. Each RS requires `OAUTH2_AUDIENCE` and rejects
  tokens not intended for it, preventing token confusion attacks.
- Replace hardcoded `resource` parameter in authorize and token requests with caller-provided values (RFC 8707),
  supporting multiple audiences for tokens targeting more than one RS.
- Per-user language filtering in the Languages Resource Server.
- Architecture diagram and documentation for the OAuth playground.

## 2026-03-17

- Libraries Resource Server (port 3003) — a protected API for library data.
- Languages RS fetches libraries from Libraries RS using the Client Credentials grant (machine-to-machine).
- Libraries section integrated into the Favorites App dashboard.

## 2026-03-12

- Languages Resource Server (port 3002) — a protected API for programming language data.
- Favorites App displays favorite languages alongside colors.

## 2026-03-11

- Initial OAuth playground setup.
- Colors Resource Server (port 3001) — a protected API for color data.
- Favorites App (port 3000) — OAuth client using Authorization Code + PKCE flow.
- Shared libraries for OAuth discovery, authorization, access tokens, and JWT parsing.
- PKCE generator utility.
- Client Credentials and Authorization Code grant examples.
