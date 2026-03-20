# Token Narrowing: Who Enforces Single-Audience Access Tokens?

In OAuth 2.0 with RFC 8707 (Resource Indicators), a client application should present each Resource Server (RS)
with an Access Token (AT) targeted exclusively to that RS — not a "big" multi-audience token. This is the principle
of least privilege applied to OAuth tokens.

But who is responsible for enforcing this?

## All Three Parties Have a Role

### Authorization Server (AS) — Enables Narrowing

The AS honours the `resource` parameter (RFC 8707) and issues tokens scoped to the requested audience. A strict AS
could refuse multi-audience tokens altogether, but most are permissive: if the client requests multiple `resource`
values, the AS will issue a multi-audience token.

The AS also supports **token narrowing via Refresh Token**: the client can exchange its RT with a single `resource`
parameter to obtain a narrowed AT for one specific RS.

### Client Application — Primary Enforcer

A well-behaved client should **always request the narrowest token** it needs for each RS call. Even if the AS
happily issues a multi-audience token, the client should not use one.

The recommended pattern:

1. Initial Authorization Code exchange — obtain a broad AT + Refresh Token (RT).
2. Before calling each RS — use the RT with a specific `resource` and `scope` to get a **dedicated, narrowed AT**
   for that RS only.

**Caveat: Refresh Token rotation.** Many Authorization Servers rotate the RT on each use (one-time RT). This means
the narrowing requests must be **sequential**, not parallel — each exchange consumes the current RT and returns a
new one that must be used for the next call.

See [Refresh Token Rotation](refresh-token-rotation.md) for a deeper look at one-time vs reusable RTs and how
OAuth 2.1 is making rotation the default.

This is where the best practice is actually implemented. Neither the AS nor the RS can fully compensate if the
client sends overly broad tokens.

### Resource Server (RS) — Last Line of Defense

Each RS **must** validate the `aud` (audience) claim and reject tokens not intended for it. However, if a token
lists both Colors RS and Languages RS in its audience, both RSes will accept it — they each see themselves
in the `aud` array.

An RS *could* enforce single-audience (reject tokens where `aud` contains more than its own identifier), but this
is not standard practice and would break legitimate multi-RS scenarios.

## Where the Real Risk Is

The threat is **token replay across resource servers**. If Colors RS is compromised and leaks the AT, and that
token also includes Languages RS in its audience, an attacker can replay it against Languages RS.

**Only client-side narrowing prevents this.** The RS cannot protect itself against a token that validly includes
it in the audience.

## When a multi-audience token may still appear

It is not always forbidden. Some systems do issue tokens with multiple audiences, for example:

- tightly related APIs behind one logical API product
- gateway-centric architectures
- internal microservice platforms with shared trust boundaries

But this is usually a tradeoff for convenience, not the strongest default.

## Good rule of thumb

Use a multi-audience token only when the Resource Servers are effectively part of the same protection domain and are
meant to share the same authorization boundary.

If they are truly separate APIs, separate teams, separate data domains, or separate risk profiles, use separate tokens.

## Bottom line
Yes — **the best practice is usually to obtain two separate access tokens, each scoped to exactly one Resource Server /
audience.**

The exception is when both Resource Servers are intentionally treated as one trust domain and you consciously accept the
broader token scope.

## Summary

| Party      | Role                                  | Enforcement                                      |
|------------|---------------------------------------|--------------------------------------------------|
| **AS**     | Enables narrowing via RT + `resource` | Permissive — honours what the client asks for     |
| **Client** | Requests narrowest possible tokens    | **Primary enforcer** — this is where we must act  |
| **RS**     | Validates `aud` includes itself       | Last line — but cannot catch overly broad tokens  |

## References

- [RFC 8707 — Resource Indicators for OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc8707)
- [RFC 6749 — The OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7519 — JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)
