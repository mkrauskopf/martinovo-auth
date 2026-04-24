/**
 * CIMD CLI client — Color Palette Analyzer.
 *
 * Demonstrates a public OAuth client (PKCE only, no secret) whose `client_id` is the public URL
 * of its metadata document (Client ID Metadata Document, draft-ietf-oauth-client-id-metadata-document).
 *
 * Flow:
 *   1. Discover the OAuth server.
 *   2. Build the authorize URL using the CIMD URL as `client_id`.
 *   3. User opens the URL, authenticates, and copies the `code` from the redirect URL bar.
 *   4. Exchange the code for an access token (PKCE, no client secret).
 *   5. Call the Colors RS and render the palette as ANSI background swatches.
 */

require('dotenv').config({ path: __dirname + '/.env' })
require('../init')

const { discover, issuerToDiscoveryURL } = require('../lib/discovery')
const { constructAuthorizeURL } = require('../lib/authorize')
const { requireAccessToken, GrantType } = require('../lib/access-token')
const { parseJwt } = require('../lib/jwt')
const { generatePKCE } = require('../pkce')
const { createCLI } = require('../cli')
const { BRIGHT_CYAN, BRIGHT_YELLOW, BOLD, RESET } = require('../colors')

async function main() {
  console.info(`${BOLD}${BRIGHT_CYAN}`)
  console.info('🎨 Color Palette Analyzer — CIMD CLI client')
  console.info(`============================================${RESET}`)
  console.info(`client_id: ${BRIGHT_YELLOW}${process.env.OAUTH2_CLIENT_ID}${RESET}`)

  const oauthServerInfo = await discover(issuerToDiscoveryURL(process.env.OAUTH2_ISSUER_URL))
  const { codeVerifier, codeChallenge } = generatePKCE()

  const authorizeURL = constructAuthorizeURL({
    authorizationEndpoint: oauthServerInfo['authorization_endpoint'],
    clientId: process.env.OAUTH2_CLIENT_ID,
    redirectURI: process.env.OAUTH2_REDIRECT_URI,
    resource: process.env.OAUTH2_COLORS_RESOURCE,
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
        clientId: process.env.OAUTH2_CLIENT_ID,
        // No `clientSecret` — public client (CIMD + PKCE).
        redirectURI: process.env.OAUTH2_REDIRECT_URI,
        scope: process.env.OAUTH2_SCOPE,
        withPKCE: true,
        codeVerifier,
        resource: process.env.OAUTH2_COLORS_RESOURCE,
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

      await renderPalette(encodedAccessToken)
    } catch (err) {
      console.error('Error:', err.message)
      process.exit(1)
    }
  })
}

async function renderPalette(accessToken) {
  const url = `${process.env.OAUTH2_COLORS_RESOURCE}/favorite-colors`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error(
      `\n❌ Colors RS call failed (${response.status}): ${errorData.error_description || response.statusText}`,
    )
    return
  }

  const { data: colors } = await response.json()
  console.info(`\n${BOLD}🎨 Your Color Palette${RESET}\n`)
  for (const color of colors) {
    const [r, g, b] = hexToRgb(color.hex)
    const swatch = `\x1b[48;2;${r};${g};${b}m          ${RESET}`
    console.info(`  ${swatch}  ${color.hex}  ${BOLD}${color.name}${RESET}`)
    console.info(`                        ${color.description}\n`)
  }
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
