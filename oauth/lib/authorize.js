const { discover } = require('./discovery')

function constructAuthorizeURL({
    authorizationEndpoint,
    clientId,
    redirectURI,
    resource,
    scope,
    withPKCE,
    codeChallenge,
    state,
}) {
    const url = new URL(authorizationEndpoint)
    const params = new URLSearchParams()
    params.append('response_type', 'code')
    params.append('client_id', clientId)
    params.append('redirect_uri', redirectURI)
    // RFC 8707: resource parameter can appear multiple times to request a multi-audience token
    const resources = Array.isArray(resource) ? resource : resource ? [resource] : []
    for (const r of resources) {
        params.append('resource', r)
    }
    if (scope) params.append('scope', scope)
    if (state) params.append('state', state)
    if (withPKCE) {
        params.append('code_challenge', codeChallenge)
        params.append('code_challenge_method', 'S256')
    }
    url.search = params.toString()
    console.info(`Constructed authorization URL: ${url}`)
    console.debug('Authorization URL parameters:', [...params.entries()])
    return url.toString()
}

async function main() {
    console.info('\n\nRunning authorize.js...')
    console.info('=======================')
    const oauthServerInfo = await discover(process.env.OAUTH2_DISCOVERY_URL)
    const authorizationURL = constructAuthorizeURL({
        authorizationEndpoint: oauthServerInfo['authorization_endpoint'],
        clientId: process.env.OAUTH2_CLIENT_ID,
        redirectURI: process.env.OAUTH2_REDIRECT_URI,
        scope: 'openid email',
        withPKCE: true,
    })
    console.info(`Authorization URL: ${authorizationURL}`)
}

if (require.main === module) {
    main()
}

module.exports = {
    constructAuthorizeURL,
}
