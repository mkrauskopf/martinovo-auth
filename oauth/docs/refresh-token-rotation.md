# Refresh Token Rotation

Not all Authorization Servers handle Refresh Tokens the same way. Understanding the RT lifecycle is critical when
implementing token narrowing, because it determines whether you can narrow tokens in parallel or must do so
sequentially.

## One-Time RT (Rotate on Each Use)

Some ASes rotate the RT on every token request. When the client exchanges an RT for a new AT, the response includes a
**new RT** and the old one is immediately invalidated. This is called a **one-time RT** or **sender-constrained RT**.

The security benefit is clear: if an RT is leaked, it can only be used once. Any replay attempt after the legitimate
client has already used it will fail, and the AS can detect the anomaly and revoke the entire grant.

**Impact on token narrowing:** each narrowing request consumes the current RT and produces a new one. The requests
**must be sequential** — the client must chain each rotated RT into the next exchange.

## Reusable RT (No Rotation)

Other ASes issue a long-lived RT that remains valid across multiple exchanges. The client can use the same RT
repeatedly to obtain narrowed ATs for different resource servers.

**Impact on token narrowing:** requests can be made **in parallel**, since the RT is not invalidated on use. This is
simpler to implement but offers weaker protection against RT leakage.

## Configurable Per Client

Most mature Authorization Servers — Auth0, Okta, Keycloak — let you configure RT rotation on a per-client basis.
Confidential clients (server-side apps with a client secret) often use reusable RTs, while public clients (SPAs,
mobile apps) are configured with rotation enabled.

## The Trend: OAuth 2.1

The [OAuth 2.1 draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12) makes RT rotation the
**default expectation**. Section 6.1 requires that the AS either sender-constrain the RT or rotate it on each use.

This means token narrowing code should **always be written to handle rotation** — chain RTs sequentially and update
the stored RT after each exchange. If the AS happens not to rotate, the code still works correctly (it just stores
the same RT again). The reverse is not true: code that assumes reusable RTs will break when rotation is enabled.
