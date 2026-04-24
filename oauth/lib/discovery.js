require('dotenv').config()
require('../init')

const assert = require('node:assert/strict')

async function main() {
  const oauthServerInfo = await discover(issuerToDiscoveryURL(process.env.OAUTH2_ISSUER_URL))
  console.info(`OAuth Server Info:\n${JSON.stringify(oauthServerInfo, null, 2)}`)
}

// RFC 8414 path-insertion: the well-known segment is inserted between the origin and any issuer path.
function issuerToDiscoveryURL(issuerURL) {
  const url = new URL(issuerURL)
  const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '')
  return `${url.origin}/.well-known/oauth-authorization-server${pathname}`
}

async function discover(discoveryURL) {
  try {
    assert(discoveryURL !== undefined, 'discoveryURL not defined?')
    const response = await fetch(discoveryURL)
    const oauthServerInfo = await response.json()
    console.debug('✅ OAuth Server Info:', {
      issuer: oauthServerInfo.issuer,
      authorization_endpoint: oauthServerInfo.authorization_endpoint,
      token_endpoint: oauthServerInfo.token_endpoint,
      introspection_endpoint: oauthServerInfo.introspection_endpoint,
    })
    return oauthServerInfo
  } catch (discoveryError) {
    console.warn('⚠️  Warning: Could not connect to OAuth:')
    console.warn('   Discovery URL:', discoveryURL)
    console.warn('   Error:', discoveryError.message)
    throw discoveryError
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  discover,
  issuerToDiscoveryURL,
}
