const { discover } = require('./discovery')

const GrantType = Object.freeze({
    AUTHORIZATION_CODE: 'authorization_code',
    CLIENT_CREDENTIALS: 'client_credentials',
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
}) {
    const authorizationHeader = `${clientId}:${clientSecret}`
    const headers = {
        Authorization: `Basic ${Buffer.from(authorizationHeader).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    const body = {
        grant_type: grantType,
    }
    if (grantType === GrantType.CLIENT_CREDENTIALS) {
        body.scope = scope
    } else if (grantType === GrantType.AUTHORIZATION_CODE) {
        body.code = authorizationCode
        body.redirect_uri = redirectURI
        if (withPKCE) {
            body.code_verifier = codeVerifier
        }
        body.resource = "http://localhost:3001/favorite-trees"
    } else {
        throw Error(`Unknown grant type: ${grantType}`)
    }

    console.info(`POST ${tokenEndpoint}`)
    console.info('\nHeaders:\n', headers)
    console.info('\nBody:\n', body)

    try {
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers,
            body: new URLSearchParams(body),
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
    const oauthServerInfo = await discover(process.env.OAUTH2_DISCOVERY_URL)

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
