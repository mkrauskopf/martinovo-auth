/**
 * Fetches an access token using the Authorization Code grant type.
 */

require('dotenv').config({ path: __dirname + '/.env' })

const { discover } = require('../lib/discovery')
const { constructAuthorizeURL } = require('../lib/authorize')
const { requireAccessToken, GrantType } = require('../lib/access-token')
const { generatePKCE } = require('../pkce')
const { createCLI } = require('../cli')

async function main() {
    console.info()
    console.info('Authorization Code Grant')
    console.info('========================')
    const oauthServerInfo = await discover(process.env.OAUTH2_DISCOVERY_URL)
    const { codeVerifier, codeChallenge } = generatePKCE()
    const authorizeURL = constructAuthorizeURL({
        authorizationEndpoint: oauthServerInfo['authorization_endpoint'],
        clientId: process.env.OAUTH2_CLIENT_ID,
        redirectURI: process.env.OAUTH2_REDIRECT_URI,
        scope: process.env.OAUTH2_SCOPE,
        withPKCE: true,
        codeChallenge,
    })
    console.info(`Authorize URL: ${authorizeURL}`)

    const cli = createCLI()
    cli.question('\n🔑 Enter the authorization code from the browser: ', (authorizationCode) => {
        cli.close()
        requireAccessToken({
            grantType: GrantType.AUTHORIZATION_CODE,
            authorizationCode,
            tokenEndpoint: oauthServerInfo['token_endpoint'],
            clientId: process.env.OAUTH2_CLIENT_ID,
            clientSecret: process.env.OAUTH2_CLIENT_SECRET,
            redirectURI: process.env.OAUTH2_REDIRECT_URI,
            withPKCE: true,
            codeVerifier,
        })
    })
}

if (require.main === module) {
    main().catch((error) => console.error(error))
}
