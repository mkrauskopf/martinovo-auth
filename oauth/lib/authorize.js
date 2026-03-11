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
    const searchParams = {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectURI,
        resource: "http://localhost:3001/favorite-trees",
        scope,
        state,
    }
    if (withPKCE) {
        searchParams.code_challenge = codeChallenge
        searchParams.code_challenge_method = 'S256'
    }
    url.search = new URLSearchParams(searchParams).toString()
    console.info(`Constructed authorization URL: ${url}`)
    console.debug('Authorization URL parameters:', searchParams)
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
