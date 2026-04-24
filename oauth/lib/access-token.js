const { discover, issuerToDiscoveryURL } = require('./discovery')

const GrantType = Object.freeze({
  AUTHORIZATION_CODE: 'authorization_code',
  CLIENT_CREDENTIALS: 'client_credentials',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXCHANGE: 'urn:ietf:params:oauth:grant-type:token-exchange',
})

async function requireAccessToken({
  tokenEndpoint,
  grantType,
  clientId,
  clientSecret,
  scope,
  authorizationCode,
  redirectURI,
  withPKCE = false,
  codeVerifier,
  resource,
  refreshToken,
  subjectToken,
  subjectTokenType,
  audience,
}) {
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
  if (clientSecret) {
    headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
  }
  const params = new URLSearchParams()
  if (!clientSecret) {
    params.append('client_id', clientId)
  }
  params.append('grant_type', grantType)
  if (grantType === GrantType.CLIENT_CREDENTIALS) {
    params.append('scope', scope)
  } else if (grantType === GrantType.AUTHORIZATION_CODE) {
    params.append('code', authorizationCode)
    params.append('redirect_uri', redirectURI)
    if (withPKCE) {
      params.append('code_verifier', codeVerifier)
    }
  } else if (grantType === GrantType.REFRESH_TOKEN) {
    params.append('refresh_token', refreshToken)
    if (scope) params.append('scope', scope)
  } else if (grantType === GrantType.TOKEN_EXCHANGE) {
    params.append('subject_token', subjectToken)
    params.append('subject_token_type', subjectTokenType)
    if (audience) {
      params.append('audience', audience)
    }
    if (scope) {
      params.append('scope', scope)
    }
  } else {
    throw Error(`Unknown grant type: ${grantType}`)
  }
  // RFC 8707: resource parameter can appear multiple times to request a multi-audience token
  const resources = Array.isArray(resource) ? resource : resource ? [resource] : []
  for (const r of resources) {
    params.append('resource', r)
  }

  console.info(`POST ${tokenEndpoint}`)
  console.info('\nHeaders:\n', headers)
  console.info('\nBody:\n', [...params.entries()])

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers,
      body: params,
    })

    const tokenData = await response.json()
    console.debug('\nAccess Token Response:', JSON.stringify(tokenData, null, 2))
    return tokenData
  } catch (error) {
    console.error('Error fetching access token:', error)
  }
}

async function main() {
  console.info('\n\nRunning access_token.js...')
  console.info('==========================')
  const oauthServerInfo = await discover(issuerToDiscoveryURL(process.env.OAUTH2_ISSUER_URL))

  // Taken from the `authorize` response in browser
  const authorizationCode = '4ef772438ec148b2b14d6a241a551af7'

  requireAccessToken({
    tokenEndpoint: oauthServerInfo['token_endpoint'],
    grantType: GrantType.AUTHORIZATION_CODE,
    clientId: process.env.OAUTH2_CLIENT_ID,
    clientSecret: process.env.OAUTH2_CLIENT_SECRET,
    authorizationCode,
    redirectURI: process.env.OAUTH2_REDIRECT_URI,
    withPKCE: true,
  })
}

if (require.main === module) {
  main()
}

module.exports = {
  requireAccessToken,
  GrantType,
}
