/**
 * DCR CLI client — Language Favorites Viewer.
 *
 * Demonstrates Dynamic Client Registration (RFC 7591): the client POSTs its own metadata
 * to the AS's `registration_endpoint` and receives a `client_id` at runtime, rather than
 * relying on a pre-published metadata document (CIMD) or a statically configured ID.
 *
 * Flow:
 *   1. Discover the OAuth server (reads `registration_endpoint` from .well-known metadata).
 *   2. Register: POST client metadata → AS returns `client_id` + writes dcr-registration.json.
 *      If dcr-registration.json already exists, skip registration and reuse the stored client_id.
 *   3. Build the authorize URL using the registered `client_id` (PKCE, no client secret).
 *   4. User opens the URL, authenticates, and copies the `code` from the redirect URL bar.
 *   5. Exchange the code for an access token (PKCE, no client secret, resource=Languages RS).
 *   6. Call the Languages RS and render the user's favorite languages.
 */

require('dotenv').config({ path: __dirname + '/.env' })
require('../init')

const fs = require('node:fs')
const path = require('node:path')
const { discover, issuerToDiscoveryURL } = require('../lib/discovery')
const { constructAuthorizeURL } = require('../lib/authorize')
const { requireAccessToken, GrantType } = require('../lib/access-token')
const { parseJwt } = require('../lib/jwt')
const { generatePKCE } = require('../pkce')
const { createCLI } = require('../cli')
const { BRIGHT_GREEN, BRIGHT_YELLOW, BRIGHT_CYAN, BOLD, DIM, RESET } = require('../colors')

const REGISTRATION_FILE = path.join(__dirname, 'dcr-registration.json')

const CLIENT_METADATA = {
  client_name: 'Martinovo DCR Tester',
  redirect_uris: ['http://localhost:3005/oauth2/callback'],
  grant_types: ['authorization_code'],
  response_types: ['code'],
  scope: 'read:languages',
  token_endpoint_auth_method: 'none',
}

async function loadOrRegister(registrationEndpoint) {
  if (fs.existsSync(REGISTRATION_FILE)) {
    try {
      const stored = JSON.parse(fs.readFileSync(REGISTRATION_FILE, 'utf8'))
      if (stored.client_id) {
        console.info(`\n♻️  Reusing existing registration (delete dcr-registration.json to re-register)`)
        console.info(`   client_id: ${BRIGHT_YELLOW}${stored.client_id}${RESET}`)
        return stored
      }
    } catch {
      console.warn('⚠️  Could not parse dcr-registration.json — re-registering.')
    }
  }

  if (!registrationEndpoint) {
    console.error('❌ AS discovery metadata does not include a `registration_endpoint`. Cannot register.')
    process.exit(1)
  }

  console.info(`\n📋 Registering client via DCR (RFC 7591)...`)
  console.info(`   POST ${registrationEndpoint}`)

  const response = await fetch(registrationEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CLIENT_METADATA),
  })

  const body = await response.json()

  if (!response.ok) {
    console.error(`\n❌ Registration failed (${response.status}):`, JSON.stringify(body, null, 2))
    process.exit(1)
  }

  fs.writeFileSync(REGISTRATION_FILE, JSON.stringify(body, null, 2))
  console.info(`\n✅ Registration successful — client_id: ${BRIGHT_YELLOW}${body.client_id}${RESET}`)
  console.info(`   Saved to ${path.relative(process.cwd(), REGISTRATION_FILE)}`)
  return body
}

async function main() {
  console.info(`${BOLD}${BRIGHT_GREEN}`)
  console.info('🌐 Language Favorites Viewer — DCR CLI client')
  console.info(`=============================================${RESET}`)

  const oauthServerInfo = await discover(issuerToDiscoveryURL(process.env.OAUTH2_ISSUER_URL))
  const registration = await loadOrRegister(oauthServerInfo['registration_endpoint'])
  const clientId = registration.client_id

  const { codeVerifier, codeChallenge } = generatePKCE()

  const authorizeURL = constructAuthorizeURL({
    authorizationEndpoint: oauthServerInfo['authorization_endpoint'],
    clientId,
    redirectURI: process.env.OAUTH2_REDIRECT_URI,
    resource: process.env.OAUTH2_LANGUAGES_RESOURCE,
    scope: process.env.OAUTH2_SCOPE,
    withPKCE: true,
    codeChallenge,
  })

  console.info(`\n👉 Open this URL in your browser:\n\n${BRIGHT_CYAN}${authorizeURL}${RESET}`)
  console.info(
    `\n   After login, the browser redirects to ${process.env.OAUTH2_REDIRECT_URI}?code=...` +
      ` — the page will fail to load (nothing listens there), but the ${BOLD}code${RESET} is visible in the URL bar.`,
  )

  const cli = createCLI()
  cli.question('\n🔑 Paste the authorization code: ', async (authorizationCode) => {
    cli.close()
    try {
      const { access_token: encodedAccessToken } = await requireAccessToken({
        tokenEndpoint: oauthServerInfo['token_endpoint'],
        grantType: GrantType.AUTHORIZATION_CODE,
        authorizationCode: authorizationCode.trim(),
        clientId,
        // No `clientSecret` — public client (DCR + PKCE, token_endpoint_auth_method=none).
        redirectURI: process.env.OAUTH2_REDIRECT_URI,
        scope: process.env.OAUTH2_SCOPE,
        withPKCE: true,
        codeVerifier,
        resource: process.env.OAUTH2_LANGUAGES_RESOURCE,
      })

      if (!encodedAccessToken) {
        console.error('No access token received.')
        process.exit(1)
      }

      const parsed = parseJwt(encodedAccessToken)
      console.info(`\n${BOLD}Access Token payload${RESET}`)
      console.info('- sub:      ', parsed.payload.sub)
      console.info('- client_id:', parsed.payload.client_id)
      console.info('- aud:      ', parsed.payload.aud)
      console.info('- scope:    ', parsed.payload.scope)

      await renderLanguages(encodedAccessToken)
    } catch (err) {
      console.error('Error:', err.message)
      process.exit(1)
    }
  })
}

async function renderLanguages(accessToken) {
  const url = `${process.env.OAUTH2_LANGUAGES_RESOURCE}/favorite-languages`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error(
      `\n❌ Languages RS call failed (${response.status}): ${errorData.error_description || response.statusText}`,
    )
    return
  }

  const { data: languages } = await response.json()
  console.info(`\n${BOLD}🌐 Your Favorite Languages${RESET}\n`)
  for (const lang of languages) {
    console.info(`  ${BOLD}${BRIGHT_GREEN}${lang.name}${RESET}  ${DIM}(${lang.year})${RESET}`)
    console.info(`  ${DIM}${lang.paradigm}${RESET}`)
    console.info(`  ${lang.description}\n`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
