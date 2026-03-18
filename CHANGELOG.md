# Changelog

## 2026-03-18

- Mandatory audience (`aud`) validation in all Resource Servers. Each RS requires `OAUTH2_AUDIENCE` and rejects
  tokens not intended for it, preventing token confusion attacks.
- Replace hardcoded `resource` parameter in authorize and token requests with caller-provided values (RFC 8707),
  supporting multiple audiences for tokens targeting more than one RS.
- Per-user language filtering in the Languages Resource Server.
- `user-languages.json` mapping file (git-ignored) with an example template.
